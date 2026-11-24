import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, CreditCard, ReceiptText, Users } from "lucide-react";

import { Logo } from "@/components/logo";
import { requireAccount } from "@/lib/auth/account";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin HabitFlow" },
  robots: { index: false, follow: false },
};

const nav = [
  { href: "/admin", label: "Metrik", icon: BarChart3, exact: true },
  { href: "/admin/users", label: "Pengguna", icon: Users, exact: false },
  { href: "/admin/subscriptions", label: "Langganan", icon: CreditCard, exact: false },
  { href: "/admin/transactions", label: "Transaksi", icon: ReceiptText, exact: false },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const account = await requireAccount();

  if (account.profile?.role !== "admin") {
    return (
      <main id="konten" className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-4 py-16">
        <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
          Akses ditolak
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Halaman ini khusus admin.</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Akun kamu tidak memiliki izin untuk membuka area admin. Kembali ke aplikasi untuk
          melanjutkan.
        </p>
        <Link
          href="/app"
          className="mt-6 inline-flex h-11 w-fit items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Kembali ke aplikasi
        </Link>
      </main>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-3">
            <Logo href="/admin" />
            <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              Admin
            </span>
          </div>
          <Link href="/app" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Kembali ke aplikasi
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <nav className="mb-6 flex flex-wrap gap-1 border-b border-border pb-2" aria-label="Navigasi admin">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Icon className="size-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main id="konten">{children}</main>
      </div>
    </div>
  );
}
