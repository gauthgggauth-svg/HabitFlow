import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Logo } from "@/components/logo";

export function SiteHeader() {
  return (
    <header className="border-b border-border/80 bg-background/90 backdrop-blur-sm">
      <div className="page-container flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex" aria-label="Navigasi utama">
          <Link href="/#cara-kerja" className="rounded-md py-2 hover:text-foreground">
            Cara kerja
          </Link>
          <Link href="/#fitur" className="rounded-md py-2 hover:text-foreground">
            Fitur
          </Link>
          <Link href="/pricing" className="rounded-md py-2 hover:text-foreground">
            Harga
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="inline-flex h-11 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Masuk
          </Link>
          <Link
            href="/register"
            className="inline-flex h-11 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Mulai gratis
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="page-container flex flex-col gap-8 py-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm space-y-3">
          <Logo />
          <p className="text-sm leading-6 text-muted-foreground">
            Satu tempat untuk habit, tugas harian, dan pengingat. Dibuat untuk
            membantu kamu konsisten tanpa menambah kerumitan.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 text-sm">
          <div className="space-y-2">
            <p className="font-medium">Produk</p>
            <Link href="/pricing" className="block py-1 text-muted-foreground hover:text-foreground">
              Harga
            </Link>
            <Link href="/register" className="block py-1 text-muted-foreground hover:text-foreground">
              Mulai gratis
            </Link>
            <Link href="/login" className="block py-1 text-muted-foreground hover:text-foreground">
              Masuk
            </Link>
          </div>
          <div className="space-y-2">
            <p className="font-medium">Legal</p>
            <Link href="/legal/privacy" className="block py-1 text-muted-foreground hover:text-foreground">
              Kebijakan Privasi
            </Link>
            <Link href="/legal/terms" className="block py-1 text-muted-foreground hover:text-foreground">
              Syarat Layanan
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-border/70">
        <div className="page-container flex flex-col gap-2 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} HabitFlow.</p>
          <p>Dibuat untuk kebiasaan yang bisa dijalankan, bukan sekadar dicatat.</p>
        </div>
      </div>
    </footer>
  );
}
