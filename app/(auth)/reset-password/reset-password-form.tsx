"use client";

import Link from "next/link";
import { useActionState } from "react";

import { resetPasswordAction } from "../actions";
import { FormMessage, FieldError } from "@/components/forms/form-message";
import { PasswordInput } from "@/components/forms/password-input";
import { SubmitButton } from "@/components/forms/submit-button";
import { Label } from "@/components/ui/label";
import { initialFormState } from "@/lib/validation";

export function ResetPasswordForm() {
  const [state, action] = useActionState(resetPasswordAction, initialFormState);
  const errors = state.fieldErrors ?? {};

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Buat password baru</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Gunakan minimal 8 karakter. Setelah tersimpan, kamu akan diarahkan ke
          aplikasi.
        </p>
      </div>

      <form action={action} className="space-y-4" noValidate>
        <FormMessage state={state} />

        <div className="space-y-1.5">
          <Label htmlFor="password">Password baru</Label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            required
          />
          <FieldError id="password-error" message={errors.password} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Konfirmasi password baru</Label>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={errors.confirmPassword ? "confirm-error" : undefined}
            required
          />
          <FieldError id="confirm-error" message={errors.confirmPassword} />
        </div>

        <SubmitButton className="w-full" pendingText="Menyimpan…">
          Simpan password
        </SubmitButton>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary hover:underline">
          Kembali ke halaman masuk
        </Link>
      </p>
    </div>
  );
}
