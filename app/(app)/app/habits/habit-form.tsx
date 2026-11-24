"use client";

import { useActionState } from "react";

import { createHabitAction, updateHabitAction } from "./actions";
import { FieldError, FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { initialFormState } from "@/lib/validation";
import { HABIT_COLORS, HABIT_ICONS, WEEKDAY_LABELS } from "@/types/domain";
import type { Habit } from "@/types/domain";

export function HabitForm({ habit }: { habit?: Habit }) {
  const isEdit = Boolean(habit);
  const [state, action] = useActionState(
    isEdit ? updateHabitAction : createHabitAction,
    initialFormState,
  );
  const errors = state.fieldErrors ?? {};

  const defaultDescription = habit?.description ?? "";
  const defaultReminderTime = habit?.reminder_time?.slice(0, 5) ?? "08:00";
  const defaultWeekdays = habit?.frequency === "weekdays" ? habit.weekdays : [];

  return (
    <form action={action} className="space-y-6">
      <FormMessage state={state} />

      {isEdit && habit ? (
        <input type="hidden" name="habitId" value={habit.id} />
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="title">Nama habit</Label>
        <Input
          id="title"
          name="title"
          defaultValue={habit?.title ?? ""}
          maxLength={80}
          placeholder="Contoh: Olahraga 20 menit"
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? "title-error" : undefined}
          required
        />
        <FieldError id="title-error" message={errors.title} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Catatan (opsional)</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={defaultDescription}
          maxLength={500}
          placeholder="Catatan singkat tentang habit ini"
          aria-invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? "description-error" : undefined}
        />
        <FieldError id="description-error" message={errors.description} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="frequency">Frekuensi</Label>
        <select id="frequency" name="frequency" defaultValue={habit?.frequency ?? "daily"} className="flex h-11 w-full items-center rounded-lg border border-input bg-transparent px-3 text-sm">
          <option value="daily">Setiap hari</option>
          <option value="weekdays">Hari tertentu</option>
        </select>
        <FieldError id="frequency-error" message={errors.frequency} />
      </div>

      {habit?.frequency === "weekdays" || defaultWeekdays.length > 0 ? (
        <div className="space-y-1.5">
          <Label>Hari dalam seminggu</Label>
          <div className="flex flex-wrap gap-2">
            {WEEKDAY_LABELS.map((day) => (
              <label key={day.value} className="flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 text-sm">
                <input
                  type="checkbox"
                  name="weekdays"
                  value={String(day.value)}
                  defaultChecked={defaultWeekdays.includes(day.value)}
                  className="size-4 accent-current"
                />
                {day.label}
              </label>
            ))}
          </div>
          <FieldError id="weekdays-error" message={errors.weekdays} />
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="reminderTime">Jam pengingat (opsional)</Label>
        <Input id="reminderTime" name="reminderTime" type="time" defaultValue={defaultReminderTime} />
        <FieldError id="reminderTime-error" message={errors.reminderTime} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="color">Warna</Label>
          <select id="color" name="color" defaultValue={habit?.color ?? "moss"} className="flex h-11 w-full items-center rounded-lg border border-input bg-transparent px-3 text-sm">
            {HABIT_COLORS.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="icon">Ikon</Label>
          <select id="icon" name="icon" defaultValue={habit?.icon ?? "sparkles"} className="flex h-11 w-full items-center rounded-lg border border-input bg-transparent px-3 text-sm">
            {HABIT_ICONS.map((icon) => (
              <option key={icon} value={icon}>
                {icon}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex min-h-11 items-center gap-3 rounded-lg border border-border px-3 text-sm">
        <input type="checkbox" name="is_active" value="on" defaultChecked={habit?.is_active ?? true} className="size-4 accent-current" />
        Habit aktif
      </label>

      <SubmitButton className="w-full" pendingText={isEdit ? "Menyimpan…" : "Membuat habit…"}>
        {isEdit ? "Simpan perubahan" : "Buat habit"}
      </SubmitButton>
    </form>
  );
}
