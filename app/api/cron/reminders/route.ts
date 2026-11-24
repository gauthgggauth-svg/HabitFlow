import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { sendReminderEmail } from "@/lib/email";
import { clientEnv, getServerEnv, hasEmail } from "@/lib/env";
import { pushErrorStatus, sendWebPush, type PushTarget } from "@/lib/web-push";
import { createAdminSupabase } from "@/lib/supabase/admin";
import type { Habit, Profile, Reminder } from "@/types/domain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const LOOKBACK_MINUTES = 10;
const LOOKAHEAD_MINUTES = 5;
const STALE_MINUTES = 15;
const BATCH_SIZE = 50;

function isAuthorized(request: Request): boolean {
  const secret = getServerEnv().CRON_SECRET;

  if (!secret) return false;

  const authorization = request.headers.get("authorization");
  const provided = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : request.headers.get("x-cron-secret");

  if (!provided) return false;

  const actual = Buffer.from(provided, "utf8");
  const expected = Buffer.from(secret, "utf8");

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

async function run(request: Request) {
  const secret = getServerEnv().CRON_SECRET;

  if (!secret) {
    return NextResponse.json({ ok: false, error: "CRON_SECRET belum diatur." }, { status: 503 });
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Tidak diizinkan." }, { status: 401 });
  }

  const admin = createAdminSupabase();
  const now = new Date();
  const windowStart = new Date(now.getTime() - LOOKBACK_MINUTES * 60_000);
  const windowEnd = new Date(now.getTime() + LOOKAHEAD_MINUTES * 60_000);

  const { data: enqueued, error: enqueueError } = await admin.rpc("enqueue_due_reminders", {
    p_window_start: windowStart.toISOString(),
    p_window_end: windowEnd.toISOString(),
  });

  if (enqueueError) {
    console.error("Gagal enqueue reminder:", enqueueError.code);
    return NextResponse.json({ ok: false, error: "Enqueue gagal." }, { status: 500 });
  }

  const sendBefore = new Date(now.getTime() + 60_000).toISOString();

  const { data: reminders, error: reminderError } = await admin
    .from("reminders")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_at", sendBefore)
    .order("scheduled_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (reminderError) {
    console.error("Gagal membaca reminder:", reminderError.code);
    return NextResponse.json({ ok: false, error: "Reminder gagal dibaca." }, { status: 500 });
  }

  const rows = (reminders ?? []) as Reminder[];
  const habitIds = [...new Set(rows.map((reminder) => reminder.habit_id))];
  const userIds = [...new Set(rows.map((reminder) => reminder.user_id))];

  const [habitsResult, usersResult] = await Promise.all([
    habitIds.length
      ? admin.from("habits").select("*").in("id", habitIds)
      : Promise.resolve({ data: [] as Habit[] }),
    userIds.length
      ? admin.from("users").select("*").in("id", userIds)
      : Promise.resolve({ data: [] as Profile[] }),
  ]);

  const habits = new Map((habitsResult.data ?? []).map((habit) => [habit.id, habit]));
  const users = new Map((usersResult.data ?? []).map((user) => [user.id, user]));

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  let revoked = 0;

  for (const reminder of rows) {
    const habit = habits.get(reminder.habit_id);
    const user = users.get(reminder.user_id);
    const scheduledAt = new Date(reminder.scheduled_at);

    if (!habit || !user || scheduledAt.getTime() < now.getTime() - STALE_MINUTES * 60_000) {
      await admin
        .from("reminders")
        .update({ status: "skipped", error: "Reminder basi atau data tidak ditemukan." })
        .eq("id", reminder.id);
      skipped += 1;
      continue;
    }

    try {
      if (reminder.channel === "web_push") {
        const { data: subscriptions } = await admin
          .from("push_subscriptions")
          .select("*")
          .eq("user_id", reminder.user_id)
          .is("revoked_at", null);

        if (!subscriptions || subscriptions.length === 0) {
          await admin
            .from("reminders")
            .update({ status: "skipped", error: "Tidak ada langganan push aktif." })
            .eq("id", reminder.id);
          skipped += 1;
          continue;
        }

        let delivered = false;
        let lastError: string | null = null;

        for (const subscription of subscriptions) {
          const target: PushTarget = {
            endpoint: subscription.endpoint,
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          };

          let attempt = 0;
          let success = false;

          while (attempt < 2 && !success) {
            attempt += 1;

            try {
              await sendWebPush(target, {
                title: habit.title,
                body: "Waktunya menandai habit ini selesai. Buka HabitFlow untuk check-in.",
                url: "/app",
                tag: `habit-${habit.id}`,
              });
              success = true;
            } catch (error) {
              const status = pushErrorStatus(error);
              lastError = error instanceof Error ? error.message : "Push gagal.";

              if (status === 404 || status === 410) {
                await admin
                  .from("push_subscriptions")
                  .update({ revoked_at: new Date().toISOString() })
                  .eq("id", subscription.id);
                revoked += 1;
                break;
              }

              if (status !== null && status < 500) {
                break;
              }
            }
          }

          if (success) {
            delivered = true;
            await admin
              .from("push_subscriptions")
              .update({ last_used_at: new Date().toISOString() })
              .eq("id", subscription.id);
          }
        }

        if (delivered) {
          await admin
            .from("reminders")
            .update({ status: "sent", sent_at: new Date().toISOString(), error: null })
            .eq("id", reminder.id);
          sent += 1;
        } else {
          await admin
            .from("reminders")
            .update({ status: "failed", error: lastError?.slice(0, 500) ?? "Push gagal." })
            .eq("id", reminder.id);
          failed += 1;
        }
      } else {
        if (!hasEmail() || !user.email) {
          await admin
            .from("reminders")
            .update({ status: "skipped", error: "Email belum dikonfigurasi." })
            .eq("id", reminder.id);
          skipped += 1;
          continue;
        }

        await sendReminderEmail({
          to: user.email,
          name: user.name,
          habitTitle: habit.title,
          appUrl: `${clientEnv.NEXT_PUBLIC_APP_URL}/app`,
        });

        await admin
          .from("reminders")
          .update({ status: "sent", sent_at: new Date().toISOString(), error: null })
          .eq("id", reminder.id);
        sent += 1;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Reminder gagal dikirim.";
      await admin
        .from("reminders")
        .update({ status: "failed", error: message.slice(0, 500) })
        .eq("id", reminder.id);
      failed += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    enqueued: enqueued ?? 0,
    processed: rows.length,
    sent,
    failed,
    skipped,
    revoked,
  });
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
