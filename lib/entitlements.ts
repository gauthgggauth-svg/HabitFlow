import { z } from "zod";

import type { Plan, PlanCode, Subscription } from "@/types/domain";

export const planLimitsSchema = z.object({
  active_habits: z.number().int().positive().nullable(),
  active_tasks: z.number().int().positive().nullable(),
});

export const planFeaturesSchema = z.object({
  stats: z.enum(["locked", "basic", "advanced"]),
  email_reminders: z.boolean(),
  csv_export: z.boolean(),
  dark_theme: z.boolean(),
  priority_support: z.boolean(),
});

export type PlanLimits = z.infer<typeof planLimitsSchema>;
export type PlanFeatures = z.infer<typeof planFeaturesSchema>;

export interface Entitlement {
  planId: string;
  planCode: PlanCode;
  planName: string;
  price: number;
  limits: PlanLimits;
  features: PlanFeatures;
  isPaid: boolean;
  subscription: Subscription | null;
  /** Batas akses berbayar (periode + grace), null untuk Free. */
  accessUntil: Date | null;
}

const FREE_LIMITS: PlanLimits = { active_habits: 3, active_tasks: 20 };
const FREE_FEATURES: PlanFeatures = {
  stats: "locked",
  email_reminders: false,
  csv_export: false,
  dark_theme: false,
  priority_support: false,
};

const GRACE_DAYS = 3;

export function parsePlanData(plan: Plan): {
  limits: PlanLimits;
  features: PlanFeatures;
} {
  const limits = planLimitsSchema.safeParse(plan.limits);
  const features = planFeaturesSchema.safeParse(plan.features);

  if (!limits.success || !features.success) {
    throw new Error(`Konfigurasi plan "${plan.code}" tidak valid.`);
  }

  return { limits: limits.data, features: features.data };
}

export function freeEntitlement(freePlan: Plan | null): Entitlement {
  if (freePlan) {
    const { limits, features } = parsePlanData(freePlan);
    return {
      planId: freePlan.id,
      planCode: "free",
      planName: freePlan.name,
      price: freePlan.price,
      limits,
      features,
      isPaid: false,
      subscription: null,
      accessUntil: null,
    };
  }

  return {
    planId: "",
    planCode: "free",
    planName: "Free",
    price: 0,
    limits: FREE_LIMITS,
    features: FREE_FEATURES,
    isPaid: false,
    subscription: null,
    accessUntil: null,
  };
}

function accessUntilFor(subscription: Subscription): Date | null {
  if (subscription.status === "active") {
    return subscription.current_period_end ? new Date(subscription.current_period_end) : null;
  }

  if (!subscription.current_period_end) {
    return null;
  }

  const end = new Date(subscription.current_period_end);

  if (subscription.status === "past_due") {
    end.setDate(end.getDate() + GRACE_DAYS);
    return end;
  }

  if (subscription.status === "canceled") {
    return end;
  }

  return null;
}

export function subscriptionGrantsAccess(
  subscription: Subscription,
  now: Date = new Date(),
): boolean {
  if (subscription.status === "active") {
    return true;
  }

  const until = accessUntilFor(subscription);

  return until !== null && until.getTime() >= now.getTime();
}

/**
 * Menentukan akses efektif user. Tanpa subscription yang valid, user
 * selalu memakai plan Free, apa pun data plan di database.
 */
export function resolveEntitlement(
  plans: Plan[],
  subscriptions: Subscription[],
  now: Date = new Date(),
): Entitlement {
  const freePlan = plans.find((plan) => plan.code === "free") ?? null;

  const usable = subscriptions
    .map((subscription) => {
      const plan = plans.find((candidate) => candidate.id === subscription.plan_id);
      if (!plan || plan.code === "free") return null;
      if (!subscriptionGrantsAccess(subscription, now)) return null;
      return { subscription, plan };
    })
    .filter((value): value is { subscription: Subscription; plan: Plan } => value !== null)
    .sort(
      (a, b) =>
        new Date(b.subscription.created_at).getTime() -
        new Date(a.subscription.created_at).getTime(),
    );

  const current = usable[0];

  if (!current) {
    return freeEntitlement(freePlan);
  }

  const { limits, features } = parsePlanData(current.plan);

  return {
    planId: current.plan.id,
    planCode: current.plan.code as PlanCode,
    planName: current.plan.name,
    price: current.plan.price,
    limits,
    features,
    isPaid: true,
    subscription: current.subscription,
    accessUntil: accessUntilFor(current.subscription),
  };
}

export interface LimitCheck {
  allowed: boolean;
  used: number;
  limit: number | null;
  remaining: number | null;
}

export function checkActiveHabitLimit(entitlement: Entitlement, used: number): LimitCheck {
  const limit = entitlement.limits.active_habits;

  if (limit === null) {
    return { allowed: true, used, limit: null, remaining: null };
  }

  return {
    allowed: used < limit,
    used,
    limit,
    remaining: Math.max(limit - used, 0),
  };
}

export function checkActiveTaskLimit(entitlement: Entitlement, used: number): LimitCheck {
  const limit = entitlement.limits.active_tasks;

  if (limit === null) {
    return { allowed: true, used, limit: null, remaining: null };
  }

  return {
    allowed: used < limit,
    used,
    limit,
    remaining: Math.max(limit - used, 0),
  };
}

export function canUseStats(entitlement: Entitlement): boolean {
  return entitlement.features.stats !== "locked";
}

export function canUseAdvancedStats(entitlement: Entitlement): boolean {
  return entitlement.features.stats === "advanced";
}

export function canExportCsv(entitlement: Entitlement): boolean {
  return entitlement.features.csv_export;
}

export function canUseDarkTheme(entitlement: Entitlement): boolean {
  return entitlement.features.dark_theme;
}

export function formatLimit(limit: number | null, fallback = "tanpa batas"): string {
  return limit === null ? fallback : String(limit);
}
