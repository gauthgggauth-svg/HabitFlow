import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { createServerSupabase } from "@/lib/supabase/server";
import { resolveEntitlement, type Entitlement } from "@/lib/entitlements";
import type { Plan, Profile, Subscription } from "@/types/domain";

export const getCurrentUser = cache(async () => {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
});

export const getAccount = cache(async () => {
  const user = await getCurrentUser();

  if (!user) return null;

  const supabase = await createServerSupabase();
  const [profileResult, plansResult, subscriptionsResult] = await Promise.all([
    supabase.from("users").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("plans").select("*").eq("is_active", true).order("sort_order"),
    supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const plans = (plansResult.data ?? []) as Plan[];
  const subscriptions = (subscriptionsResult.data ?? []) as Subscription[];
  const entitlement: Entitlement = resolveEntitlement(plans, subscriptions);

  return {
    user,
    profile: (profileResult.data ?? null) as Profile | null,
    plans,
    subscriptions,
    entitlement,
    supabase,
  };
});

export async function requireAccount() {
  const account = await getAccount();

  if (!account) {
    redirect("/login?next=/app");
  }

  return account;
}

export async function requireOnboardedAccount() {
  const account = await requireAccount();

  if (!account.profile?.onboarding_completed_at) {
    redirect("/onboarding");
  }

  return account;
}

export async function requireAdminAccount() {
  const account = await requireAccount();

  if (account.profile?.role !== "admin") {
    return null;
  }

  return account;
}
