"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signUpAction } from "../actions";
import { FormMessage, FieldError } from "@/components/forms/form-message";
import { GoogleButton } from "@/components/forms/google-button";
import { PasswordInput } from "@/components/forms/password-input";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialFormState } from "@/lib/validation";

export function RegisterForm() {
  const [state, action] = useActionState(signUpAction, initialFormState);
  const errors = state.fieldErrors ?? {};

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Buat akun gratis</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Mulai dengan 3 habit aktif dan 20 tugas. Tidak perlu kartu kredit.
        </p>
      </div>

      <GoogleButton next="/onboarding" />

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        atau dengan email
        <span className="h-px flex-1 bg-border" />
      </div>

      <form action={action} className="space-y-4" noValidate>
        <FormMessage state={state} />

        <div className="space-y-1.5">
          <Label htmlFor="name">Nama</Label>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            placeholder="Nama kamu"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
            required
          />
          <FieldError id="name-error" message={errors.name} />
        </div>

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

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : "password-hint"}
            required
          />
          <p id="password-hint" className="text-xs text-muted-foreground">
            Minimal 8 karakter.
          </p>
          <FieldError id="password-error" message={errors.password} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Konfirmasi password</Label>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
            required
          />
          <FieldError id="confirm-password-error" message={errors.confirmPassword} />
        </div>

        <SubmitButton className="w-full" pendingText="Membuat akun…">
          Daftar gratis
        </SubmitButton>

        <p className="text-xs leading-5 text-muted-foreground">
          Dengan mendaftar, kamu menyetujui{" "}
          <Link href="/legal/terms" className="underline underline-offset-2 hover:text-foreground">
            Syarat Layanan
          </Link>{" "}
          dan{" "}
          <Link href="/legal/privacy" className="underline underline-offset-2 hover:text-foreground">
            Kebijakan Privasi
          </Link>
          .
        </p>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Masuk
        </Link>
      </p>
    </div>
  );
}
