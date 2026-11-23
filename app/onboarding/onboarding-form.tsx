"use client";

import { useActionState } from "react";

import { completeOnboardingAction, skipOnboardingAction } from "./actions";
import { FieldError, FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { TimezoneSelect } from "@/components/forms/timezone-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialFormState } from "@/lib/validation";
import type { Profile } from "@/types/domain";

export function OnboardingForm({ profile }: { profile: Profile | null }) {
  const [state, action] = useActionState(completeOnboardingAction, initialFormState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-8" noValidate>
      <FormMessage state={state} />

      <section className="space-y-4" aria-labelledby="goal-heading">
        <div className="flex items-center gap-3">
          <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            1
          </span>
          <div>
            <h2 id="goal-heading" className="font-heading text-base font-semibold">
              Apa yang ingin kamu bangun?
            </h2>
            <p className="text-sm text-muted-foreground">Opsional, tetapi membantu memberi konteks.</p>
          </div>
        </div>

        <div className="space-y-1.5 pl-10">
          <Label htmlFor="goal">Tujuan utama</Label>
          <Input
            id="goal"
            name="goal"
            maxLength={200}
            placeholder="Contoh: lebih konsisten berolahraga pagi"
            defaultValue={profile?.goal ?? ""}
            aria-invalid={Boolean(errors.goal)}
            aria-describedby={errors.goal ? "goal-error" : undefined}
          />
          <FieldError id="goal-error" message={errors.goal} />
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="reminder-heading">
        <div className="flex items-center gap-3">
          <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            2
          </span>
          <div>
            <h2 id="reminder-heading" className="font-heading text-base font-semibold">
              Kapan kamu ingin diingatkan?
            </h2>
            <p className="text-sm text-muted-foreground">
              Jam ini menjadi nilai awal saat membuat habit baru.
            </p>
          </div>
        </div>

        <div className="grid gap-4 pl-10 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="defaultReminderTime">Jam pengingat default</Label>
            <Input
              id="defaultReminderTime"
              name="defaultReminderTime"
              type="time"
              defaultValue={profile?.default_reminder_time?.slice(0, 5) ?? "08:00"}
              aria-invalid={Boolean(errors.defaultReminderTime)}
              aria-describedby={errors.defaultReminderTime ? "reminder-error" : undefined}
            />
            <FieldError id="reminder-error" message={errors.defaultReminderTime} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="timezone">Zona waktu</Label>
            <TimezoneSelect
              defaultValue={profile?.timezone ?? "Asia/Jakarta"}
              preferDevice
            />
            <p className="text-xs text-muted-foreground">
              Terdeteksi dari perangkat. Bisa diubah di Pengaturan.
            </p>
            <FieldError id="timezone-error" message={errors.timezone} />
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center">
        <SubmitButton pendingText="Menyimpan…">Selesai dan buka aplikasi</SubmitButton>
        <button
          type="submit"
          formAction={skipOnboardingAction}
          className="inline-flex h-11 items-center justify-center rounded-lg px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          Lewati untuk sekarang
        </button>
      </div>
    </form>
  );
}
