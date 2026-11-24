import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  createMidtransSubscription,
  disableMidtransSubscription,
  type MidtransSubscription,
  type MidtransTransaction,
} from "@/lib/midtrans";
import type { Database } from "@/types/database";
import type { Payment, PaymentStatus, SubscriptionStatus } from "@/types/domain";

type AdminClient = SupabaseClient<Database>;

const GRACE_DAYS = 3;

/** Payment pending yang masih dianggap aktif untuk mencegah checkout ganda. */
export const PENDING_PAYMENT_WINDOW_MINUTES = 30;

export function mapPaymentStatus(
  transactionStatus: string | null,
  fraudStatus: string | null,
): PaymentStatus {
  switch (transactionStatus) {
    case "capture":
      return fraudStatus === "challenge" ? "pending" : "paid";
    case "settlement":
      return "paid";
    case "pending":
      return "pending";
    case "deny":
    case "cancel":
    case "failure":
      return "failed";
    case "expire":
      return "expired";
    case "refund":
    case "partial_refund":
    case "chargeback":
    case "partial_chargeback":
      return "refunded";
    default:
      return "pending";
  }
}

export function mapSubscriptionStatus(
  remoteStatus: string | null,
  currentPeriodEnd: string | null,
  localStatus: SubscriptionStatus | null,
  now: Date = new Date(),
): SubscriptionStatus {
  if (localStatus === "canceled") return "canceled";

  if (remoteStatus === "active") return "active";
  if (remoteStatus === "canceled") return "canceled";
  if (remoteStatus === "pending") return "pending";

  if (remoteStatus === "inactive") {
    if (!currentPeriodEnd) return "expired";

    const graceEnd = new Date(currentPeriodEnd);
    graceEnd.setUTCDate(graceEnd.getUTCDate() + GRACE_DAYS);

    return graceEnd.getTime() >= now.getTime() ? "past_due" : "expired";
  }

  return localStatus ?? "pending";
}

export function addOneMonth(date: Date): Date {
  const next = new Date(date);
  const day = next.getUTCDate();
  next.setUTCMonth(next.getUTCMonth() + 1);

  // Hindari overflow 31 Januari -> 3 Maret.
  if (next.getUTCDate() < day) {
    next.setUTCDate(0);
  }

  return next;
}

export interface InitialActivationResult {
  subscriptionId: string | null;
  gatewaySubscriptionId: string | null;
  currentPeriodEnd: string | null;
}

/**
 * Mengaktifkan periode pertama setelah pembayaran awal sukses, lalu membuat
 * recurring subscription di Midtrans. Fitur berbayar hanya aktif jika
 * subscription Midtrans berhasil dibuat (TASK-024).
 */
export async function activateInitialSubscription(
  admin: AdminClient,
  payment: Payment,
  transaction: MidtransTransaction,
): Promise<InitialActivationResult> {
  if (payment.subscription_id) {
    const { data: existing } = await admin
      .from("subscriptions")
      .select("*")
      .eq("id", payment.subscription_id)
      .maybeSingle();

    if (existing?.gateway_subscription_id && existing.status === "active") {
      await cancelOtherSubscriptions(admin, payment.user_id, existing.id);
      return {
        subscriptionId: existing.id,
        gatewaySubscriptionId: existing.gateway_subscription_id,
        currentPeriodEnd: existing.current_period_end,
      };
    }
  }

  const { data: plan } = await admin
    .from("plans")
    .select("*")
    .eq("id", payment.plan_id)
    .maybeSingle();

  const { data: profile } = await admin
    .from("users")
    .select("email, name")
    .eq("id", payment.user_id)
    .maybeSingle();

  if (!plan || !profile) {
    throw new Error("Plan atau profil user tidak ditemukan.");
  }

  const paidAt = payment.paid_at ? new Date(payment.paid_at) : new Date();
  const firstRecurringAt = addOneMonth(paidAt);

  let subscriptionId = payment.subscription_id;

  if (!subscriptionId) {
    const { data: created, error } = await admin
      .from("subscriptions")
      .insert({
        user_id: payment.user_id,
        plan_id: payment.plan_id,
        status: "pending",
        current_period_start: paidAt.toISOString(),
        current_period_end: firstRecurringAt.toISOString(),
      })
      .select("id")
      .single();

    if (error || !created) {
      throw new Error("Gagal membuat subscription lokal.");
    }

    subscriptionId = created.id;

    await admin
      .from("payments")
      .update({ subscription_id: subscriptionId })
      .eq("id", payment.id);
  }

  const { data: localSubscription } = await admin
    .from("subscriptions")
    .select("*")
    .eq("id", subscriptionId)
    .maybeSingle();

  if (!localSubscription) {
    throw new Error("Subscription lokal tidak ditemukan.");
  }

  if (localSubscription.gateway_subscription_id && localSubscription.status === "active") {
    await cancelOtherSubscriptions(admin, payment.user_id, localSubscription.id);
    return {
      subscriptionId: localSubscription.id,
      gatewaySubscriptionId: localSubscription.gateway_subscription_id,
      currentPeriodEnd: localSubscription.current_period_end,
    };
  }

  if (!transaction.savedTokenId) {
    throw new Error("Transaksi tidak menyimpan token kartu untuk recurring.");
  }

  const remote = await createMidtransSubscription({
    name: `HabitFlow ${plan.name}`,
    amount: payment.amount,
    token: transaction.savedTokenId,
    startTime: firstRecurringAt.toISOString(),
    customerName: profile.name || profile.email.split("@")[0],
    customerEmail: profile.email,
  });

  const periodEnd = remote.nextExecutionAt ?? firstRecurringAt.toISOString();

  const { error: updateError } = await admin
    .from("subscriptions")
    .update({
      status: "active",
      gateway_subscription_id: remote.id,
      current_period_start: paidAt.toISOString(),
      current_period_end: periodEnd,
    })
    .eq("id", localSubscription.id);

  if (updateError) {
    throw new Error("Gagal menyimpan subscription Midtrans.");
  }

  await admin
    .from("payments")
    .update({
      status: "paid",
      paid_at: paidAt.toISOString(),
      subscription_id: localSubscription.id,
    })
    .eq("id", payment.id);

  await cancelOtherSubscriptions(admin, payment.user_id, localSubscription.id);

  return {
    subscriptionId: localSubscription.id,
    gatewaySubscriptionId: remote.id,
    currentPeriodEnd: periodEnd,
  };
}

