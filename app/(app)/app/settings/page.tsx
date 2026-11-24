import Link from "next/link";

import { PushToggle } from "@/components/notifications/push-toggle";
import { ProfileForm } from "./profile-form";
import { updateThemeAction } from "./actions";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireOnboardedAccount } from "@/lib/auth/account";
import { canExportCsv, canUseDarkTheme } from "@/lib/entitlements";
import { clientEnv, hasWebPush } from "@/lib/env";
import { signOutAction } from "@/app/(auth)/actions";

export const metadata = {
  title: "Pengaturan",
};

export default async function SettingsPage() {
  const { profile, entitlement, subscriptions } = await requireOnboardedAccount();

  if (!profile) {
    return null;
  }

  const subscription = subscriptions[0] ?? null;
  const darkThemeAvailable = canUseDarkTheme(entitlement);
  const exportAvailable = canExportCsv(entitlement);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Pengaturan"
        description="Kelola preferensi akun, zona waktu, pengingat, dan status paket berbayar."
      />

      <section className="space-y-3">
        <Card className="space-y-4 p-5 sm:p-6">
          <div className="space-y-1.5">
            <h2 className="text-base font-semibold tracking-tight">Profil</h2>
            <p className="text-sm text-muted-foreground">Nama dan preferensi dasar aplikasi.</p>
          </div>
          <ProfileForm
            profile={profile}
            emailRemindersAvailable={entitlement.features.email_reminders}
          />
        </Card>

        <Card className="space-y-4 p-5 sm:p-6">
          <div className="space-y-1.5">
            <h2 className="text-base font-semibold tracking-tight">Pengingat browser</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Izin notifikasi hanya diminta setelah kamu menekan tombol di bawah. Pengingat
              dikirim sesuai jam habit dan zona waktu akun.
            </p>
          </div>
          <PushToggle
            vapidPublicKey={hasWebPush() ? (clientEnv.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null) : null}
          />
        </Card>

        <Card className="space-y-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1.5">
              <h2 className="text-base font-semibold tracking-tight">Tema</h2>
              <p className="text-sm text-muted-foreground">
                Tema gelap adalah fitur Pro. Preferensi tetap tersimpan saat paket berakhir.
              </p>
            </div>
            <Badge variant={profile.theme === "dark" ? "default" : "secondary"}>
              {profile.theme === "dark" ? "Gelap" : "Terang"}
            </Badge>
          </div>

          {darkThemeAvailable ? (
            <div className="flex flex-wrap gap-2">
              <form action={updateThemeAction}>
                <input type="hidden" name="theme" value="light" />
                <Button type="submit" variant={profile.theme === "light" ? "default" : "outline"}>
                  Terang
                </Button>
              </form>
              <form action={updateThemeAction}>
                <input type="hidden" name="theme" value="dark" />
                <Button type="submit" variant={profile.theme === "dark" ? "default" : "outline"}>
                  Gelap
                </Button>
              </form>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Upgrade ke Pro untuk membuka tema gelap.
              </p>
              <Link
                href="/pricing"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
              >
                Lihat paket
              </Link>
            </div>
          )}
        </Card>

        <Card className="space-y-4 p-5 sm:p-6">
          <div className="space-y-1.5">
            <h2 className="text-base font-semibold tracking-tight">Ekspor data</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Unduh habit, tugas, atau riwayat check-in sebagai CSV. File memakai UTF-8 dan bisa
              dibuka di Excel.
            </p>
          </div>
          {exportAvailable ? (
            <div className="flex flex-wrap gap-2">
              {[
                { dataset: "habits", label: "Habit" },
                { dataset: "tasks", label: "Tugas" },
                { dataset: "logs", label: "Riwayat check-in" },
              ].map((item) => (
                <a
                  key={item.dataset}
                  href={`/api/export?dataset=${item.dataset}`}
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
                >
                  {item.label}
                </a>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Ekspor CSV tersedia untuk paket Pro.
              </p>
              <Link
                href="/pricing"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
              >
                Lihat paket
              </Link>
            </div>
          )}
        </Card>

        <Card className="space-y-3 p-5 sm:p-6">
          <div className="space-y-1.5">
            <h2 className="text-base font-semibold tracking-tight">Paket berbayar</h2>
            <p className="text-sm text-muted-foreground">
              Status saat ini:{" "}
              <span className="font-medium text-foreground">{entitlement.planName}</span>
            </p>
          </div>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="rounded-lg bg-muted/60 px-3 py-2">
              <dt className="text-xs text-muted-foreground">Status</dt>
              <dd className="font-medium capitalize">{subscription?.status ?? "free"}</dd>
            </div>
            <div className="rounded-lg bg-muted/60 px-3 py-2">
              <dt className="text-xs text-muted-foreground">Akses hingga</dt>
              <dd className="font-medium">
                {entitlement.accessUntil
                  ? entitlement.accessUntil.toLocaleDateString("id-ID")
                  : "Tidak ada"}
              </dd>
            </div>
          </dl>
          <Link
            href="/billing"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
          >
            Kelola langganan
          </Link>
        </Card>

        <Card className="space-y-3 p-5 sm:p-6">
          <div className="space-y-1.5">
            <h2 className="text-base font-semibold tracking-tight">Sesi</h2>
            <p className="text-sm text-muted-foreground">Keluar dari perangkat ini.</p>
          </div>
          <form action={signOutAction}>
            <Button type="submit" variant="outline">
              Keluar
            </Button>
          </form>
        </Card>
      </section>
    </div>
  );
}
