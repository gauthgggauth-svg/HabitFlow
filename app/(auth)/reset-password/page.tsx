import type { Metadata } from "next";
import Link from "next/link";

import { getCurrentUser } from "@/lib/auth/account";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Tautan reset tidak valid</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Sesi reset password tidak ditemukan atau sudah kedaluwarsa. Minta
          tautan baru untuk melanjutkan.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex h-11 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Minta tautan baru
        </Link>
      </div>
    );
  }

  return <ResetPasswordForm />;
}
