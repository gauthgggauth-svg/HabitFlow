import { NextResponse } from "next/server";
import { formatInTimeZone } from "date-fns-tz";

import { getAccount } from "@/lib/auth/account";
import { toCsv } from "@/lib/csv";
import { getCurrentStreak, todayInTimezone } from "@/lib/dates";
import { canExportCsv } from "@/lib/entitlements";
import type { Habit, Task } from "@/types/domain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATASETS = ["habits", "tasks", "logs"] as const;
type Dataset = (typeof DATASETS)[number];

const lastExportAt = new Map<string, number>();
const EXPORT_COOLDOWN_MS = 10_000;

function filenameFor(dataset: Dataset, dateKey: string): string {
  return `habitflow-${dataset}-${dateKey}.csv`;
}

export async function GET(request: Request) {
  const account = await getAccount();

  if (!account) {
    return NextResponse.json({ ok: false, error: "Tidak diizinkan." }, { status: 401 });
  }

  if (!canExportCsv(account.entitlement)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Ekspor CSV tersedia untuk paket Pro. Upgrade untuk mengunduh data kamu.",
      },
      { status: 403 },
    );
  }

  const now = Date.now();
  const previous = lastExportAt.get(account.user.id) ?? 0;

  if (now - previous < EXPORT_COOLDOWN_MS) {
    return NextResponse.json(
      { ok: false, error: "Tunggu sebentar sebelum mengekspor lagi." },
      { status: 429 },
    );
  }

  const url = new URL(request.url);
  const dataset = url.searchParams.get("dataset") as Dataset | null;

  if (!dataset || !DATASETS.includes(dataset)) {
    return NextResponse.json(
      { ok: false, error: "Dataset harus habits, tasks, atau logs." },
      { status: 400 },
    );
  }

  const { user, profile, supabase } = account;
  const timezone = profile?.timezone ?? "Asia/Jakarta";
  const todayKey = todayInTimezone(timezone);
  let rows: unknown[][] = [];

  if (dataset === "habits") {
    const [{ data: habitsData }, { data: logsData }] = await Promise.all([
      supabase.from("habits").select("*").eq("user_id", user.id).order("created_at"),
      supabase.from("habit_logs").select("habit_id, scheduled_date").eq("user_id", user.id),
    ]);

    const logsByHabit = new Map<string, Set<string>>();

    for (const log of logsData ?? []) {
      const set = logsByHabit.get(log.habit_id) ?? new Set<string>();
      set.add(log.scheduled_date);
      logsByHabit.set(log.habit_id, set);
    }

    rows = [
      ["nama", "frekuensi", "hari", "pengingat", "status", "streak_saat_ini"],
      ...((habitsData ?? []) as Habit[]).map((habit) => [
        habit.title,
        habit.frequency,
        habit.weekdays.join(" "),
        habit.reminder_time?.slice(0, 5) ?? "",
        habit.is_active ? "aktif" : "nonaktif",
        getCurrentStreak(habit, logsByHabit.get(habit.id) ?? new Set(), todayKey),
      ]),
    ];
  }

  if (dataset === "tasks") {
    const { data: tasksData } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at");

    rows = [
      ["judul", "prioritas", "tenggat", "status", "selesai_pada"],
      ...((tasksData ?? []) as Task[]).map((task) => [
        task.title,
        task.priority,
        task.due_at
          ? formatInTimeZone(new Date(task.due_at), timezone, "yyyy-MM-dd HH:mm")
          : "",
        task.is_completed ? "selesai" : "aktif",
        task.completed_at
          ? formatInTimeZone(new Date(task.completed_at), timezone, "yyyy-MM-dd HH:mm")
          : "",
      ]),
    ];
  }

  if (dataset === "logs") {
    const [{ data: logsData }, { data: habitsData }] = await Promise.all([
      supabase
        .from("habit_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("scheduled_date", { ascending: false }),
      supabase.from("habits").select("id, title").eq("user_id", user.id),
    ]);

    const titleById = new Map(
      ((habitsData ?? []) as Pick<Habit, "id" | "title">[]).map((habit) => [
        habit.id,
        habit.title,
      ]),
    );

    rows = [
      ["tanggal", "habit", "status"],
      ...(logsData ?? []).map((log) => [
        log.scheduled_date,
        titleById.get(log.habit_id) ?? log.habit_id,
        "selesai",
      ]),
    ];
  }

  lastExportAt.set(user.id, now);

  return new NextResponse(toCsv(rows), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filenameFor(dataset, todayKey)}"`,
      "Cache-Control": "no-store",
    },
  });
}
