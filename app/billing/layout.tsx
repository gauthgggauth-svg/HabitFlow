import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Logo } from "@/components/logo";

export default function BillingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border print:hidden">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-4 px-4">
          <Logo href="/app" />
          <Link
            href="/app"
            className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Kembali ke aplikasi
          </Link>
        </div>
      </header>

      <main id="konten" className="mx-auto max-w-3xl px-4 py-8 print:max-w-none print:px-0 print:py-0">
        {children}
      </main>
    </div>
  );
}
