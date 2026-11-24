import { notFound } from "next/navigation";
import { CalendarCheck2 } from "lucide-react";

import { CheckInButton } from "@/components/habits/check-in-button";
import { HabitIcon } from "@/components/habit-icon";
import { habitColorStyle } from "@/components/habits/habit-presentation";
import { HabitForm } from "../habit-form";
import { DeleteHabitDialog } from "../habit-delete-dialog";
import { PageHeader } from "@/components/page-header";
import { requireOnboardedAccount } from "@/lib/auth/account";
import { getHabitView } from "@/services/habits";
import { formatTime } from "@/lib/format";

export default async function HabitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, profile } = await requireOnboardedAccount();
  const timezone = profile?.timezone ?? "Asia/Jakarta";
  const view = await getHabitView(user.id, id, timezone);

  if (!view) {
    notFound();
  }

  const style = habitColorStyle(view.habit.color);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title={view.habit.title}
        description={`${view.habit.frequency === "daily" ? "Setiap hari" : "Hari tertentu"}${view.habit.reminder_time ? ` · Pengingat ${formatTime(view.habit.reminder_time)}` : ""}`}
      />

      <section className="rounded-xl border bg-card p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span className={`inline-flex size-12 shrink-0 items-center justify-center rounded-xl ${style.background} ${style.foreground}`}>
            <HabitIcon name={view.habit.icon} className="size-6" />
          </span>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{view.habit.title}</h1>
              {!view.habit.is_active ? (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  Nonaktif
                </span>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">
              {view.habit.frequency === "daily"
                ? "Frekuensi harian. Selesaikan setiap hari atau lewatkan sekali tanpa memutus streak."
                : `Frekuensi hari tertentu: ${view.habit.weekdays.join(", ")}.`}
            </p>

            {view.habit.is_active ? (
              view.dueToday ? (
                <CheckInButton habitId={view.habit.id} completed={view.completedToday} showLabel />
              ) : (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarCheck2 className="size-4" aria-hidden="true" />
                  Habit tidak terjadwal hari ini.
                </p>
              )
            ) : (
              <p className="text-sm text-muted-foreground">Habit sedang nonaktif.</p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5 sm:p-6">
        <h2 className="text-base font-semibold tracking-tight">Edit habit</h2>
        <div className="mt-5">
          <HabitForm habit={view.habit} />
        </div>
      </section>

      <DeleteHabitDialog habitId={view.habit.id} habitTitle={view.habit.title} />
    </div>
  );
}
