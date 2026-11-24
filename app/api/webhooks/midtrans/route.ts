import { NextResponse } from "next/server";

import {
  getMidtransSubscription,
  getMidtransTransactionStatus,
  verifyMidtransSignature,
  type MidtransTransaction,
} from "@/lib/midtrans";
import {
  activateInitialSubscription,
  applyRecurringCharge,
  applyRemoteSubscriptionState,
  mapPaymentStatus,
} from "@/lib/payments";
import { createAdminSupabase } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";
import type { Payment } from "@/types/domain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Payload = Record<string, unknown>;
type WebhookStatus = Database["public"]["Enums"]["webhook_status"];

function text(payload: Payload, key: string): string | null {
  const value = payload[key];

  if (typeof value === "string" && value.length > 0) return value;
  if (typeof value === "number") return String(value);
  return null;
}

function numberFrom(value: string | null): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.round(parsed) : 0;
}

function transactionFromPayload(payload: Payload): MidtransTransaction {
  return {
    transactionId: text(payload, "transaction_id"),
    orderId: text(payload, "order_id"),
    transactionStatus: text(payload, "transaction_status"),
    fraudStatus: text(payload, "fraud_status"),
    statusCode: text(payload, "status_code"),
    grossAmount: text(payload, "gross_amount"),
    paymentType: text(payload, "payment_type"),
    savedTokenId: text(payload, "saved_token_id"),
    subscriptionId: text(payload, "subscription_id"),
    transactionTime: text(payload, "transaction_time"),
  };
}

