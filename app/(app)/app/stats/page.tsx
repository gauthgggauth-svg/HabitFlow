import Link from "next/link";

import { LimitBanner } from "@/components/limit-banner";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { requireOnboardedAccount } from "@/lib/auth/account";
import { canUseAdvancedStats, canUseStats } from "@/lib/entitlements";
import { addDays, getBestStreak, getCompletionSummary, scheduledDateKeys, todayInTimezone, weekdayOf } from "@/lib/dates";
import { formatPercent } from "@/lib/format";
import { getHabitViews } from "@/services/habits";

export default async function StatsPage() {
  const { user, profile, entitlement } = await requireOnboardedAccount();
  const timezone = profile?.timezone ?? "Asia/Jakarta";
  const todayKey = todayInTimezone(timezone);
  const rangeStart = addDays(todayKey, -29);

  const habitViews = await getHabitViews(user.id, timezone);
  const statsAvailable = canUseStats(entitlement);

  if (!statsAvailable) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <PageHeader
          title="Statistik"
          description="Pantau konsistensi, completion rate, dan tren habit kamu."
        />
        <LimitBanner
          title="Statistik terkunci"
          description="Paket Free menampilkan preview kemajuan. Upgrade ke Standard untuk melihat completion rate 7 dan 30 hari, atau ke Pro untuk tren 90 hari."
          href="/pricing"
          cta="Lihat paket"
        />
        <Card className="space-y-3 p-5 sm:p-6">
          <h2 className="text-base font-semibold tracking-tight">Preview</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Statistik lengkap akan menampilkan completion rate, streak, dan tren konsistensi
            berdasarkan riwayat check-in. Upgrade paket untuk membuka fitur ini.
          </p>
          <Link
            href="/pricing"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Lihat paket berbayar
          </Link>
        </Card>
      </div>
    );
  }

  const habits = habitViews.filter((view) => view.habit.is_active);
  const advanced = canUseAdvancedStats(entitlement);
  const trendStart = advanced ? addDays(todayKey, -89) : rangeStart;

  const perHabit = habits.map((view) => {
    const summary = getCompletionSummary(
      view.habit,
      view.completedDates,
      trendStart,
      todayKey,
    );

    const bestStreak = getBestStreak(view.habit, view.completedDates, trendStart, todayKey);

    const currentStreak = view.streak;

    const weeklyPattern = advanced
      ? (() => {
          const counts: Record<number, { scheduled: number; completed: number }> = {};
          for (const dateKey of scheduledDateKeys(view.habit, trendStart, todayKey)) {
            const day = weekdayOf(dateKey);
            counts[day] ??= { scheduled: 0, completed: 0 };
            counts[day].scheduled += 1;
            if (view.completedDates.has(dateKey)) counts[day].completed += 1;
          }
          return counts;
        })()
      : {};

    return { view, summary, bestStreak, currentStreak, weeklyPattern };
  });

  const aggregate = perHabit.reduce(
    (acc, item) => ({
      scheduled: acc.scheduled + item.summary.scheduled,
      completed: acc.completed + item.summary.completed,
    }),
    { scheduled: 0, completed: 0 },
  );

  const overallRate =
    aggregate.scheduled === 0
      ? 0
      : Math.round((aggregate.completed / aggregate.scheduled) * 100);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statistik"
        description="Completion rate dan konsistensi habit berdasarkan riwayat check-in."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="space-y-3 p-5">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Completion rate</p>
          <p className="streak-number text-3xl font-semibold">{formatPercent(overallRate)}</p>
          <Progress value={overallRate} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Rentang {trendStart} s.d. {todayKey}
          </p>
        </Card>

        <Card className="space-y-3 p-5">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Streak saat ini</p>
          <p className="streak-number text-3xl font-semibold">
            {perHabit.reduce((max, item) => Math.max(max, item.currentStreak), 0)}
          </p>
          <p className="text-xs text-muted-foreground">Kejadian terjadwal terbaik beruntun.</p>
        </Card>

        <Card className="space-y-3 p-5">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Best streak</p>
          <p className="streak-number text-3xl font-semibold">
            {advanced
              ? perHabit.reduce((max, item) => Math.max(max, item.bestStreak), 0)
              : "—"}
          </p>
          <p className="text-xs text-muted-foreground">
            {advanced ? "Rentang 90 hari terakhir." : "Upgrade ke Pro untuk tren 90 hari."}
          </p>
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Per habit</h2>
        {perHabit.length === 0 ? (
          <Card className="p-5 text-sm text-muted-foreground">Belum ada habit aktif untuk dihitung.</Card>
        ) : (
          <div className="space-y-2.5">
            {perHabit.map(({ view, summary, bestStreak, currentStreak }) => (
              <div key={view.habit.id} className="rounded-xl border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{view.habit.title}</p>
                  <span className="text-xs text-muted-foreground">
                    Streak {currentStreak} · Best {bestStreak}
                  </span>
                </div>
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Completion rate ({trendStart} s.d. {todayKey})</span>
                    <span className="font-medium text-foreground">{formatPercent(summary.rate)}</span>
                  </div>
                  <Progress value={summary.rate} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {!advanced ? (
        <Link
          href="/pricing"
          className="inline-flex h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
        >
          Upgrade untuk tren 90 hari
        </Link>
      ) : null}
    </div>
  );
}


