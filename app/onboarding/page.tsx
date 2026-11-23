import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Logo } from "@/components/logo";
import { getAccount } from "@/lib/auth/account";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = {
  title: "Onboarding",
  robots: { index: false, follow: false },
};

export default async function OnboardingPage() {
  const account = await getAccount();

  if (!account) {
    redirect("/login?next=/onboarding");
  }

  if (account.profile?.onboarding_completed_at) {
    redirect("/app");
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4">
          <Logo href="/app" />
          <span className="text-xs text-muted-foreground">Pengaturan awal</span>
        </div>
      </header>

      <main id="konten" className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-8 space-y-2">
          <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            Selamat datang
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Atur ritme harianmu.
          </h1>
          <p className="max-w-lg text-sm leading-6 text-muted-foreground">
            Dua informasi singkat ini membantu HabitFlow menyesuaikan pengingat
            dengan zona waktu dan waktu yang realistis untukmu.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <OnboardingForm profile={account.profile} />
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Izin notifikasi tidak diminta di sini. Kamu bisa mengaktifkannya nanti
          dari Pengaturan setelah memberi aksi.
        </p>
      </main>
    </div>
  );
}
