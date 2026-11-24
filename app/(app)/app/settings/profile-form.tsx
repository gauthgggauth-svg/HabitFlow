"use client";

import { useActionState } from "react";

import { updateProfileAction } from "./actions";
import { FieldError, FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TimezoneSelect } from "@/components/forms/timezone-select";
import { initialFormState } from "@/lib/validation";
import type { Profile } from "@/types/domain";

export function ProfileForm({
  profile,
  emailRemindersAvailable,
}: {
  profile: Profile;
  emailRemindersAvailable: boolean;
}) {
  const [state, action] = useActionState(updateProfileAction, initialFormState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-5">
      <FormMessage state={state} />

      <div className="space-y-1.5">
        <Label htmlFor="name">Nama</Label>
        <Input id="name" name="name" defaultValue={profile.name} maxLength={80} required />
        <FieldError id="name-error" message={errors.name} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="timezone">Zona waktu</Label>
        <TimezoneSelect defaultValue={profile.timezone} id="timezone" />
        <FieldError id="timezone-error" message={errors.timezone} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="defaultReminderTime">Jam pengingat default</Label>
        <Input
          id="defaultReminderTime"
          name="defaultReminderTime"
          type="time"
          defaultValue={profile.default_reminder_time?.slice(0, 5) ?? "08:00"}
        />
        <FieldError id="defaultReminderTime-error" message={errors.defaultReminderTime} />
      </div>

      <label className="flex min-h-11 items-center gap-3 rounded-lg border border-border px-3 text-sm">
        <input
          type="checkbox"
          name="emailReminders"
          value="on"
          defaultChecked={profile.email_reminders && emailRemindersAvailable}
          disabled={!emailRemindersAvailable}
          className="size-4 accent-current"
        />
        Aktifkan email pengingat
      </label>
      {!emailRemindersAvailable ? (
        <p className="text-xs leading-5 text-muted-foreground">
          Email pengingat tersedia untuk paket Standard dan Pro.
        </p>
      ) : null}

      <SubmitButton pendingText="Menyimpan…">Simpan perubahan</SubmitButton>
    </form>
  );
}
