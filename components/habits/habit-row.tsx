import Link from "next/link";
import { Flame } from "lucide-react";

import { HabitIcon } from "@/components/habit-icon";
import { CheckInButton } from "@/components/habits/check-in-button";
import {
  describeHabitFrequency,
  describeHabitReminder,
  habitColorStyle,
} from "@/components/habits/habit-presentation";
import { Badge } from "@/components/ui/badge";
import type { HabitView } from "@/services/habits";
import { cn } from "@/lib/utils";

export function HabitRow({
  view,
  showCheckIn = true,
  className,
}: {
  view: HabitView;
  showCheckIn?: boolean;
  className?: string;
}) {
  const style = habitColorStyle(view.habit.color);
  const canCheckIn = showCheckIn && view.habit.is_active && view.dueToday;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 transition-colors",
        view.completedToday && "border-primary/20 bg-primary/[0.03]",
        className,
      )}
    >
      <span
        className={cn(
          "inline-flex size-10 shrink-0 items-center justify-center rounded-lg",
          style.background,
          style.foreground,
        )}
      >
        <HabitIcon name={view.habit.icon} className="size-5" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/app/habits/${view.habit.id}`}
            className="truncate text-sm font-medium hover:underline focus-visible:rounded focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {view.habit.title}
          </Link>
          {!view.habit.is_active ? <Badge variant="secondary">Nonaktif</Badge> : null}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {describeHabitFrequency(view.habit)} · {describeHabitReminder(view.habit)}
        </p>
      </div>

      <span
        className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex"
        title={`Streak ${view.streak} hari`}
      >
        <Flame className="size-3.5 text-[#b45309]" aria-hidden="true" />
        <span className="streak-number">{view.streak}</span>
      </span>

      {canCheckIn ? (
        <CheckInButton habitId={view.habit.id} completed={view.completedToday} />
      ) : view.habit.is_active ? (
        <span className="hidden w-11 text-center text-[10px] leading-tight text-muted-foreground sm:block">
          Tidak hari ini
        </span>
      ) : null}
    </div>
  );
}
