import type { Metadata, Viewport } from "next";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getAccount } from "@/lib/auth/account";
import { clientEnv } from "@/lib/env";
import "./globals.css";

const appUrl = clientEnv.NEXT_PUBLIC_APP_URL;

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "HabitFlow — Bangun kebiasaan, selesaikan tugas",
    template: "%s · HabitFlow",
  },
  description:
    "HabitFlow menyatukan habit tracker, to-do list, dan pengingat agar kamu tahu apa yang perlu dikerjakan hari ini.",
  applicationName: "HabitFlow",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: appUrl,
    siteName: "HabitFlow",
    title: "HabitFlow — Bangun kebiasaan, selesaikan tugas",
    description:
      "Habit tracker dan to-do list dalam satu tempat, dengan pengingat yang membantu kamu tetap konsisten.",
  },
  twitter: {
    card: "summary_large_image",
    title: "HabitFlow — Bangun kebiasaan, selesaikan tugas",
    description:
      "Habit tracker dan to-do list dalam satu tempat, dengan pengingat yang membantu kamu tetap konsisten.",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg" }],
  },
  manifest: "/manifest.webmanifest",
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#0d100c" },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let dark = false;

  try {
    const account = await getAccount();
    dark = Boolean(
      account?.profile?.theme === "dark" && account.entitlement.features.dark_theme,
    );
  } catch {
    dark = false;
  }

  return (
    <html
      lang="id-ID"
      className={`h-full${dark ? " dark" : ""}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#konten"
          className="sr-only z-50 rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Lewati ke konten
        </a>
        <TooltipProvider>
          {children}
          <Toaster theme={dark ? "dark" : "light"} position="top-center" closeButton />
        </TooltipProvider>
      </body>
    </html>
  );
}
