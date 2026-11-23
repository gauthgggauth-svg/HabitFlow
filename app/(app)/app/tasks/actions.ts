"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireOnboardedAccount } from "@/lib/auth/account";
import { dueAtFromLocalDate } from "@/lib/dates";
import { checkActiveTaskLimit } from "@/lib/entitlements";
import { countActiveTasks } from "@/services/tasks";
import {
  formString,
  taskSchema,
  zodFieldErrors,
  type FormState,
} from "@/lib/validation";

const taskIdSchema = z.uuid();

const LIMIT_MESSAGE =
  "Kamu sudah memakai 20 dari 20 tugas aktif. Selesaikan atau hapus tugas, atau upgrade untuk tugas tanpa batas.";

function parseTaskForm(formData: FormData) {
  return taskSchema.safeParse({
    title: formString(formData, "title"),
    notes: formString(formData, "notes"),
    dueDate: formString(formData, "dueDate"),
    priority: formString(formData, "priority"),
  });
}

function revalidateTaskPaths() {
  revalidatePath("/app");
  revalidatePath("/app/tasks");
}

export async function createTaskAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const { user, profile, entitlement, supabase } = await requireOnboardedAccount();
  const parsed = parseTaskForm(formData);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali detail tugas.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const activeCount = await countActiveTasks(user.id);
  const check = checkActiveTaskLimit(entitlement, activeCount);

  if (!check.allowed) {
    return { status: "error", message: LIMIT_MESSAGE };
  }

  const input = parsed.data;
  const { error } = await supabase.from("tasks").insert({
    user_id: user.id,
    title: input.title,
    notes: input.notes,
    priority: input.priority,
    due_at: input.dueDate
      ? dueAtFromLocalDate(input.dueDate, profile?.timezone ?? "Asia/Jakarta")
      : null,
  });

  if (error) {
    console.error("Gagal membuat tugas:", error.code);
    return { status: "error", message: "Tugas belum tersimpan. Coba lagi." };
  }

  revalidateTaskPaths();
  redirect("/app/tasks?status=created");
}

export async function updateTaskAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const { user, profile, supabase } = await requireOnboardedAccount();
  const idParsed = taskIdSchema.safeParse(formString(formData, "taskId"));

  if (!idParsed.success) {
    return { status: "error", message: "Tugas tidak ditemukan." };
  }

  const parsed = parseTaskForm(formData);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali detail tugas.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const input = parsed.data;
  const { error } = await supabase
    .from("tasks")
    .update({
      title: input.title,
      notes: input.notes,
      priority: input.priority,
      due_at: input.dueDate
        ? dueAtFromLocalDate(input.dueDate, profile?.timezone ?? "Asia/Jakarta")
        : null,
    })
    .eq("id", idParsed.data)
    .eq("user_id", user.id);

  if (error) {
    console.error("Gagal memperbarui tugas:", error.code);
    return { status: "error", message: "Perubahan belum tersimpan. Coba lagi." };
  }

  revalidateTaskPaths();
  return { status: "success", message: "Perubahan tugas tersimpan." };
}

export async function toggleTaskCompletionAction(
  taskId: string,
): Promise<{ ok: boolean; completed?: boolean; message?: string }> {
  const { user, supabase } = await requireOnboardedAccount();
  const idParsed = taskIdSchema.safeParse(taskId);

  if (!idParsed.success) {
    return { ok: false, message: "Tugas tidak ditemukan." };
  }

  const { data: task } = await supabase
    .from("tasks")
    .select("id, is_completed")
    .eq("id", idParsed.data)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!task) {
    return { ok: false, message: "Tugas tidak ditemukan." };
  }

  const completed = !task.is_completed;
  const { error } = await supabase
    .from("tasks")
    .update({
      is_completed: completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq("id", task.id)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, message: "Status tugas belum tersimpan. Coba lagi." };
  }

  revalidateTaskPaths();
  return { ok: true, completed };
}

export async function deleteTaskAction(formData: FormData) {
  const { user, supabase } = await requireOnboardedAccount();
  const idParsed = taskIdSchema.safeParse(formString(formData, "taskId"));

  if (!idParsed.success) {
    redirect("/app/tasks");
  }

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", idParsed.data)
    .eq("user_id", user.id);

  if (error) {
    console.error("Gagal menghapus tugas:", error.code);
    redirect("/app/tasks?error=delete");
  }

  revalidateTaskPaths();
  redirect("/app/tasks?status=deleted");
}