async function cancelOtherSubscriptions(
  admin: AdminClient,
  userId: string,
  keepSubscriptionId: string,
): Promise<void> {
  const { data: others } = await admin
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["active", "past_due"])
    .neq("id", keepSubscriptionId);

  for (const other of others ?? []) {
    if (other.gateway_subscription_id) {
      const disabled = await disableMidtransSubscription(other.gateway_subscription_id);

      if (!disabled) {
        console.error(
          `Gagal menonaktifkan subscription lama ${other.id}; perlu tindakan manual.`,
        );
      }
    }

    await admin
      .from("subscriptions")
      .update({
        status: "canceled",
        canceled_at: other.canceled_at ?? new Date().toISOString(),
      })
      .eq("id", other.id);
  }
}

/**
 * Mencatat charge recurring dan memperpanjang periode. Dipanggil dari webhook
 * setelah signature/notifikasi terverifikasi.
 */
export async function applyRecurringCharge(
  admin: AdminClient,
  input: {
    gatewaySubscriptionId: string;
    orderId: string;
    transactionId: string | null;
    amount: number;
    paidAt: string;
    nextExecutionAt?: string | null;
  },
): Promise<boolean> {
  const { data: subscription } = await admin
    .from("subscriptions")
    .select("*")
    .eq("gateway_subscription_id", input.gatewaySubscriptionId)
    .maybeSingle();

  if (!subscription) return false;

  const { data: existingPayment } = await admin
    .from("payments")
    .select("id")
    .eq("gateway_order_id", input.orderId)
    .maybeSingle();

  if (!existingPayment) {
    const { error } = await admin.from("payments").insert({
      user_id: subscription.user_id,
      subscription_id: subscription.id,
      plan_id: subscription.plan_id,
      gateway_order_id: input.orderId,
      gateway_transaction_id: input.transactionId,
      amount: input.amount,
      status: "paid",
      paid_at: input.paidAt,
    });

    if (error && error.code !== "23505") {
      throw new Error("Gagal mencatat pembayaran recurring.");
    }
  }

  const base = subscription.current_period_end
    ? new Date(subscription.current_period_end)
    : new Date(input.paidAt);

  const periodEnd = input.nextExecutionAt ?? addOneMonth(base).toISOString();

  const { error } = await admin
    .from("subscriptions")
    .update({
      status: "active",
      current_period_end: periodEnd,
    })
    .eq("id", subscription.id);

  if (error) {
    throw new Error("Gagal memperpanjang periode subscription.");
  }

  return true;
}

export async function applyRemoteSubscriptionState(
  admin: AdminClient,
  remote: MidtransSubscription,
): Promise<boolean> {
  const { data: subscription } = await admin
    .from("subscriptions")
    .select("*")
    .eq("gateway_subscription_id", remote.id)
    .maybeSingle();

  if (!subscription) return false;

  const status = mapSubscriptionStatus(
    remote.status,
    subscription.current_period_end,
    subscription.status,
  );

  const { error } = await admin
    .from("subscriptions")
    .update({
      status,
      current_period_end: remote.nextExecutionAt ?? subscription.current_period_end,
      canceled_at:
        status === "canceled"
          ? (subscription.canceled_at ?? new Date().toISOString())
          : subscription.canceled_at,
    })
    .eq("id", subscription.id);

  if (error) {
    throw new Error("Gagal menyinkronkan status subscription.");
  }

  return true;
}
