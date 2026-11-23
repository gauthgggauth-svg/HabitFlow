import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Logo } from "@/components/logo";

export const metadata: Metadata = {
  title: "Akun",
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#111827] p-10 text-[#fafaf9] lg:flex">
        <Logo className="text-[#fafaf9]" />
        <div className="max-w-sm space-y-6">
          <p className="text-2xl leading-snug font-medium tracking-tight">
            “Yang dibutuhkan untuk konsisten bukan aplikasi yang ramai, tetapi
            satu tempat yang jelas untuk memulai hari.”
          </p>
          <ul className="space-y-3 text-sm text-[#d1d5db]">
            {[
              "Habit dan tugas dalam satu dashboard",
              "Pengingat sesuai zona waktu",
              "Streak yang hanya menghitung jadwal sebenarnya",
              "Data hanya bisa diakses pemilik akun",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#a3c25f]" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-[#9ca3af]">
          HabitFlow · Habit tracker dan to-do list
        </p>
      </aside>

      <main id="konten" className="flex flex-col bg-background">
        <div className="flex items-center justify-between p-4 sm:p-6">
          <div className="lg:invisible">
            <Logo />
          </div>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Beranda
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 pb-12 sm:px-6">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>
    </div>
  );
}
