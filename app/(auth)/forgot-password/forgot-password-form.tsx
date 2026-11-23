"use client";

import Link from "next/link";
import { useActionState } from "react";

import { forgotPasswordAction } from "../actions";
import { FormMessage, FieldError } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialFormState } from "@/lib/validation";

export function ForgotPasswordForm() {
  const [state, action] = useActionState(forgotPasswordAction, initialFormState);
  const errors = state.fieldErrors ?? {};

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Lupa password?</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Masukkan email akunmu. Kami akan mengirim tautan untuk membuat
          password baru.
        </p>
      </div>

      <form action={action} className="space-y-4" noValidate>
        <FormMessage state={state} />

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="nama@email.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            required
          />
          <FieldError id="email-error" message={errors.email} />
        </div>

        <SubmitButton className="w-full" pendingText="Mengirim…">
          Kirim tautan reset
        </SubmitButton>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Ingat password?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Masuk
        </Link>
      </p>
    </div>
  );
}
