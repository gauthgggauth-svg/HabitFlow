import type { Metadata } from "next";

import { AppShell } from "@/components/app-shell";
import { requireOnboardedAccount } from "@/lib/auth/account";

export const metadata: Metadata = {
  title: { default: "Aplikasi", template: "%s · HabitFlow" },
  robots: { index: false, follow: false },
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile, entitlement } = await requireOnboardedAccount();

  if (!profile) {
    return null;
  }

  return (
    <AppShell profile={profile} entitlement={entitlement}>
      {children}
    </AppShell>
  );
}
