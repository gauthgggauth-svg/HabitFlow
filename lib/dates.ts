import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

import type { Habit } from "@/types/domain";
import type { HabitFrequency } from "@/types/domain";

export const DEFAULT_TIMEZONE = "Asia/Jakarta";

export type MinimalHabit = Pick<Habit, "frequency" | "weekdays"> & {
  created_at?: string;
};

export function todayInTimezone(timeZone: string, now: Date = new Date()): string {
  return formatInTimeZone(now, timeZone, "yyyy-MM-dd");
}

export function nowInTimezone(timeZone: string, now: Date = new Date()): string {
  return formatInTimeZone(now, timeZone, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

export function parseDateKey(dateKey: string): Date {
  return new Date(`${dateKey}T12:00:00.000Z`);
}

export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(dateKey: string, days: number): string {
  const date = parseDateKey(dateKey);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateKey(date);
}

export function daysBetween(startKey: string, endKey: string): number {
  return Math.round(
    (parseDateKey(endKey).getTime() - parseDateKey(startKey).getTime()) / 86_400_000,
  );
}

export function weekdayOf(dateKey: string): number {
  return parseDateKey(dateKey).getUTCDay() === 0 ? 7 : parseDateKey(dateKey).getUTCDay();
}

export function isHabitDueOnDate(habit: MinimalHabit, dateKey: string): boolean {
  const frequency: HabitFrequency = habit.frequency;

  if (frequency === "daily") {
    return true;
  }

  return habit.weekdays.includes(weekdayOf(dateKey));
}

export function scheduledDateKeys(
  habit: MinimalHabit,
  startKey: string,
  endKey: string,
): string[] {
  const result: string[] = [];
  const total = daysBetween(startKey, endKey);

  for (let offset = 0; offset <= total; offset += 1) {
    const dateKey = addDays(startKey, offset);
    if (isHabitDueOnDate(habit, dateKey)) {
      result.push(dateKey);
    }
  }

  return result;
}

/**
 * Streak dihitung hanya dari kejadian terjadwal. Hari ini yang terjadwal
 * tetapi belum selesai tidak memutus streak sampai hari berganti.
 */
export function getCurrentStreak(
  habit: MinimalHabit,
  completedDates: ReadonlySet<string>,
  todayKey: string,
  maxLookbackDays = 3650,
): number {
  let cursor = todayKey;

  if (isHabitDueOnDate(habit, todayKey) && !completedDates.has(todayKey)) {
    cursor = addDays(cursor, -1);
  }

  let streak = 0;

  for (let index = 0; index < maxLookbackDays; index += 1) {
    if (isHabitDueOnDate(habit, cursor)) {
      if (completedDates.has(cursor)) {
        streak += 1;
      } else {
        break;
      }
    }

    cursor = addDays(cursor, -1);
  }

  return streak;
}

export interface CompletionSummary {
  completed: number;
  scheduled: number;
  rate: number;
}

export function getCompletionSummary(
  habit: MinimalHabit,
  completedDates: ReadonlySet<string>,
  startKey: string,
  endKey: string,
): CompletionSummary {
  const scheduled = scheduledDateKeys(habit, startKey, endKey);
  const completed = scheduled.filter((dateKey) => completedDates.has(dateKey)).length;

  return {
    completed,
    scheduled: scheduled.length,
    rate: scheduled.length === 0 ? 0 : Math.round((completed / scheduled.length) * 100),
  };
}

export function getBestStreak(
  habit: MinimalHabit,
  completedDates: ReadonlySet<string>,
  startKey: string,
  endKey: string,
): number {
  let best = 0;
  let current = 0;

  for (const dateKey of scheduledDateKeys(habit, startKey, endKey)) {
    if (completedDates.has(dateKey)) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }

  return best;
}

export function dueAtFromLocalDate(dateKey: string, timeZone: string): string {
  return fromZonedTime(`${dateKey}T23:59:59`, timeZone).toISOString();
}

export function localDateTimeToUtc(
  dateKey: string,
  time: string,
  timeZone: string,
): Date {
  const normalizedTime = time.length === 5 ? `${time}:00` : time;
  return fromZonedTime(`${dateKey}T${normalizedTime}`, timeZone);
}

export function isOverdue(dueAt: string | null, now: Date = new Date()): boolean {
  return Boolean(dueAt && new Date(dueAt).getTime() < now.getTime());
}

export function isDueToday(dueAt: string | null, timeZone: string, now: Date = new Date()): boolean {
  if (!dueAt) return false;
  return formatInTimeZone(new Date(dueAt), timeZone, "yyyy-MM-dd") === todayInTimezone(timeZone, now);
}

export function isValidTimezone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("id-ID", { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function normalizeReminderTime(value: string | null | undefined): string {
  if (!value) return "";
  return value.slice(0, 5);
}
