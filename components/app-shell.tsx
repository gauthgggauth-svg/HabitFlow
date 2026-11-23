"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CreditCard,
  ListChecks,
  Repeat2,
  Settings,
  Sun,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";
import type { Entitlement } from "@/lib/entitlements";
import type { Profile } from "@/types/domain";

const primaryNav = [
  { href: "/app", label: "Hari ini", icon: Sun, exact: true },
  { href: "/app/habits", label: "Habit", icon: Repeat2, exact: false },
  { href: "/app/tasks", label: "Tugas", icon: ListChecks, exact: false },
];

const secondaryNav = [
  { href: "/app/stats", label: "Statistik", icon: BarChart3 },
  { href: "/billing", label: "Langganan", icon: CreditCard },
  { href: "/app/settings", label: "Pengaturan", icon: Settings },
];

function isActive(pathname: string, href: string, exact: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({
  profile,
  entitlement,
  children,
}: {
  profile: Profile;
  entitlement: Entitlement;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const displayName = profile.name || profile.email.split("@")[0];

  return (
    <div className="min-h-dvh bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="flex h-16 items-center px-5">
          <Link
            href="/app"
            className="inline-flex items-center gap-2.5 rounded-lg font-heading text-lg font-semibold tracking-tight"
          >
            <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true">
                <path d="m5 12.5 4.2 4L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            HabitFlow
          </Link>
        </div>

        <nav className="flex-1 space-y-6 px-3 py-4" aria-label="Navigasi aplikasi">
          <div className="space-y-1">
            {primaryNav.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                  )}
                >
                  <Icon className="size-[18px]" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="space-y-1 border-t border-sidebar-border pt-4">
            {secondaryNav.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href, false);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                  )}
                >
                  <Icon className="size-[18px]" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <Link
            href="/app/settings"
            className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-sidebar-accent/60"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {initials(displayName, profile.email)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{displayName}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {entitlement.planName}
              </span>
            </span>
            {entitlement.isPaid ? (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-primary uppercase">
                {entitlement.planCode}
              </span>
            ) : null}
          </Link>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-sm lg:hidden">
        <Link href="/app" className="inline-flex items-center gap-2 font-heading text-base font-semibold">
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden="true">
              <path d="m5 12.5 4.2 4L19 7" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          HabitFlow
        </Link>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            {entitlement.planName}
          </span>
          <Link
            href="/app/settings"
            className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
            aria-label="Buka pengaturan profil"
          >
            {initials(displayName, profile.email)}
          </Link>
        </div>
      </header>

      <main id="konten" className="app-content lg:pl-60">
        <div className="page-container py-6 md:py-8">{children}</div>
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:hidden"
        aria-label="Navigasi bawah"
      >
        <div className="mx-auto grid max-w-md grid-cols-4">
          {[...primaryNav, { href: "/app/settings", label: "Profil", icon: Settings, exact: false }].map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
