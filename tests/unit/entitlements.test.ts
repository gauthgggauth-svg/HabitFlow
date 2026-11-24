import { describe, expect, it } from "vitest";

import { resolveEntitlement } from "@/lib/entitlements";
import type { Plan, Subscription } from "@/types/domain";

const now = new Date("2026-11-24T10:00:00.000Z");

const freePlan: Plan = {
  id: "plan-free",
  code: "free",
  name: "Free",
  price: 0,
  interval: "month",
  limits: { active_habits: 3, active_tasks: 20 },
  features: {
    stats: "locked",
    email_reminders: false,
    csv_export: false,
    dark_theme: false,
    priority_support: false,
  },
  sort_order: 1,
  is_active: true,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

const standardPlan: Plan = {
  ...freePlan,
  id: "plan-standard",
  code: "standard",
  name: "Standard",
  price: 29000,
  limits: { active_habits: null, active_tasks: null },
  features: {
    stats: "basic",
    email_reminders: true,
    csv_export: false,
    dark_theme: false,
    priority_support: false,
  },
  sort_order: 2,
};

function subscription(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: "sub-1",
    user_id: "user-1",
    plan_id: standardPlan.id,
    status: "active",
    gateway_subscription_id: "gateway-1",
    current_period_start: "2026-11-01T00:00:00.000Z",
    current_period_end: "2026-12-01T00:00:00.000Z",
    canceled_at: null,
    created_at: "2026-11-01T00:00:00.000Z",
    updated_at: "2026-11-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("resolveEntitlement", () => {
  it("memakai Free saat tidak ada subscription", () => {
    const entitlement = resolveEntitlement([freePlan, standardPlan], [], now);
    expect(entitlement.planCode).toBe("free");
    expect(entitlement.isPaid).toBe(false);
    expect(entitlement.limits.active_habits).toBe(3);
  });

  it("mengaktifkan plan berbayar yang aktif", () => {
    const entitlement = resolveEntitlement(
      [freePlan, standardPlan],
      [subscription()],
      now,
    );
    expect(entitlement.planCode).toBe("standard");
    expect(entitlement.isPaid).toBe(true);
    expect(entitlement.limits.active_habits).toBeNull();
    expect(entitlement.features.stats).toBe("basic");
  });

  it("tetap memberi akses untuk canceled sampai akhir periode", () => {
    const entitlement = resolveEntitlement(
      [freePlan, standardPlan],
      [subscription({ status: "canceled" })],
      now,
    );
    expect(entitlement.isPaid).toBe(true);
    expect(entitlement.accessUntil?.toISOString()).toBe("2026-12-01T00:00:00.000Z");
  });

  it("memberi grace tiga hari untuk past_due", () => {
    const entitlement = resolveEntitlement(
      [freePlan, standardPlan],
      [
        subscription({
          status: "past_due",
          current_period_end: "2026-11-23T00:00:00.000Z",
        }),
      ],
      now,
    );
    expect(entitlement.isPaid).toBe(true);
  });

  it("kembali ke Free setelah periode dan grace berakhir", () => {
    const entitlement = resolveEntitlement(
      [freePlan, standardPlan],
      [
        subscription({
          status: "canceled",
          current_period_end: "2026-10-01T00:00:00.000Z",
        }),
        subscription({
          id: "sub-2",
          status: "past_due",
          current_period_end: "2026-11-01T00:00:00.000Z",
        }),
      ],
      now,
    );
    expect(entitlement.planCode).toBe("free");
    expect(entitlement.isPaid).toBe(false);
  });
});
