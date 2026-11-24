"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireOnboardedAccount } from "@/lib/auth/account";
import { hasMidtrans } from "@/lib/env";
import { disableMidtransSubscription } from "@/lib/midtrans";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { formString } from "@/lib/validation";

const idSchema = z.uuid();

export async function cancelSubscriptionAction(formData: FormData): Promise<void> {
  const { user, supabase } = await requireOnboardedAccount();
  const parsed = idSchema.safeParse(formString(formData, "subscriptionId"));

  if (!parsed.success) {
    redirect("/billing?error=notfound");
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("id", parsed.data)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!subscription) {
    redirect("/billing?error=notfound");
  }

  if (subscription.status === "canceled" || subscription.status === "expired") {
    redirect("/billing?error=inactive");
  }

  if (subscription.gateway_subscription_id && hasMidtrans()) {
    const disabled = await disableMidtransSubscription(subscription.gateway_subscription_id);

    if (!disabled) {
      redirect("/billing?error=cancel");
    }
  }

  // Tabel subscriptions read-only untuk authenticated; update dilakukan
  // lewat service role setelah kepemilikan subscription diverifikasi.
  const admin = createAdminSupabase();
  const { error } = await admin
    .from("subscriptions")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
    })
    .eq("id", subscription.id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Gagal membatalkan subscription:", error.code);
    redirect("/billing?error=cancel");
  }

  revalidatePath("/billing");
  revalidatePath("/app", "layout");
  redirect("/billing?status=canceled");
}
