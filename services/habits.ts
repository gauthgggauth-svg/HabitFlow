import "server-only";

import { createServerSupabase } from "@/lib/supabase/server";
import {
  addDays,
  getCompletionSummary,
  getCurrentStreak,
  isHabitDueOnDate,
  todayInTimezone,
} from "@/lib/dates";
import type { Habit, HabitLog } from "@/types/domain";

const HISTORY_DAYS = 365;

export interface HabitView {
  habit: Habit;
  logs: HabitLog[];
  completedDates: Set<string>;
  streak: number;
  dueToday: boolean;
  completedToday: boolean;
  completion30: ReturnType<typeof getCompletionSummary>;
  weekHistory: {
    date: string;
    weekday: string;
    due: boolean;
    completed: boolean;
    isToday: boolean;
  }[];
}

const WEEKDAY_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function buildView(
  habit: Habit,
  logs: HabitLog[],
  timezone: string,
  todayKey: string,
): HabitView {
  const completedDates = new Set(logs.map((log) => log.scheduled_date));
  const start30 = addDays(todayKey, -29);
  const dueToday = habit.is_active && isHabitDueOnDate(habit, todayKey);

  const weekHistory = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(todayKey, index - 6);
    return {
      date,
      weekday: WEEKDAY_SHORT[new Date(`${date}T12:00:00Z`).getUTCDay()],
      due: isHabitDueOnDate(habit, date),
      completed: completedDates.has(date),
      isToday: date === todayKey,
    };
  });

  return {
    habit,
    logs,
    completedDates,
    streak: getCurrentStreak(habit, completedDates, todayKey),
    dueToday,
    completedToday: completedDates.has(todayKey),
    completion30: getCompletionSummary(habit, completedDates, start30, todayKey),
    weekHistory,
  };
}

export async function getHabitViews(
  userId: string,
  timezone: string,
  now: Date = new Date(),
): Promise<HabitView[]> {
  const supabase = await createServerSupabase();
  const todayKey = todayInTimezone(timezone, now);
  const since = addDays(todayKey, -HISTORY_DAYS);

  const [habitsResult, logsResult] = await Promise.all([
    supabase
      .from("habits")
      .select("*")
      .eq("user_id", userId)
      .order("is_active", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("habit_logs")
      .select("*")
      .eq("user_id", userId)
      .gte("scheduled_date", since),
  ]);

  if (habitsResult.error || logsResult.error) {
    console.error("Gagal memuat habit:", habitsResult.error?.code ?? logsResult.error?.code);
    return [];
  }

  const logsByHabit = new Map<string, HabitLog[]>();
  for (const log of logsResult.data ?? []) {
    const list = logsByHabit.get(log.habit_id) ?? [];
    list.push(log);
    logsByHabit.set(log.habit_id, list);
  }

  return (habitsResult.data ?? []).map((habit) =>
    buildView(habit, logsByHabit.get(habit.id) ?? [], timezone, todayKey),
  );
}

export async function getHabitView(
  userId: string,
  habitId: string,
  timezone: string,
  now: Date = new Date(),
): Promise<HabitView | null> {
  const supabase = await createServerSupabase();
  const todayKey = todayInTimezone(timezone, now);

  const { data: habit, error } = await supabase
    .from("habits")
    .select("*")
    .eq("id", habitId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !habit) {
    return null;
  }

  const { data: logs } = await supabase
    .from("habit_logs")
    .select("*")
    .eq("habit_id", habit.id)
    .eq("user_id", userId)
    .gte("scheduled_date", addDays(todayKey, -HISTORY_DAYS));

  return buildView(habit, logs ?? [], timezone, todayKey);
}

export async function countActiveHabits(userId: string): Promise<number> {
  const supabase = await createServerSupabase();
  const { count } = await supabase
    .from("habits")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_active", true);

  return count ?? 0;
}

export function sortHabitsForToday(views: HabitView[]): HabitView[] {
  return [...views]
    .filter((view) => view.habit.is_active && view.dueToday)
    .sort((a, b) => {
      if (a.completedToday !== b.completedToday) {
        return a.completedToday ? 1 : -1;
      }
      return b.streak - a.streak;
    });
}
