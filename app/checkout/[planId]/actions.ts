"use server";

import { redirect } from "next/navigation";

import { requireOnboardedAccount } from "@/lib/auth/account";
import { getActivePlans } from "@/services/plans";
import { createMidtransSnapTransaction } from "@/lib/midtrans";
import { PENDING_PAYMENT_WINDOW_MINUTES } from "@/lib/payments";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { clientEnv, hasMidtrans } from "@/lib/env";
import { formString } from "@/lib/validation";
import type { FormState } from "@/lib/validation";

export async function createCheckoutAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const { user, entitlement, supabase } = await requireOnboardedAccount();
  const planId = formString(formData, "planId");

  if (!hasMidtrans()) {
    return {
      status: "error",
      message: "Pembayaran belum tersedia. Hubungi dukungan bila masalah berlanjut.",
    };
  }

  const plans = await getActivePlans();
  const plan = plans.find((candidate) => candidate.id === planId);

  if (!plan || plan.code === "free") {
    return { status: "error", message: "Paket tidak ditemukan." };
  }

  const samePlanIsActive =
    entitlement.planCode === plan.code && entitlement.subscription?.status !== "canceled";

  if (samePlanIsActive) {
    return { status: "error", message: "Paket ini sedang aktif di akunmu." };
  }

  const pendingSince = new Date(
    Date.now() - PENDING_PAYMENT_WINDOW_MINUTES * 60_000,
  ).toISOString();

  const { data: pendingPayment } = await supabase
    .from("payments")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .gte("created_at", pendingSince)
    .limit(1)
    .maybeSingle();

  if (pendingPayment) {
    return {
      status: "error",
      message:
        "Pembayaran sebelumnya masih diproses. Tunggu beberapa menit atau cek halaman langganan.",
    };
  }

  const gatewayOrderId = `HF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const finishUrl = `${clientEnv.NEXT_PUBLIC_APP_URL}/checkout/${plan.id}/finish?order_id=${gatewayOrderId}`;

  let snap;

  try {
    snap = await createMidtransSnapTransaction({
      orderId: gatewayOrderId,
      amount: plan.price,
      description: `HabitFlow ${plan.name} subscription`,
      email: user.email ?? "user@habitflow.local",
      userId: user.id,
      planCode: plan.code,
      finishUrl,
    });
  } catch (error) {
    console.error("Gagal membuat transaksi Snap:", error instanceof Error ? error.message : error);
    return {
      status: "error",
      message: "Pembayaran belum dapat dimulai. Coba lagi beberapa saat.",
    };
  }

  // Tabel payments hanya memberi SELECT ke authenticated. Insert dilakukan
  // lewat service role setelah user dan plan diverifikasi di atas.
  const admin = createAdminSupabase();
  const { error } = await admin.from("payments").insert({
    user_id: user.id,
    plan_id: plan.id,
    gateway_order_id: gatewayOrderId,
    amount: plan.price,
    status: "pending",
  });

  if (error) {
    console.error("Gagal menyimpan payment pending:", error.code);
    return { status: "error", message: "Pembayaran belum dapat dimulai. Coba lagi." };
  }

  redirect(snap.redirectUrl || finishUrl);
}
