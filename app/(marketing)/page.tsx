import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Check,
  CheckCircle2,
  Flame,
  ListChecks,
  MousePointerClick,
  Repeat2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { TodayPreview } from "@/components/marketing/today-preview";
import { PlanCards } from "@/components/pricing/plan-cards";
import { getAccount } from "@/lib/auth/account";
import { clientEnv } from "@/lib/env";
import { getActivePlans } from "@/services/plans";

const steps = [
  {
    icon: Repeat2,
    title: "Buat habit yang jelas",
    body: "Tentukan nama, frekuensi, dan jam pengingat. Mulai dari satu kebiasaan kecil, bukan daftar panjang.",
  },
  {
    icon: MousePointerClick,
    title: "Tandai selesai hari ini",
    body: "Satu ketukan untuk check-in. Streak dan progres diperbarui tanpa perlu menghitung manual.",
  },
  {
    icon: Bell,
    title: "Biarkan pengingat bekerja",
    body: "Terima notifikasi web push saat waktunya. Email opsional tersedia untuk paket berbayar.",
  },
];

const features = [
  {
    icon: Flame,
    title: "Habit dan streak",
    body: "Habit harian atau hari tertentu, dengan riwayat 7 hari dan streak yang hanya menghitung jadwal sebenarnya.",
  },
  {
    icon: ListChecks,
    title: "Tugas yang mendukung",
    body: "Catat tugas pendukung, atur prioritas dan tenggat, lalu selesaikan langsung dari dashboard.",
  },
  {
    icon: Bell,
    title: "Pengingat yang relevan",
    body: "Pengingat disesuaikan dengan zona waktu dan jadwal habit. Tidak ada notifikasi untuk hari yang tidak dijadwalkan.",
  },
  {
    icon: BarChart3,
    title: "Kemajuan yang terbaca",
    body: "Lihat completion rate dan pola konsistensi. Statistik lanjutan tersedia untuk paket Pro.",
  },
];

const faqs = [
  {
    question: "Apakah HabitFlow gratis?",
    answer:
      "Ya. Paket Free dapat dipakai tanpa batas waktu dengan maksimum 3 habit aktif dan 20 tugas belum selesai. Kamu bisa upgrade jika butuh kapasitas atau fitur lebih.",
  },
  {
    question: "Apa yang terjadi jika saya berhenti berlangganan?",
    answer:
      "Akses berbayar tetap berjalan sampai akhir periode yang sudah dibayar. Setelah itu akun kembali ke paket Free, data tetap tersimpan, dan fitur berbayar terkunci.",
  },
  {
    question: "Apakah pengingat bisa dikirim lewat email?",
    answer:
      "Email pengingat tersedia sebagai opsi untuk paket Standard dan Pro. Pengingat web push tersedia untuk semua paket setelah kamu memberi izin notifikasi.",
  },
  {
    question: "Apakah data saya bisa diekspor?",
    answer:
      "Paket Pro dapat mengunduh habit, tugas, dan riwayat check-in dalam format CSV yang bisa dibuka di Excel.",
  },
];

export default async function LandingPage() {
  const [plans, account] = await Promise.all([getActivePlans(), getAccount()]);
  const authenticated = Boolean(account?.user);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "HabitFlow",
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Web",
    url: clientEnv.NEXT_PUBLIC_APP_URL,
    description:
      "Habit tracker dan to-do list dengan pengingat untuk membantu membangun kebiasaan dan menyelesaikan tugas harian.",
    offers: plans.map((plan) => ({
      "@type": "Offer",
      name: plan.name,
      price: plan.price,
      priceCurrency: "IDR",
      category: plan.price === 0 ? "free" : "subscription",
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="border-b border-border/70">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
              Habit, tugas, dan pengingat dalam satu tempat
            </p>

            <h1 className="mt-5 max-w-xl font-heading text-4xl leading-[1.08] font-semibold tracking-tight sm:text-5xl">
              Bangun kebiasaan kecil. Lihat hasilnya setiap hari.
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              HabitFlow membantumu tahu apa yang perlu dikerjakan hari ini,
              menandai progres dengan satu ketukan, dan tetap konsisten lewat
              pengingat yang sesuai jadwal.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href={authenticated ? "/app" : "/register"}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {authenticated ? "Buka aplikasi" : "Mulai gratis"}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex h-12 items-center justify-center rounded-lg border border-border bg-background px-6 text-sm font-medium transition-colors hover:bg-muted"
              >
                Lihat paket
              </Link>
            </div>

            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {["3 habit aktif gratis", "Tanpa trial", "Bisa berhenti kapan saja"].map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <Check className="size-4 text-primary" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="mx-auto w-full max-w-md lg:max-w-none">
            <TodayPreview />
          </div>
        </div>
      </section>

      <section id="cara-kerja" className="border-b border-border/70">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              Cara kerja
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Tiga langkah, lalu jalankan setiap hari.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Tidak perlu menyiapkan sistem yang rumit. HabitFlow hanya
              membutuhkan satu kebiasaan pertama untuk mulai berguna.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="streak-number text-sm text-muted-foreground">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 font-heading text-base font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="fitur" className="border-b border-border/70">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                Fitur
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                Yang penting, tanpa yang berlebihan.
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Fokus MVP HabitFlow adalah alur harian: membuat habit,
                menyelesaikan tugas, menerima pengingat, dan melihat kemajuan.
              </p>
              <div className="mt-5 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
                <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
                Data hanya dapat diakses oleh pemilik akun.
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="rounded-xl border border-border bg-card p-5">
                    <Icon className="size-5 text-primary" aria-hidden="true" />
                    <h3 className="mt-3 font-heading text-base font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="harga" className="border-b border-border/70">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                Harga
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                Mulai gratis. Upgrade saat butuh.
              </h2>
              <p className="mt-3 max-w-2xl text-muted-foreground">
                Semua paket ditagih bulanan. Harga ditampilkan sebelum kamu
                melanjutkan ke pembayaran.
              </p>
            </div>
            <Link href="/pricing" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary hover:underline">
              Bandingkan paket
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          {plans.length > 0 ? (
            <PlanCards plans={plans} entitlement={account?.entitlement} compact />
          ) : (
            <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
              Daftar paket sedang tidak dapat dimuat. Coba muat ulang halaman.
            </p>
          )}
        </div>
      </section>

      <section className="border-b border-border/70">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                Pertanyaan umum
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                Sebelum mulai.
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Belum menemukan jawaban? Hubungi dukungan setelah kamu masuk ke
                aplikasi.
              </p>
            </div>

            <div className="divide-y divide-border rounded-xl border border-border bg-card">
              {faqs.map((faq) => (
                <details key={faq.question} className="group px-4 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-md text-sm font-medium focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
                    {faq.question}
                    <CheckCircle2 className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-45" aria-hidden="true" />
                  </summary>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="rounded-2xl border border-border bg-card px-6 py-10 text-center sm:px-10">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Mulai dari satu habit hari ini.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              Tidak perlu menunggu hari Senin. Buat kebiasaan pertama, atur
              pengingat, dan lihat progresnya besok.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href={authenticated ? "/app" : "/register"}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {authenticated ? "Buka aplikasi" : "Mulai gratis"}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex h-12 items-center justify-center rounded-lg border border-border bg-background px-6 text-sm font-medium transition-colors hover:bg-muted"
              >
                Lihat paket
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
