# HabitFlow

**Habit tracker, to-do list, dan pengingat harian dalam satu aplikasi.**

HabitFlow membantu individu membangun kebiasaan positif, mengelola tugas harian, dan menerima pengingat agar konsisten — tanpa menambah kerumitan.

- **Habit & check-in:** buat habit harian atau berjadwal, tandai selesai hari ini, lihat streak dan progres.
- **To-do list:** catat tugas pendukung dengan prioritas dan tenggat, selesaikan langsung dari daftar.
- **Reminder:** pengingat sesuai zona waktu dan jadwal habit (web push, email opsional).
- **Subscription:** paket Free / Standard / Pro berbayar bulanan via Midtrans; akses berbayar dengan grace periode.

Dokumen produk dan task breakdown: [`PRD.md`](./PRD.md), [`TASKS.md`](./TASKS.md).

---

## Tech Stack

| Area | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript strict |
| UI | Tailwind CSS v4, shadcn/ui (Base UI), Lucide |
| Database & Auth | Supabase (PostgreSQL + Auth + Storage) |
| Payment | Midtrans (Snap + Subscription API) |
| Push | Web Push (VAPID) + Supabase Realtime |
| Testing | Vitest, Testing Library, Playwright |
| Hosting (MVP) | Vercel + Supabase |

## Fitur MVP

### Fase 1–2: Inti pengguna
- Auth email/password + Google OAuth, onboarding singkat.
- Dashboard “Hari ini”: ringkasan hari, check-in cepat, tugas aktif.
- Habit CRUD (frekuensi harian / hari tertentu), check-in dan undo, streak.
- To-do list CRUD, prioritas, tenggat, tab aktif/selesai.

### Fase 3: Pengingat & pricing
- Scheduler reminder via Supabase Cron (interval 5 menit, idempotent).
- Web push + email pengingat (email untuk paket berbayar).
- Halaman pricing publik, paywall, checkout Midtrans, recurring subscription.

### Fase 4: Transaksi & operasional
- Webhook Midtrans dengan verifikasi signature, state machine idempotent.
- Customer portal: billing, riwayat pembayaran, receipt, cancel, upgrade.
- Rekonsiliasi gagal bayar dan admin dashboard (metrik produk).

### Fase 5: Statistik & data
- Statistik dasar (Free preview, Standard 7/30 hari, Pro 90 hari + per habit).
- Ekspor CSV (Pro), tema gelap premium (Pro).

## Memulai Lokal

Prasyarat: Node.js 20+, Docker (untuk Supabase lokal).

```bash
# 1. Salin environment
cp .env.example .env.local
# Isi nilai dari `npx supabase status -o env` (lokal) dan VAPID keys.

# 2. Jalankan Supabase lokal
npx supabase start
npx supabase db reset   # migrasi + seed

# 3. Jalankan aplikasi
npm run dev
```

Buka http://localhost:3000.

## Script

| Script | Peran |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Build produksi |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript strict check |
| `npm test` | Vitest unit test |
| `npm run test:e2e` | Playwright E2E |

## Environment Variables

| Variable | Keterangan |
|---|---|
| `NEXT_PUBLIC_APP_URL` | Base URL aplikasi |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase (local atau cloud) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only (admin/cron) |
| `MIDTRANS_SERVER_KEY` | Server only; `MIDTRANS_IS_PRODUCTION`, `MIDTRANS_SNAP_SCRIPT_URL` |
| `CRON_SECRET` | Bearer token untuk endpoint internal scheduler |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Web push |
| `RESEND_API_KEY`, `EMAIL_FROM` | Email opsional |

## Deployment

MVP menyiapkan deployment di **Vercel** + **Supabase** (Free tier). Langkah:

1. Push repository ke GitHub.
2. Connect project ke Vercel; tambahkan environment variables.
3. Connect Supabase project (cloud) dan jalankan migrasi `supabase/migrations`.
4. Set Midtrans server key, VAPID, Resend, dan cron schedule (Supabase Cron → `/api/cron/reminders`).

## Asumsi & Scope

- Satu akun = satu pengguna; berbagi akun berbayar tidak diperbolehkan.
- Bulanan saja; tanpa prorata/refund untuk sisa periode.
- Admin read-only di MVP.
- Task breakdown lengkap ada di [`TASKS.md`](./TASKS.md).

## Lisensi

Proprietary — hak cipta HabitFlow.
