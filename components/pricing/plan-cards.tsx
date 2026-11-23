import Link from "next/link";
import { Check, Minus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { parsePlanData, type Entitlement } from "@/lib/entitlements";
import { formatIDR } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Plan } from "@/types/domain";

const PLAN_COPY: Record<string, { description: string; features: string[]; missing: string[] }> = {
  free: {
    description: "Untuk mencoba dan membangun kebiasaan pertama.",
    features: [
      "3 habit aktif",
      "20 tugas belum selesai",
      "Check-in harian dan streak",
      "Pengingat web push",
    ],
    missing: ["Statistik", "Ekspor data", "Tema gelap"],
  },
  standard: {
    description: "Untuk rutinitas harian yang sudah berjalan.",
    features: [
      "Habit dan tugas tanpa batas",
      "Semua fitur Free",
      "Statistik 7 dan 30 hari",
      "Email pengingat (opsional)",
    ],
    missing: ["Ekspor data", "Tema gelap"],
  },
  pro: {
    description: "Untuk kamu yang ingin melihat pola dan membawa data keluar.",
    features: [
      "Semua fitur Standard",
      "Statistik 90 hari dan per habit",
      "Best streak dan pola hari",
      "Ekspor CSV",
      "Tema gelap",
      "Prioritas dukungan",
    ],
    missing: [],
  },
};

function ctaFor(
  plan: Plan,
  entitlement: Entitlement | null,
): { href: string; label: string; disabled?: boolean } {
  if (!entitlement) {
    return plan.code === "free"
      ? { href: "/register", label: "Mulai gratis" }
      : { href: "/register", label: `Pilih ${plan.name}` };
  }

  if (entitlement.planCode === plan.code) {
    return { href: "/billing", label: "Paket saat ini" };
  }

  if (plan.code === "free") {
    return { href: "/billing", label: "Kelola langganan" };
  }

  return { href: `/checkout/${plan.id}`, label: `Pilih ${plan.name}` };
}

export function PlanCards({
  plans,
  entitlement,
  compact = false,
}: {
  plans: Plan[];
  entitlement?: Entitlement | null;
  compact?: boolean;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {plans.map((plan) => {
        let parsed: ReturnType<typeof parsePlanData>;
        try {
          parsed = parsePlanData(plan);
        } catch {
          return null;
        }

        const copy = PLAN_COPY[plan.code] ?? PLAN_COPY.free;
        const highlighted = plan.code === "standard";
        const cta = ctaFor(plan, entitlement ?? null);
        const isCurrent = entitlement?.planCode === plan.code;

        return (
          <div
            key={plan.id}
            className={cn(
              "flex flex-col rounded-xl border bg-card p-5 shadow-xs",
              highlighted ? "border-primary/40 ring-1 ring-primary/15" : "border-border",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-heading text-lg font-semibold">{plan.name}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{copy.description}</p>
              </div>
              {highlighted ? <Badge>Pilihan utama</Badge> : null}
              {isCurrent && !highlighted ? <Badge variant="secondary">Aktif</Badge> : null}
            </div>

            <p className="mt-5 flex items-baseline gap-1">
              <span className="text-3xl font-semibold tracking-tight">{formatIDR(plan.price)}</span>
              <span className="text-sm text-muted-foreground">
                {plan.price === 0 ? "selamanya" : "/bulan"}
              </span>
            </p>

            <ul className={cn("mt-5 space-y-2.5 text-sm", compact && "mt-4 space-y-2")}>
              {copy.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  <span>{feature}</span>
                </li>
              ))}
              {copy.missing.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-muted-foreground">
                  <Minus className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 pt-1">
              {cta.disabled ? (
                <span className="flex h-11 items-center justify-center rounded-lg border border-border text-sm font-medium text-muted-foreground">
                  {cta.label}
                </span>
              ) : (
                <Link
                  href={cta.href}
                  className={cn(
                    "flex h-11 items-center justify-center rounded-lg text-sm font-medium transition-colors",
                    highlighted
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border border-border bg-background hover:bg-muted",
                  )}
                >
                  {cta.label}
                </Link>
              )}
            </div>

            {parsed.limits.active_habits === null ? (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Habit dan tugas tanpa batas
              </p>
            ) : (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                {parsed.limits.active_habits} habit · {parsed.limits.active_tasks} tugas
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
