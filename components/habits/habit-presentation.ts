import type { Habit } from "@/types/domain";
import { WEEKDAY_LABELS } from "@/types/domain";
import { formatTime } from "@/lib/format";

export function describeHabitFrequency(
  habit: Pick<Habit, "frequency" | "weekdays">,
): string {
  if (habit.frequency === "daily") {
    return "Setiap hari";
  }

  const labels = WEEKDAY_LABELS.filter((day) =>
    habit.weekdays.includes(day.value),
  ).map((day) => day.short);

  if (labels.length === 7) return "Setiap hari";
  if (labels.length === 5 && [1, 2, 3, 4, 5].every((day) => habit.weekdays.includes(day))) {
    return "Hari kerja";
  }

  return labels.join(", ");
}

export function describeHabitReminder(habit: Pick<Habit, "reminder_time">): string {
  return habit.reminder_time
    ? `Pengingat ${formatTime(habit.reminder_time)}`
    : "Tanpa pengingat";
}

export const HABIT_COLOR_STYLES: Record<
  string,
  { background: string; foreground: string; solid: string; ring: string }
> = {
  moss: {
    background: "bg-[#3f6212]/10 dark:bg-[#a3c25f]/15",
    foreground: "text-[#3f6212] dark:text-[#a3c25f]",
    solid: "bg-[#3f6212]",
    ring: "ring-[#3f6212]/25",
  },
  amber: {
    background: "bg-[#b45309]/10 dark:bg-[#e0a45a]/15",
    foreground: "text-[#b45309] dark:text-[#e0a45a]",
    solid: "bg-[#b45309]",
    ring: "ring-[#b45309]/25",
  },
  teal: {
    background: "bg-[#0f766e]/10 dark:bg-[#5eb9ae]/15",
    foreground: "text-[#0f766e] dark:text-[#5eb9ae]",
    solid: "bg-[#0f766e]",
    ring: "ring-[#0f766e]/25",
  },
  slate: {
    background: "bg-[#475569]/10 dark:bg-[#94a3b8]/15",
    foreground: "text-[#475569] dark:text-[#94a3b8]",
    solid: "bg-[#475569]",
    ring: "ring-[#475569]/25",
  },
  rose: {
    background: "bg-[#be123c]/10 dark:bg-[#f08a9f]/15",
    foreground: "text-[#be123c] dark:text-[#f08a9f]",
    solid: "bg-[#be123c]",
    ring: "ring-[#be123c]/25",
  },
};

export function habitColorStyle(color: string) {
  return HABIT_COLOR_STYLES[color] ?? HABIT_COLOR_STYLES.moss;
}
