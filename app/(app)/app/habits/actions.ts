"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireOnboardedAccount } from "@/lib/auth/account";
import { checkActiveHabitLimit } from "@/lib/entitlements";
import { isHabitDueOnDate, todayInTimezone } from "@/lib/dates";
import { countActiveHabits } from "@/services/habits";
import {
  formBoolean,
  formString,
  habitSchema,
  zodFieldErrors,
  type FormState,
} from "@/lib/validation";

const habitIdSchema = z.uuid();

function parseHabitForm(formData: FormData) {
  return habitSchema.safeParse({
    title: formString(formData, "title"),
    description: formString(formData, "description"),
    frequency: formString(formData, "frequency"),
    weekdays: formData
      .getAll("weekdays")
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value)),
    reminderTime: formString(formData, "reminderTime"),
    color: formString(formData, "color"),
    icon: formString(formData, "icon"),
    isActive: formBoolean(formData, "is_active"),
  });
}

function revalidateHabitPaths(habitId?: string) {
  revalidatePath("/app");
  revalidatePath("/app/habits");
  revalidatePath("/app/stats");
  if (habitId) {
    revalidatePath(`/app/habits/${habitId}`);
  }
}

const LIMIT_MESSAGE =
  "Kamu sudah memakai 3 dari 3 habit aktif. Upgrade ke Standard untuk membuat habit tanpa batas.";

export async function createHabitAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const { user, profile, entitlement, supabase } = await requireOnboardedAccount();
  const parsed = parseHabitForm(formData);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali detail habit.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const input = parsed.data;

  if (input.isActive) {
    const activeCount = await countActiveHabits(user.id);
    const check = checkActiveHabitLimit(entitlement, activeCount);

    if (!check.allowed) {
      return {
        status: "error",
        message: LIMIT_MESSAGE,
      };
    }
  }

  const { data, error } = await supabase
    .from("habits")
    .insert({
      user_id: user.id,
      title: input.title,
      description: input.description,
      frequency: input.frequency,
      weekdays: input.frequency === "weekdays" ? input.weekdays : [],
      reminder_time: input.reminderTime,
      color: input.color,
      icon: input.icon,
      is_active: input.isActive,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Gagal membuat habit:", error?.code);
    return {
      status: "error",
      message: "Habit belum tersimpan. Coba lagi.",
    };
  }

  revalidateHabitPaths(data.id);
  redirect(`/app/habits/${data.id}?status=created&timezone=${encodeURIComponent(profile?.timezone ?? "Asia/Jakarta")}`);
}

export async function updateHabitAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const { user, entitlement, supabase } = await requireOnboardedAccount();
  const idParsed = habitIdSchema.safeParse(formString(formData, "habitId"));

  if (!idParsed.success) {
    return { status: "error", message: "Habit tidak ditemukan." };
  }

  const parsed = parseHabitForm(formData);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali detail habit.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const { data: existing } = await supabase
    .from("habits")
    .select("id, is_active")
    .eq("id", idParsed.data)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    return { status: "error", message: "Habit tidak ditemukan." };
  }

  const input = parsed.data;

  if (!existing.is_active && input.isActive) {
    const activeCount = await countActiveHabits(user.id);
    const check = checkActiveHabitLimit(entitlement, activeCount);

    if (!check.allowed) {
      return { status: "error", message: LIMIT_MESSAGE };
    }
  }

  const { error } = await supabase
    .from("habits")
    .update({
      title: input.title,
      description: input.description,
      frequency: input.frequency,
      weekdays: input.frequency === "weekdays" ? input.weekdays : [],
      reminder_time: input.reminderTime,
      color: input.color,
      icon: input.icon,
      is_active: input.isActive,
    })
    .eq("id", idParsed.data)
    .eq("user_id", user.id);

  if (error) {
    console.error("Gagal memperbarui habit:", error.code);
    return { status: "error", message: "Perubahan belum tersimpan. Coba lagi." };
  }

  revalidateHabitPaths(idParsed.data);
  return { status: "success", message: "Perubahan habit tersimpan." };
}

export async function toggleHabitActiveAction(formData: FormData) {
  const { user, entitlement, supabase } = await requireOnboardedAccount();
  const idParsed = habitIdSchema.safeParse(formString(formData, "habitId"));

  if (!idParsed.success) {
    redirect("/app/habits");
  }

  const { data: habit } = await supabase
    .from("habits")
    .select("id, is_active")
    .eq("id", idParsed.data)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!habit) {
    redirect("/app/habits");
  }

  if (!habit.is_active) {
    const activeCount = await countActiveHabits(user.id);
    const check = checkActiveHabitLimit(entitlement, activeCount);

    if (!check.allowed) {
      redirect(`/app/habits/${habit.id}?error=limit`);
    }
  }

  await supabase
    .from("habits")
    .update({ is_active: !habit.is_active })
    .eq("id", habit.id)
    .eq("user_id", user.id);

  revalidateHabitPaths(habit.id);
  redirect(`/app/habits/${habit.id}`);
}

export async function deleteHabitAction(formData: FormData) {
  const { user, supabase } = await requireOnboardedAccount();
  const idParsed = habitIdSchema.safeParse(formString(formData, "habitId"));

  if (!idParsed.success) {
    redirect("/app/habits");
  }

  const { error } = await supabase
    .from("habits")
    .delete()
    .eq("id", idParsed.data)
    .eq("user_id", user.id);

  if (error) {
    console.error("Gagal menghapus habit:", error.code);
    redirect(`/app/habits/${idParsed.data}?error=delete`);
  }

  revalidateHabitPaths(idParsed.data);
  redirect("/app/habits?status=deleted");
}

export async function toggleHabitCheckInAction(
  habitId: string,
): Promise<{ ok: boolean; completed?: boolean; message?: string }> {
  const { user, profile, supabase } = await requireOnboardedAccount();
  const idParsed = habitIdSchema.safeParse(habitId);

  if (!idParsed.success) {
    return { ok: false, message: "Habit tidak ditemukan." };
  }

  const { data: habit } = await supabase
    .from("habits")
    .select("*")
    .eq("id", idParsed.data)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!habit) {
    return { ok: false, message: "Habit tidak ditemukan." };
  }

  const timezone = profile?.timezone ?? "Asia/Jakarta";
  const todayKey = todayInTimezone(timezone);

  if (!habit.is_active || !isHabitDueOnDate(habit, todayKey)) {
    return { ok: false, message: "Habit ini tidak dijadwalkan hari ini." };
  }

  const { data: existing } = await supabase
    .from("habit_logs")
    .select("id")
    .eq("habit_id", habit.id)
    .eq("scheduled_date", todayKey)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("habit_logs")
      .delete()
      .eq("id", existing.id)
      .eq("user_id", user.id);

    if (error) {
      return { ok: false, message: "Check-in belum bisa dibatalkan. Coba lagi." };
    }

    revalidateHabitPaths(habit.id);
    return { ok: true, completed: false };
  }

  const { error } = await supabase.from("habit_logs").insert({
    habit_id: habit.id,
    user_id: user.id,
    scheduled_date: todayKey,
  });

  if (error && error.code !== "23505") {
    return { ok: false, message: "Check-in belum tersimpan. Coba lagi." };
  }

  revalidateHabitPaths(habit.id);
  return { ok: true, completed: true };
}
