import Link from "next/link";
import { Sparkles } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { LimitBanner } from "@/components/limit-banner";
import { HabitRow } from "@/components/habits/habit-row";
import { PageHeader } from "@/components/page-header";
import { requireOnboardedAccount } from "@/lib/auth/account";
import { checkActiveHabitLimit } from "@/lib/entitlements";
import { getHabitViews } from "@/services/habits";

export default async function HabitsPage() {
  const { user, profile, entitlement } = await requireOnboardedAccount();
  const timezone = profile?.timezone ?? "Asia/Jakarta";
  const views = await getHabitViews(user.id, timezone);

  const active = views.filter((view) => view.habit.is_active);
  const inactive = views.filter((view) => !view.habit.is_active);
  const limitCheck = checkActiveHabitLimit(entitlement, active.length);
  const atLimit =
    !entitlement.isPaid && entitlement.limits.active_habits !== null && !limitCheck.allowed;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Habit"
        description="Kelola habit aktif dan riwayat singkat. Habit nonaktif tetap tersimpan sebagai bagian dari riwayat."
        action={
          <Link
            href="/app/habits/new"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Buat habit
          </Link>
        }
      />

      {views.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Belum ada habit."
          description="Buat satu kebiasaan kecil yang bisa Anda lakukan hari ini."
          action={
            <Link
              href="/app/habits/new"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Buat habit pertama
            </Link>
          }
        />
      ) : (
        <div className="space-y-8">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold tracking-tight text-muted-foreground uppercase">
              Aktif ({active.length})
            </h2>
            {active.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-card px-6 py-8 text-center text-sm text-muted-foreground">
                Belum ada habit aktif.
              </p>
            ) : (
              <div className="space-y-2.5">
                {active.map((view) => (
                  <HabitRow key={view.habit.id} view={view} />
                ))}
              </div>
            )}
          </section>

          {inactive.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold tracking-tight text-muted-foreground uppercase">
                Tidak aktif ({inactive.length})
              </h2>
              <div className="space-y-2.5">
                {inactive.map((view) => (
                  <HabitRow key={view.habit.id} view={view} showCheckIn={false} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}

      {atLimit ? (
        <LimitBanner
          title="Batas habit tercapai"
          description="Kamu sudah memakai slot habit aktif paket Free. Upgrade ke Standard untuk membuat habit tanpa batas."
          href="/pricing"
          cta="Lihat paket"
        />
      ) : null}
    </div>
  );
}
