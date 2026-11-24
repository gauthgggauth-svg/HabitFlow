"use client";

import { useActionState } from "react";

import { createTaskAction, updateTaskAction } from "./actions";
import { FieldError, FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { initialFormState } from "@/lib/validation";
import type { Task } from "@/types/domain";

export function TaskForm({ task }: { task?: Task }) {
  const isEdit = Boolean(task);
  const [state, action] = useActionState(
    isEdit ? updateTaskAction : createTaskAction,
    initialFormState,
  );
  const errors = state.fieldErrors ?? {};

  const defaultDueDate = task?.due_at
    ? new Date(task.due_at).toISOString().slice(0, 10)
    : "";

  return (
    <form action={action} className="space-y-5">
      <FormMessage state={state} />

      {isEdit && task ? (
        <input type="hidden" name="taskId" value={task.id} />
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="title">Judul tugas</Label>
        <Input
          id="title"
          name="title"
          defaultValue={task?.title ?? ""}
          maxLength={160}
          placeholder="Contoh: Kirim laporan mingguan"
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? "title-error" : undefined}
          required
        />
        <FieldError id="title-error" message={errors.title} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Catatan (opsional)</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={task?.notes ?? ""}
          maxLength={2000}
          placeholder="Detail singkat tugas"
          aria-invalid={Boolean(errors.notes)}
          aria-describedby={errors.notes ? "notes-error" : undefined}
        />
        <FieldError id="notes-error" message={errors.notes} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="dueDate">Tenggat (opsional)</Label>
          <Input
            id="dueDate"
            name="dueDate"
            type="date"
            defaultValue={defaultDueDate}
            aria-invalid={Boolean(errors.dueDate)}
            aria-describedby={errors.dueDate ? "dueDate-error" : undefined}
          />
          <FieldError id="dueDate-error" message={errors.dueDate} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="priority">Prioritas</Label>
          <select id="priority" name="priority" defaultValue={task?.priority ?? "medium"} className="flex h-11 w-full items-center rounded-lg border border-input bg-transparent px-3 text-sm">
            <option value="low">Rendah</option>
            <option value="medium">Sedang</option>
            <option value="high">Tinggi</option>
          </select>
        </div>
      </div>

      <SubmitButton className="w-full" pendingText={isEdit ? "Menyimpan…" : "Membuat tugas…"}>
        {isEdit ? "Simpan perubahan" : "Buat tugas"}
      </SubmitButton>
    </form>
  );
}
