import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Minus } from "lucide-react";

import { PlanCards } from "@/components/pricing/plan-cards";
import { getAccount } from "@/lib/auth/account";
import { formatIDR } from "@/lib/format";
import { getActivePlans } from "@/services/plans";

export const metadata: Metadata = {
  title: "Harga",
  description:
    "Bandingkan paket Free, Standard, dan Pro HabitFlow. Semua paket berbayar ditagih bulanan.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Harga HabitFlow",
    description:
      "Bandingkan paket Free, Standard, dan Pro HabitFlow. Semua paket berbayar ditagih bulanan.",
    url: "/pricing",
  },
};

const statsLabel = {
  locked: "Terkunci",
  basic: "7 dan 30 hari",
  advanced: "90 hari + per habit",
} as const;

export default async function PricingPage() {
  const [plans, account] = await Promise.all([getActivePlans(), getAccount()]);

  const rows = [
    {
      label: "Harga bulanan",
      values: plans.map((plan) => (plan.price === 0 ? "Rp0" : formatIDR(plan.price))),
    },
    {
      label: "Habit aktif",
      values: plans.map((plan) => {
        const limit = (plan.limits as { active_habits?: number | null }).active_habits;
        return limit === null ? "Tanpa batas" : `${limit ?? 3} habit`;
      }),
    },
    {
      label: "Tugas belum selesai",
      values: plans.map((plan) => {
        const limit = (plan.limits as { active_tasks?: number | null }).active_tasks;
        return limit === null ? "Tanpa batas" : `${limit ?? 20} tugas`;
      }),
    },
    {
      label: "Pengingat web push",
      values: plans.map(() => "Ya"),
    },
    {
      label: "Email pengingat",
      values: plans.map((plan) =>
        (plan.features as { email_reminders?: boolean }).email_reminders ? "Ya" : "Tidak",
      ),
    },
    {
      label: "Statistik",
      values: plans.map((plan) => {
        const stats = (plan.features as { stats?: keyof typeof statsLabel }).stats ?? "locked";
        return statsLabel[stats];
      }),
    },
    {
      label: "Ekspor CSV",
      values: plans.map((plan) =>
        (plan.features as { csv_export?: boolean }).csv_export ? "Ya" : "Tidak",
      ),
    },
    {
      label: "Tema gelap",
      values: plans.map((plan) =>
        (plan.features as { dark_theme?: boolean }).dark_theme ? "Ya" : "Tidak",
      ),
    },
    {
      label: "Prioritas dukungan",
      values: plans.map((plan) =>
        (plan.features as { priority_support?: boolean }).priority_support ? "Ya" : "Tidak",
      ),
    },
  ];

  return (
    <>
      <section className="border-b border-border/70">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-16">
          <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            Harga
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Pilih kapasitas yang kamu butuhkan.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            Mulai dengan Free untuk kebiasaan pertama. Upgrade ke Standard saat
            butuh habit dan tugas tanpa batas, atau Pro untuk statistik
            lanjutan, ekspor data, dan tema gelap.
          </p>
        </div>
      </section>

      <section className="border-b border-border/70">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-12">
          {plans.length > 0 ? (
            <PlanCards plans={plans} entitlement={account?.entitlement} />
          ) : (
            <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
              Daftar paket sedang tidak dapat dimuat. Coba muat ulang halaman.
            </p>
          )}

          <div className="mt-8 overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full min-w-[640px] text-sm">
              <caption className="sr-only">Perbandingan fitur paket HabitFlow</caption>
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="px-4 py-3 text-left font-medium">
                    Fitur
                  </th>
                  {plans.map((plan) => (
                    <th key={plan.id} scope="col" className="px-4 py-3 text-center font-medium">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label} className="border-b border-border/70 last:border-0">
                    <th scope="row" className="px-4 py-3 text-left font-normal text-muted-foreground">
                      {row.label}
                    </th>
                    {row.values.map((value, index) => (
                      <td key={`${row.label}-${index}`} className="px-4 py-3 text-center">
                        {value === "Ya" ? (
                          <Check className="mx-auto size-4 text-primary" aria-label="Ya" />
                        ) : value === "Tidak" ? (
                          <Minus className="mx-auto size-4 text-muted-foreground" aria-label="Tidak" />
                        ) : (
                          value
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="border-b border-border/70">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">Pertanyaan tentang pembayaran</h2>
          <div className="mt-6 divide-y divide-border rounded-xl border border-border bg-card">
            {[
              {
                question: "Metode pembayaran apa yang didukung?",
                answer:
                  "Pembayaran diproses oleh Midtrans. Untuk langganan berulang, metode yang didukung adalah kartu, dan GoPay bila fitur tokenisasi aktif di akun merchant.",
              },
              {
                question: "Apakah ada biaya tersembunyi?",
                answer:
                  "Tidak. Harga yang tampil adalah harga paket per bulan. Pajak atau biaya lain, jika ada, ditampilkan sebelum pembayaran dikonfirmasi.",
              },
              {
                question: "Bisakah saya mengganti paket?",
                answer:
                  "Bisa. Paket baru dibayar terpisah dan langsung aktif setelah pembayaran berhasil. Tidak ada prorata atau refund untuk sisa periode paket lama.",
              },
              {
                question: "Bagaimana cara berhenti berlangganan?",
                answer:
                  "Buka halaman Langganan lalu pilih batalkan. Akses berbayar tetap berlaku sampai akhir periode yang sudah dibayar, lalu akun kembali ke Free.",
              },
            ].map((faq) => (
              <details key={faq.question} className="px-4 py-4">
                <summary className="cursor-pointer list-none rounded-md text-sm font-medium focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
                  {faq.question}
                </summary>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
              </details>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center">
            <div>
              <p className="font-medium">Belum yakin memilih paket?</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Mulai dari Free. Kamu bisa upgrade saat benar-benar membutuhkan.
              </p>
            </div>
            <Link
              href={account?.user ? "/app" : "/register"}
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {account?.user ? "Buka aplikasi" : "Mulai gratis"}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
