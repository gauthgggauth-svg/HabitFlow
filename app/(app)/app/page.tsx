import Link from "next/link";
import { CalendarCheck2, ListChecks, Plus, Sparkles } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { LimitBanner } from "@/components/limit-banner";
import { HabitRow } from "@/components/habits/habit-row";
import { TaskCheckbox } from "@/components/tasks/task-checkbox";
import { requireOnboardedAccount } from "@/lib/auth/account";
import { formatDateLong } from "@/lib/format";
import { getHabitViews, sortHabitsForToday } from "@/services/habits";
import { listTasks, sortDashboardTasks } from "@/services/tasks";

const TASK_PREVIEW_COUNT = 5;

function greetingFor(date: Date, timeZone: string): string {
  const hour = Number(
    new Intl.DateTimeFormat("id-ID", {
      hour: "numeric",
      hour12: false,
      timeZone,
    }).format(date),
  );

  if (hour < 6) return "Selamat malam";
  if (hour < 12) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}

export default async function TodayPage() {
  const { user, profile, entitlement } = await requireOnboardedAccount();
  const timezone = profile?.timezone ?? "Asia/Jakarta";
  const today = new Date();

  const habitViews = await getHabitViews(user.id, timezone);
  const dueHabits = sortHabitsForToday(habitViews);
  const activeHabits = habitViews.filter((view) => view.habit.is_active);

  const atHabitLimit =
    !entitlement.isPaid &&
    (entitlement.limits.active_habits === null
      ? false
      : activeHabits.length >= (entitlement.limits.active_habits ?? 0));

  const tasks = sortDashboardTasks(await listTasks(user.id));
  const incompleteTasks = tasks.filter((task) => !task.is_completed);
  const taskPreview = incompleteTasks.slice(0, TASK_PREVIEW_COUNT);

  const completedToday = dueHabits.filter((view) => view.completedToday).length;
  const displayName = profile?.name?.trim() || user.email?.split("@")[0] || "kamu";

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <p className="text-sm text-muted-foreground">{formatDateLong(today, timezone)}</p>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {greetingFor(today, timezone)}, {displayName}
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          {completedToday > 0
            ? `${completedToday} habit kamu sudah selesai hari ini. ${incompleteTasks.length > 0 ? `${incompleteTasks.length} tugas masih menunggu.` : "Kerjaan hari ini sudah tertata."}`
            : `${dueHabits.length} habit terjadwal hari ini. Selesaikan yang pertama untuk memulai. ${incompleteTasks.length > 0 ? `${incompleteTasks.length} tugas masih menunggu.` : "Kerjaan hari ini sudah tertata."}`}
        </p>
      </section>

      {atHabitLimit ? (
        <LimitBanner
          title="Batas habit tercapai"
          description="Kamu sudah memakai semua slot habit aktif paket Free. Upgrade ke Standard untuk membuat habit tanpa batas."
          href="/pricing"
          cta="Lihat paket"
        />
      ) : null}

      <section aria-labelledby="today-habits" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 id="today-habits" className="text-lg font-semibold tracking-tight">
            Hari ini
          </h2>
          <Link
            href="/app/habits/new"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="size-4" aria-hidden="true" />
            Habit baru
          </Link>
        </div>

        {dueHabits.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="Belum ada habit hari ini"
            description="Belum ada habit. Buat satu kebiasaan kecil yang bisa kamu lakukan hari ini."
            action={
              <Link
                href="/app/habits/new"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Buat habit pertama
                <Plus className="size-4" aria-hidden="true" />
              </Link>
            }
          />
        ) : (
          <div className="space-y-2.5">
            {dueHabits.map((view) => (
              <HabitRow key={view.habit.id} view={view} />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="today-tasks" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 id="today-tasks" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <ListChecks className="size-5 text-muted-foreground" aria-hidden="true" />
            Tugas aktif
          </h2>
          <Link href="/app/tasks" className="text-sm font-medium text-primary hover:underline">
            Lihat semua
          </Link>
        </div>

        {taskPreview.length === 0 ? (
          <EmptyState
            icon={CalendarCheck2}
            title="Tidak ada tugas yang menunggu"
            description="Semua tugas aktif sudah selesai atau belum dimulai."
          />
        ) : (
          <div className="space-y-2">
            {taskPreview.map((task) => (
              <div
                key={task.id}
                className="flex min-h-14 items-center gap-3 rounded-xl border border-border bg-card p-3"
              >
                <TaskCheckbox taskId={task.id} completed={false} title={task.title} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{task.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {task.due_at
                      ? `Jatuh tempo ${new Date(task.due_at).toLocaleDateString("id-ID")}`
                      : "Tanpa tenggat"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}