export async function POST(request: Request) {
  if (!process.env.MIDTRANS_SERVER_KEY) {
    return NextResponse.json({ ok: false, error: "Gateway belum dikonfigurasi." }, { status: 503 });
  }

  let payload: Payload;

  try {
    payload = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ ok: false, error: "Payload tidak valid." }, { status: 400 });
  }

  const orderId = text(payload, "order_id");
  const subscriptionId = text(payload, "subscription_id");
  const transactionStatus = text(payload, "transaction_status");
  const statusCode = text(payload, "status_code");
  const grossAmount = text(payload, "gross_amount");
  const signatureKey = text(payload, "signature_key");
  const transactionId = text(payload, "transaction_id");
  const fraudStatus = text(payload, "fraud_status");
  const remoteStatus = text(payload, "status");

  const isTransaction = Boolean(orderId && transactionStatus);
  const eventKey = isTransaction
    ? `transaction:${transactionId ?? orderId}:${transactionStatus}`
    : subscriptionId
      ? `subscription:${subscriptionId}:${text(payload, "current_interval") ?? remoteStatus ?? "unknown"}`
      : null;

  if (!eventKey) {
    return NextResponse.json({ ok: false, error: "Event tidak dikenali." }, { status: 400 });
  }

  const admin = createAdminSupabase();

  const { data: existingEvent } = await admin
    .from("webhook_events")
    .select("id, status")
    .eq("event_key", eventKey)
    .maybeSingle();

  if (existingEvent && (existingEvent.status === "processed" || existingEvent.status === "ignored")) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  let eventId = existingEvent?.id ?? null;

  if (eventId) {
    await admin
      .from("webhook_events")
      .update({ status: "received", error: null })
      .eq("id", eventId);
  } else {
    const { data: created, error } = await admin
      .from("webhook_events")
      .insert({
        provider: "midtrans",
        event_key: eventKey,
        event_type: isTransaction ? "transaction" : "subscription",
        payload: payload as never,
        status: "received",
      })
      .select("id")
      .single();

    if (error || !created) {
      if (error?.code === "23505") {
        return NextResponse.json({ ok: true, duplicate: true });
      }

      console.error("Gagal menyimpan webhook event:", error?.code);
      return NextResponse.json({ ok: false }, { status: 503 });
    }

    eventId = created.id;
  }

  async function finish(status: WebhookStatus, error?: string) {
    if (!eventId) return;

    await admin
      .from("webhook_events")
      .update({
        status,
        processed_at: new Date().toISOString(),
        error: error ? error.slice(0, 500) : null,
      })
      .eq("id", eventId);
  }

  try {
    // ------------------------------------------------ notifikasi transaksi
    if (isTransaction && orderId && transactionStatus) {
      if (!statusCode || !grossAmount || !signatureKey) {
        await finish("failed", "Field signature tidak lengkap.");
        return NextResponse.json({ ok: false, error: "Signature tidak lengkap." }, { status: 401 });
      }

      const valid = verifyMidtransSignature({
        orderId,
        statusCode,
        grossAmount,
        signatureKey,
      });

      if (!valid) {
        await finish("failed", "Signature tidak valid.");
        return NextResponse.json({ ok: false, error: "Signature tidak valid." }, { status: 401 });
      }

      // Charge recurring tidak punya baris payment lokal sebelum event ini.
      if (subscriptionId && !orderId.startsWith("HF-")) {
        const remote = await getMidtransSubscription(subscriptionId);

        if (!remote) {
          await finish("failed", "Subscription Midtrans tidak ditemukan.");
          return NextResponse.json({ ok: false, error: "Subscription tidak ditemukan." }, { status: 401 });
        }

        if (transactionStatus === "settlement" || transactionStatus === "capture") {
          await applyRecurringCharge(admin, {
            gatewaySubscriptionId: subscriptionId,
            orderId,
            transactionId,
            amount: numberFrom(grossAmount),
            paidAt: new Date().toISOString(),
            nextExecutionAt: remote.nextExecutionAt,
          });
        }

        await applyRemoteSubscriptionState(admin, remote);
        await finish("processed");
        return NextResponse.json({ ok: true });
      }

      const { data: payment } = await admin
        .from("payments")
        .select("*")
        .eq("gateway_order_id", orderId)
        .maybeSingle();

      if (!payment) {
        await finish("ignored", "Order tidak ditemukan.");
        return NextResponse.json({ ok: true, ignored: true });
      }

      if (numberFrom(grossAmount) !== payment.amount) {
        await finish("failed", "Nominal tidak cocok dengan payment.");
        return NextResponse.json({ ok: false, error: "Nominal tidak cocok." }, { status: 400 });
      }

      const paymentStatus = mapPaymentStatus(transactionStatus, fraudStatus);
      const paidAt =
        paymentStatus === "paid" ? (payment.paid_at ?? new Date().toISOString()) : null;

      await admin
        .from("payments")
        .update({
          status: paymentStatus,
          paid_at: paidAt,
          gateway_transaction_id: transactionId,
        })
        .eq("id", payment.id);

      if (paymentStatus === "paid") {
        const authoritative = await getMidtransTransactionStatus(orderId);
        const transaction = authoritative ?? transactionFromPayload(payload);
        const updatedPayment = { ...(payment as Payment), status: "paid", paid_at: paidAt } as Payment;

        if (subscriptionId) {
          const remote = await getMidtransSubscription(subscriptionId);
          if (remote) {
            await applyRecurringCharge(admin, {
              gatewaySubscriptionId: subscriptionId,
              orderId,
              transactionId,
              amount: payment.amount,
              paidAt: paidAt ?? new Date().toISOString(),
              nextExecutionAt: remote.nextExecutionAt,
            });
            await applyRemoteSubscriptionState(admin, remote);
          }
        } else {
          await activateInitialSubscription(admin, updatedPayment, transaction);
        }
      }

      await finish("processed");
      return NextResponse.json({ ok: true });
    }

    // ------------------------------------------------ notifikasi subscription
    if (subscriptionId) {
      const remote = await getMidtransSubscription(subscriptionId);

      if (!remote) {
        await finish("ignored", "Subscription Midtrans tidak ditemukan.");
        return NextResponse.json({ ok: true, ignored: true });
      }

      if (
        (transactionStatus === "settlement" || transactionStatus === "capture") &&
        orderId &&
        grossAmount
      ) {
        await applyRecurringCharge(admin, {
          gatewaySubscriptionId: subscriptionId,
          orderId,
          transactionId,
          amount: numberFrom(grossAmount),
          paidAt: new Date().toISOString(),
          nextExecutionAt: remote.nextExecutionAt,
        });
      }

      await applyRemoteSubscriptionState(admin, remote);
      await finish("processed");
      return NextResponse.json({ ok: true });
    }

    await finish("ignored", "Event tidak relevan.");
    return NextResponse.json({ ok: true, ignored: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook gagal diproses.";
    console.error("Webhook Midtrans gagal:", message);
    await finish("failed", message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
