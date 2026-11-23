import type { Metadata } from "next";

import { safeNextPath } from "@/lib/auth/redirect";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke akun HabitFlow.",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next);

  return (
    <div className="space-y-4">
      {params.error === "auth" ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
        >
          Tautan masuk tidak valid atau sudah kedaluwarsa. Coba masuk lagi.
        </p>
      ) : null}
      <LoginForm next={next} />
    </div>
  );
}
