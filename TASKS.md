# HabitFlow — Task Breakdown MVP

**Versi:** 1.0  
**Tanggal:** 23 November 2026  
**Sumber:** `PRD.md` v1.0-draft  
**Panduan kerja:** `CLAUDE.md`  
**Status:** Siap dieksekusi setelah asumsi di §2 dikonfirmasi.

Dokumen ini memecah MVP HabitFlow menjadi 41 task. Setiap task punya dependensi, scope, spesifikasi kunci, dan verifikasi. Task tidak boleh dikerjakan melebihi scope tanpa persetujuan.

---

## 1. Keputusan yang Sudah Dikunci

| Area | Keputusan |
|---|---|
| Arah desain | **A — Clean Product** (PRD §8) |
| Frontend | Next.js App Router, TypeScript strict, Tailwind CSS, shadcn/ui, Lucide |
| Backend | Next.js Route Handlers + Server Actions |
| Database & Auth | Supabase (PostgreSQL, Supabase Auth) |
| Payment | Midtrans Snap + Subscription API, **bulanan saja** |
| Hosting | Vercel + Supabase Free untuk MVP (asumsi A-01) |
| Bahasa produk | Indonesia |
| Scheduler reminder | Supabase Cron (`pg_cron` + `pg_net`) memanggil endpoint internal setiap 5 menit |
| Testing | Vitest + Testing Library + Playwright |
| Package manager | npm |

**Catatan teknis:** Vercel Hobby hanya mengizinkan cron 1×/hari, sehingga tidak dipakai untuk reminder. Midtrans recurring memerlukan `saved_token_id` (kartu) atau token GoPay; notifikasi recurring diverifikasi ulang lewat Core API karena payload recurring tidak membawa `signature_key` seperti notifikasi transaksi.

---

## 2. Asumsi dan Aturan Produk

Asumsi berikut dipakai agar task bisa dieksekusi. Item **perlu konfirmasi** harus disetujui sebelum task terkait dimulai.

| ID | Area | Default yang dipakai | Dampak jika berbeda |
|---|---|---|---|
| A-01 | Hosting | Vercel Hobby + Supabase Free. Upgrade hanya bila limit resource menghambat. | Konfigurasi deployment dan batas function dapat berubah. |
| A-02 | Limit habit Free | Maksimum **3 habit aktif**. Habit nonaktif tidak dihitung. | Ubah query entitlement dan copy limit. |
| A-03 | Limit task Free | Maksimum **20 task belum selesai**. Task selesai tidak dihitung. **Perlu konfirmasi.** | Jika dihitung total, task selesai memakan kuota. |
| A-04 | Reminder per tier | Web push untuk semua tier; email fallback untuk Standard/Pro, opt-in. | Jika email untuk semua tier, gating berubah. |
| A-05 | Streak | Deret kejadian terjadwal yang selesai, dihitung di zona waktu pengguna. Hari ini yang belum selesai tidak memutus streak sampai hari berganti. Tidak ada backfill. | Perlu definisi dan unit test baru. |
| A-06 | Ganti paket | Checkout paket baru; setelah pembayaran sukses, langganan lama dinonaktifkan dan paket baru aktif. **Tanpa prorata/refund**, dengan peringatan jelas. **Perlu konfirmasi.** | Alternatif: perubahan berlaku akhir periode; menambah state dan logika billing. |
| A-07 | Grace gagal bayar | Status `past_due` tetap punya akses sampai `current_period_end + 3 hari`, lalu `expired` dan turun ke Free. | Tanpa grace, akses langsung berhenti saat charge gagal. |
| A-08 | Trial | Tidak ada trial di MVP. KPI trial di PRD tidak dihitung. | Menambah state, email, dan konversi trial. |
| A-09 | Konfirmasi email | Aktif di production; boleh dimatikan saat development lokal. | Alur onboarding berubah bila signup langsung memberi sesi. |
| A-10 | GoPay recurring | Jalur rilis: **kartu**. GoPay tokenization dikerjakan bila fitur sudah aktif di akun Midtrans. **Perlu konfirmasi.** | Jika belum aktif, GoPay tidak ditawarkan sebagai recurring. |
| A-11 | Admin | Read-only: lihat pengguna, langganan, transaksi, metrik. Role admin diatur lewat SQL. | Aksi admin dan editor plan menambah audit/otorisasi. |
| A-12 | Fitur Pro | Statistik lanjutan (90 hari, per-habit, best streak, pola hari), ekspor CSV, tema gelap, tautan prioritas support. Heatmap tidak termasuk. | Scope Pro berubah. |
| A-13 | Invoice | Riwayat pembayaran + halaman receipt yang bisa dicetak. Bukan invoice pajak. | Invoice pajak butuh format dan data legal. |
| A-14 | SLA reminder | Cron 5 menit; reminder terkirim dalam ±5 menit dari jadwal. | SLA lebih ketat butuh scheduler lain. |
| A-15 | Harga | Placeholder Rp29.000 dan Rp59.000/bulan; belum termasuk pajak. Biaya gateway ditanggung merchant. | Harga dan copy pricing berubah. |
| A-16 | Halaman legal | Kebijakan Privasi dan Syarat Layanan diperlukan untuk aktivasi Midtrans production; konten disiapkan pemilik produk. | Rilis production bisa tertunda. |
| A-17 | Due date task | UI memilih tanggal; disimpan sebagai `timestamptz` pukul 23:59 di zona waktu pengguna. | Jika butuh jam, form dan sorting berubah. |
| A-18 | PWA | Manifest + service worker untuk push. Tidak ada offline caching di MVP. | Offline mode menambah strategi cache. |

**Perlu dikonfirmasi sebelum task terkait:** A-03 (TASK-015), A-06 (TASK-026), A-10 (TASK-024), A-16 (TASK-041).

---

## 3. Arsitektur dan Konvensi

### 3.1 Struktur folder

```text
app/
  (marketing)/page.tsx, pricing/
  (auth)/login/, register/, forgot-password/, reset-password/
  auth/callback/route.ts
  onboarding/
  (app)/app/, app/habits/, app/habits/new/, app/habits/[id]/
  (app)/app/tasks/, app/stats/, app/settings/
  (app)/billing/, checkout/[planId]/
  admin/
  api/webhooks/midtrans/route.ts
  api/internal/reminders/dispatch/route.ts
  api/internal/reconcile/route.ts
  api/export/route.ts
components/   # ui/, habits/, tasks/, dashboard/, billing/, admin/
lib/          # supabase/, auth/, entitlements.ts, dates.ts, validation/
services/     # habits.ts, tasks.ts, reminders.ts, subscriptions.ts, stats.ts
integrations/ # midtrans/, push.ts, email.ts
types/
supabase/migrations/
tests/
middleware.ts
```

### 3.2 Entitas data

Tabel mengikuti PRD §7, ditambah `push_subscriptions` untuk web push.

| Tabel | Catatan |
|---|---|
| `users` | Mirror `auth.users`; `role`, `timezone`, `notification_permission`, `onboarding_completed_at`, `goal`, `default_reminder_time`, `theme`. |
| `plans` | `code`, `price` (integer IDR), `interval`, `limits` JSONB, `features` JSONB. |
| `subscriptions` | Status `pending/active/past_due/canceled/expired`, `gateway_subscription_id`, `current_period_end`. |
| `payments` | Status `pending/paid/failed/expired/refunded`, `gateway_order_id`, `gateway_transaction_id`. |
| `habits` | `frequency` (`daily`/`weekdays`), `weekdays` ISO 1–7, `reminder_time`, `color`, `icon`, `is_active`. |
| `habit_logs` | Unik per `(habit_id, scheduled_date)`; `scheduled_date` adalah tanggal lokal pengguna. |
| `tasks` | `due_at` opsional, `priority` (`low/medium/high`), `is_completed`, `completed_at`. |
| `reminders` | Unik per `(habit_id, scheduled_at, channel)`; status `pending/sent/failed/skipped`. |
| `push_subscriptions` | Endpoint unik, `p256dh`, `auth`, `revoked_at`. |
| `webhook_events` | `event_key` unik, payload mentah, status proses, error. |

RLS: pengguna hanya bisa membaca/menulis data miliknya. `plans` boleh dibaca publik. Penulisan `subscriptions`, `payments`, `reminders`, dan `webhook_events` hanya lewat service role/server. Admin memakai service role di server setelah `requireAdmin()`, bukan policy RLS lebar.

### 3.3 Environment variables

```text
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
MIDTRANS_SERVER_KEY
MIDTRANS_IS_PRODUCTION
CRON_SECRET
NEXT_PUBLIC_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
VAPID_SUBJECT
RESEND_API_KEY          # opsional
EMAIL_FROM              # opsional
```

Secret hanya di server. Tidak ada `SUPABASE_SERVICE_ROLE_KEY` atau `MIDTRANS_SERVER_KEY` yang boleh masuk bundle client. Validasi env dengan Zod saat startup; pesan error tidak boleh membocorkan nilai secret.

### 3.4 Alur kritis

1. **Auth:** Supabase SSR → middleware memperbarui sesi → layout `(app)` memeriksa user → onboarding jika belum selesai.
2. **Check-in:** server action memeriksa ownership, jadwal lokal, dan unique constraint → insert/hapus `habit_logs` → streak dihitung ulang.
3. **Reminder:** Supabase Cron POST ke endpoint internal dengan `CRON_SECRET` → enqueue reminder yang jatuh tempo → kirim web push/email → catat status.
4. **Payment:** checkout membuat Snap redirect → notifikasi transaksi diverifikasi signature → setelah pembayaran awal sukses, subscription Midtrans dibuat → notifikasi recurring diverifikasi lewat Core API → status dan periode diperbarui. Webhook adalah sumber kebenaran, bukan halaman finish.

### 3.5 Aturan implementasi

- Server Action/Route Handler wajib memvalidasi input dengan Zod dan memeriksa user + kepemilikan resource.
- Jangan pernah mempercayai `plan`, `price`, `status`, atau `user_id` dari client.
- Tanggal disimpan UTC (`timestamptz`); tanggal kalender pengguna dihitung dengan `users.timezone` (`date-fns-tz`).
- Uang disimpan sebagai integer rupiah; tidak ada float.
- Error ke pengguna memakai bahasa Indonesia yang aman; detail teknis hanya di log server.
- Copy UI mengikuti PRD; jangan menambah klaim, testimoni, atau angka palsu.
- Komponen memakai token desain; tidak ada gradien ungu-biru, glassmorphism, atau emoji sebagai ikon.
- Setiap task menulis/memperbarui test untuk logika yang berubah bila memungkinkan.

### 3.6 Definition of Done global

- [ ] Scope task selesai, tidak ada fitur tambahan.
- [ ] `npm run lint`, `npm run typecheck`, dan `npm run build` lolos.
- [ ] Test terkait lolos; tidak ada test yang dihapus agar build hijau.
- [ ] Responsive 360 px, 768 px, dan 1440 px.
- [ ] Aksesibel: label form, focus state, navigasi keyboard, kontras AA, target sentuh ≥44 px.
- [ ] Tidak ada secret atau data sensitif di client/log.
- [ ] Empty, loading, error, dan success state relevan ditangani.
- [ ] Dokumentasi/README diperbarui bila setup atau env berubah.

### 3.7 Perintah verifikasi

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

---

## 4. Ringkasan Milestone

| Fase | Task | Hasil |
|---|---|---|
| 0 — Fondasi | 001–005 | Proyek, database, entitlement, desain, testing |
| 1 — Auth & onboarding | 006–008 | Pengguna bisa daftar, masuk, onboarding, atur profil |
| 2 — Habit & Today | 009–014 | Habit CRUD, check-in, streak, dashboard |
| 3 — To-do | 015–016 | Task CRUD dan integrasi dashboard |
| 4 — Reminder | 017–020 | Web push, scheduler, pengiriman, email opsional |
| 5 — Subscription | 021–027 | Pricing, paywall, checkout, recurring, webhook, billing |
| 6 — Admin | 028–030 | Guard, data operasional, metrik |
| 7 — Statistik & Pro | 031–033 | Statistik, ekspor, tema |
| 8 — Landing & polish | 034–037 | Landing, SEO, state, aksesibilitas |
| 9 — QA & rilis | 038–041 | Test, E2E, keamanan, deployment |

**Jalur kritis:** 001 → 002 → 003 → 004 → 006 → 008 → 009 → 010 → 011 → 013 → 014 → 015 → 021 → 022 → 023 → 024 → 025 → 026 → 027 → 038 → 039 → 040 → 041.

**Jalur paralel setelah fondasi:** core habit/task (009–016), reminder (017–020), monetization (021–027), admin (028–030). Untuk eksekusi AI agent, kerjakan berurutan sesuai ID kecuali dinyatakan lain.

## 5. Detail Task

---

### TASK-001 — Inisialisasi proyek dan environment
`Fase 0` · Dependensi: — · Ukuran: M

**Tujuan:** Menyediakan repository yang bersih, bisa dijalankan lokal, dan tervalidasi konfigurasinya.

**Scope**
- Inisialisasi Next.js App Router + TypeScript strict + Tailwind + shadcn/ui + Lucide.
- ESLint, Prettier, script `lint`, `typecheck`, `test`, `test:e2e`, `build`.
- `git init`, `.gitignore`, `.env.example`, README setup lokal.
- Struktur folder sesuai §3.1.
- Validasi environment dengan Zod, dipisah schema client/server.

**Spesifikasi kunci**
- Versi dependency mengikuti rilis stabil saat task dikerjakan; lockfile di-commit.
- `lib/env.ts` gagal cepat dengan pesan yang menyebut nama variabel, bukan nilainya.
- README mencakup Supabase CLI, Midtrans sandbox, pembuatan VAPID key, dan cara test.
- Tidak ada secret nyata di repository.

**Verifikasi**
- [ ] `npm run dev` menampilkan halaman dasar.
- [ ] `npm run build` lolos dengan env lokal terisi.
- [ ] Menghapus env wajib menghasilkan error konfigurasi yang jelas.
- [ ] `.env*` tidak ter-commit; `.env.example` lengkap.
- [ ] Struktur folder dan README sesuai §3.

---

### TASK-002 — Skema database, migrasi, RLS, dan tipe
`Fase 0` · Dependensi: 001 · Ukuran: L

**Tujuan:** Menyediakan data model yang aman untuk seluruh MVP.

**Scope**
- Migrasi SQL untuk 10 tabel di §3.2, enum, foreign key, index, dan constraint.
- Trigger `updated_at`, trigger pembuatan `public.users` dari `auth.users`.
- RLS semua tabel; policy ownership; `plans` read-only publik.
- `push_subscriptions` dan kolom profil yang dibutuhkan onboarding/tema.
- Generate TypeScript types ke `types/database.ts`.
- Dokumentasi cara membuat admin pertama lewat SQL.

**Spesifikasi kunci**
- Unique: `habit_logs(habit_id, scheduled_date)`, `push_subscriptions(endpoint)`, `webhook_events(event_key)`, `payments(gateway_transaction_id)`, `plans(code)`.
- Timestamp yang dibutuhkan metrik: `subscriptions.canceled_at`, `payments.paid_at`, `reminders.sent_at`, `webhook_events.processed_at`.
- Index: log per user+tanggal, task per user+status+due, subscription per user+status, reminder status+jadwal.
- `subscriptions`, `payments`, `reminders`, `webhook_events` tidak bisa ditulis client.
- Admin tidak memakai policy RLS lebar; akses lewat service role setelah otorisasi server.
- `users.timezone` default `Asia/Jakarta`; `users.theme` default `light`.

**Verifikasi**
- [ ] `supabase db reset` menerapkan semua migrasi dari nol tanpa error.
- [ ] Test SQL membuktikan user A tidak bisa membaca/mengubah data user B.
- [ ] User tidak bisa menaikkan plan/status langganan sendiri.
- [ ] Types tergenerate dan dipakai tanpa `any`.
- [ ] Admin pertama bisa dibuat dan login.

---

### TASK-003 — Seed plan dan modul entitlement
`Fase 0` · Dependensi: 002 · Ukuran: S

**Tujuan:** Menjadikan batas tier satu sumber kebenaran yang dipakai server dan UI.

**Scope**
- Seed idempotent untuk Free, Standard, Pro.
- Modul `lib/entitlements.ts`: plan aktif user, limit, dan feature flag.
- Helper format harga dan aturan fallback ke Free.

**Spesifikasi kunci**

| Plan | Harga/bln | Habit aktif | Task aktif | Statistik | Email | Ekspor | Tema |
|---|---:|---:|---:|---|---|---|---|
| Free | 0 | 3 | 20 | terkunci | tidak | tidak | tidak |
| Standard | 29.000 | unlimited | unlimited | dasar | ya | tidak | tidak |
| Pro | 59.000 | unlimited | unlimited | lanjutan | ya | ya | ya |

- `limits` dan `features` disimpan JSONB; validasi dengan Zod.
- Tanpa subscription aktif → Free. `canceled`/`past_due` tetap mengikuti akses sesuai A-07.
- Enforcement hanya di server; UI hanya menampilkan konsekuensinya.

**Verifikasi**
- [ ] Seed dijalankan dua kali tidak membuat duplikat.
- [ ] Unit test: Free default, plan aktif, `canceled` dalam periode, dan `expired`.
- [ ] Harga tampil `Rp29.000` tanpa hardcode ganda di halaman.
- [ ] Tidak ada keputusan entitlement yang hanya mengandalkan client.

---

### TASK-004 — Design system dan app shell
`Fase 0` · Dependensi: 001 · Ukuran: M

**Tujuan:** Menetapkan identitas Clean Product dan kerangka navigasi sebelum fitur dibangun.

**Scope**
- Token warna: ink `#111827`, paper `#FAFAF9`, muted `#6B7280`, moss `#3F6212`, amber `#B45309`.
- Font Inter/Geist untuk UI, JetBrains Mono untuk angka streak.
- Komponen dasar shadcn: button, input, textarea, select, dialog, dropdown, tabs, toast, badge, skeleton.
- App shell: bottom tabs mobile (Today, Habits, Tasks, Profile), sidebar desktop, konten maksimal 960 px.
- Halaman placeholder untuk route di PRD §7.

**Spesifikasi kunci**
- Radius 12–16 px, border tipis, shadow halus; tanpa gradien dekoratif.
- Ikon selalu Lucide; tidak ada emoji sebagai ikon.
- Target sentuh minimal 44 px; focus ring terlihat.
- Judul halaman dan hierarki “apa yang harus saya lakukan hari ini?” konsisten.
- Palet habit memakai warna muted yang selaras (moss, amber, teal, slate, rose), bukan color picker bebas.

**Verifikasi**
- [ ] Shell berubah benar di 360, 768, dan 1440 px.
- [ ] Navigasi keyboard dan focus state berfungsi.
- [ ] Tidak ada horizontal scroll pada 360 px.
- [ ] Placeholder route memakai layout dan metadata dasar.
- [ ] Tidak ada elemen dekoratif tanpa fungsi.

---

### TASK-005 — Setup testing
`Fase 0` · Dependensi: 001 · Ukuran: S

**Tujuan:** Menyediakan jalur verifikasi otomatis sebelum logika bisnis ditulis.

**Scope**
- Vitest + Testing Library + jsdom untuk unit/component test.
- Playwright untuk E2E, dengan web server test.
- Folder `tests/unit`, `tests/integration`, `tests/e2e`, fixture dasar.
- Dokumentasi penggunaan Supabase lokal untuk integration test.
- Script test dan contoh test yang lolos.

**Spesifikasi kunci**
- Test tidak memanggil Midtrans production atau mengirim push/email nyata.
- E2E memakai database lokal/terpisah dan seed yang deterministik.
- Kegagalan test menampilkan screenshot/trace Playwright.

**Verifikasi**
- [ ] `npm test` menjalankan contoh unit test.
- [ ] `npm run test:e2e` menjalankan satu smoke test.
- [ ] `npm run typecheck` mencakup file test.
- [ ] Cara menjalankan test terdokumentasi di README.

---

### TASK-006 — Autentikasi email/password, Google, dan sesi
`Fase 1` · Dependensi: 001, 002, 004 · Ukuran: L

**Tujuan:** Pengguna dapat mendaftar, masuk, keluar, dan memulihkan akun dengan aman.

**Scope**
- Supabase SSR client (browser/server) dan middleware refresh sesi.
- Halaman register, login, lupa password, reset password, callback OAuth.
- Google OAuth; konfirmasi email sesuai A-09.
- Redirect aman setelah login; pesan error generik.
- Proteksi route `(app)` dan redirect pengguna yang sudah login dari halaman auth.

**Spesifikasi kunci**
- Jangan memakai service role untuk flow auth pengguna.
- `next` redirect hanya boleh path internal; tolak URL absolut.
- Sesi diperiksa di server layout, bukan hanya middleware.
- Metadata user (`name`) diisi ke `public.users` lewat trigger; Google tanpa nama memakai bagian email.

**Verifikasi**
- [ ] Register → konfirmasi → login berhasil.
- [ ] Google OAuth berhasil di environment test.
- [ ] Reset password mengirim email dan password baru bisa dipakai.
- [ ] `/app` tanpa sesi redirect ke `/login`; user login tidak bisa membuka `/login`.
- [ ] Redirect `?next=https://evil.test` ditolak.
- [ ] Logout menghapus sesi.

---

### TASK-007 — Onboarding singkat
`Fase 1` · Dependensi: 006 · Ukuran: S

**Tujuan:** Mengumpulkan tujuan dan preferensi pengingat tanpa menghambat aktivasi.

**Scope**
- Satu halaman onboarding, maksimal dua langkah: tujuan habit + jam pengingat default.
- Deteksi zona waktu dari browser; bisa dikoreksi di settings.
- Simpan `goal`, `default_reminder_time`, `timezone`, `onboarding_completed_at`.
- Tombol lewati; redirect ke dashboard; CTA membuat habit pertama.
- Prefill form habit pertama dari pilihan onboarding.

**Spesifikasi kunci**
- Jangan meminta izin notifikasi browser di onboarding; izin diminta setelah ada aksi pengguna (TASK-017).
- Pengguna yang sudah onboarding tidak melihat halaman ini lagi.
- Timezone valid divalidasi terhadap daftar IANA.

**Verifikasi**
- [ ] User baru diarahkan ke onboarding setelah login.
- [ ] Selesai/lewati tersimpan dan tidak muncul lagi.
- [ ] Zona waktu memengaruhi tanggal dashboard.
- [ ] Prefill habit pertama berfungsi.
- [ ] Responsive 360 px dan keyboard-friendly.

---

### TASK-008 — Profil, pengaturan, dan guard otorisasi
`Fase 1` · Dependensi: 006, 003 · Ukuran: M

**Tujuan:** Pengguna dapat mengelola profil dasar dan aplikasi punya guard yang konsisten.

**Scope**
- Halaman settings: nama, timezone, jam pengingat default, status izin notifikasi, tautan langganan, logout.
- Helper server `requireUser()` dan `requireAdmin()`; halaman 403.
- Read-only email; perubahan email di luar MVP.
- Tampilan status plan saat ini di settings.

**Spesifikasi kunci**
- Update profil hanya untuk `auth.uid()` sendiri.
- `requireAdmin()` memeriksa `users.role = 'admin'` di server dan dipakai di semua route admin/API admin.
- Status izin notifikasi adalah informasi; tidak bisa dipaksa dari server.

**Verifikasi**
- [ ] Perubahan nama/timezone/jam tersimpan dan langsung terlihat.
- [ ] Non-admin mendapat 403 pada route admin.
- [ ] User tidak bisa mengubah role/plan lewat request.
- [ ] Settings responsif dan semua field berlabel.

---

### TASK-009 — Logika jadwal, check-in, dan streak
`Fase 2` · Dependensi: 002, 005 · Ukuran: M

**Tujuan:** Menetapkan satu implementasi domain yang benar untuk jadwal dan streak sebelum UI.

**Scope**
- Fungsi murni: `isHabitDueOnDate`, `getCurrentStreak`, `getCompletionRate`.
- Frekuensi `daily` dan `weekdays` (ISO 1–7).
- Perhitungan tanggal lokal dari `users.timezone`.
- Unit test untuk batas hari, minggu, dan undo.

**Spesifikasi kunci**
- Streak hanya menghitung kejadian terjadwal; hari tanpa jadwal tidak memutus streak.
- Jika hari ini terjadwal dan belum selesai, streak dihitung sampai kejadian terjadwal sebelumnya.
- Tidak ada backfill check-in.
- Fungsi tidak mengakses database; input log dan jadwal diberikan oleh pemanggil.

**Verifikasi**
- [ ] Test daily: 3 hari berturut, bolong satu, dan hari ini belum selesai.
- [ ] Test weekdays: Senin/Rabu/Jumat melewati akhir pekan.
- [ ] Test batas tengah malam `Asia/Jakarta` vs `UTC`.
- [ ] Test undo memutus streak dengan benar.
- [ ] Test completion rate 7/30 hari.

---

### TASK-010 — Daftar habit, empty state, dan indikator limit
`Fase 2` · Dependensi: 004, 008, 009 · Ukuran: M

**Tujuan:** Pengguna bisa melihat semua habit dan status kapasitasnya.

**Scope**
- Route `/app/habits`; daftar habit aktif dan nonaktif.
- Kartu habit: ikon, warna, judul, frekuensi, jam pengingat, streak, status.
- Empty state persis PRD: “Belum ada habit. Buat satu kebiasaan kecil yang bisa Anda lakukan hari ini.”
- Indikator `x/3` untuk Free dan CTA upgrade saat penuh.
- Tombol buat habit dan tautan ke detail.

**Spesifikasi kunci**
- Hanya data milik user; urutan aktif lalu dibuat paling baru.
- Nonaktif dipisahkan dan tidak dihitung ke limit.
- Kartu bisa dioperasikan keyboard; status tidak hanya dibedakan warna.
- Loading skeleton dan error state tersedia.

**Verifikasi**
- [ ] Empty state muncul untuk user tanpa habit.
- [ ] Habit aktif/nonaktif tampil benar dan terpisah.
- [ ] Free melihat `3/3` setelah tiga habit aktif.
- [ ] User lain tidak bisa melihat habit lewat URL.
- [ ] Responsive dan lolos cek kontras.

---

### TASK-011 — Buat habit dengan validasi dan limit tier
`Fase 2` · Dependensi: 003, 009, 010 · Ukuran: L

**Tujuan:** Pengguna dapat membuat habit yang valid dan batas Free ditegakkan di server.

**Scope**
- Route `/app/habits/new`; form nama, deskripsi, frekuensi, hari, jam pengingat, ikon, warna, status aktif.
- Pilihan frekuensi: harian atau hari tertentu (ISO 1–7).
- Server action dengan Zod, ownership, dan pemeriksaan limit.
- Ikon dari daftar kurasi Lucide; warna dari palet terbatas.
- Redirect ke detail/list setelah sukses; toast konfirmasi.

**Spesifikasi kunci**
- Judul wajib, maksimal 80 karakter; deskripsi maksimal 500.
- Hari wajib dipilih jika frekuensi `weekdays`.
- Jam pengingat opsional; jika kosong, habit tidak menghasilkan reminder.
- Free: habit aktif ke-4 ditolak dengan copy PRD: “Kamu sudah memakai 3 dari 3 habit aktif. Upgrade ke Standard untuk membuat habit tanpa batas.”
- Duplicate submit dicegah; error field ditampilkan di dekat input.

**Verifikasi**
- [ ] Habit harian dan hari tertentu tersimpan benar.
- [ ] `weekdays` tanpa hari ditolak.
- [ ] Habit ke-4 Free ditolak meski server action dipanggil langsung.
- [ ] Menonaktifkan habit membebaskan slot.
- [ ] User tidak bisa membuat habit untuk user lain.
- [ ] Form responsive dan bisa diselesaikan dengan keyboard.

---

### TASK-012 — Detail, edit, nonaktifkan, dan hapus habit
`Fase 2` · Dependensi: 011 · Ukuran: M

**Tujuan:** Pengguna dapat mengelola habit yang sudah dibuat tanpa kehilangan kontrol data.

**Scope**
- Route `/app/habits/[id]`: detail, riwayat 7 hari, streak, dan form edit.
- Aksi aktif/nonaktif.
- Hapus dengan dialog konfirmasi yang menjelaskan log ikut terhapus.
- 404 untuk habit milik user lain atau ID tidak ada.

**Spesifikasi kunci**
- Edit memakai validasi yang sama dengan create.
- Menonaktifkan tidak menghapus log dan tidak menghitung limit.
- Hapus permanen menghapus habit + log terkait; tidak ada undo.
- Perubahan revalidate dashboard, list, dan statistik.

**Verifikasi**
- [ ] Edit tersimpan dan langsung terlihat.
- [ ] Nonaktif/aktif berfungsi dan mengubah hitungan limit.
- [ ] Hapus meminta konfirmasi dan menghapus log terkait.
- [ ] URL habit user lain menghasilkan 404.
- [ ] Riwayat 7 hari akurat.

---

### TASK-013 — Check-in harian dan undo
`Fase 2` · Dependensi: 009, 011 · Ukuran: M

**Tujuan:** Pengguna dapat menandai habit selesai hari ini dan membatalkannya.

**Scope**
- Server action check-in dan undo untuk tanggal lokal hari ini.
- Unique constraint mencegah duplikat.
- Update optimistis/pending state pada kartu habit dan dashboard.
- Feedback sukses/gagal dan revalidate halaman terkait.

**Spesifikasi kunci**
- Hanya habit yang terjadwal hari ini dan aktif yang bisa check-in.
- `scheduled_date` dihitung dari zona waktu pengguna, bukan zona waktu server.
- Undo hanya untuk check-in hari ini.
- Tidak ada backfill tanggal lampau di MVP.
- Streak dan progress dihitung ulang dari data, bukan disimpan sebagai angka manual.

**Verifikasi**
- [ ] Check-in tersimpan dan bertahan setelah refresh.
- [ ] Klik ganda tidak membuat dua log.
- [ ] Undo menghapus log hari ini dan memperbarui streak.
- [ ] Habit tidak terjadwal hari ini ditolak.
- [ ] Batas tengah malam zona waktu diuji.
- [ ] UI menampilkan pending/error tanpa menghilangkan data.

---

### TASK-014 — Dashboard “Hari ini”
`Fase 2` · Dependensi: 010, 013 · Ukuran: L

**Tujuan:** Menjadikan dashboard jawaban utama atas “apa yang harus saya lakukan hari ini?”.

**Scope**
- Header tanggal Indonesia, sapaan, ringkasan streak/hari.
- Section habit yang jatuh tempo hari ini dengan check-in cepat.
- Section tugas aktif (placeholder sampai TASK-016).
- Empty state dan CTA membuat habit pertama.
- Banner upgrade hanya saat relevan (mendekati/penuh limit).

**Spesifikasi kunci**
- Copy ringkasan: “3 habit selesai hari ini. 1 tugas masih menunggu.”
- Habit diurutkan: belum selesai lebih dulu, lalu streak terbesar.
- Habit yang tidak terjadwal tidak muncul di Today.
- Banner upgrade tidak muncul untuk pengguna baru tanpa habit atau saat masih jauh dari limit.
- Data selalu discope ke user; tidak ada query lintas user.

**Verifikasi**
- [ ] Habit yang muncul sesuai frekuensi dan zona waktu.
- [ ] Ringkasan angka cocok dengan data.
- [ ] Check-in cepat memperbarui kartu tanpa reload penuh.
- [ ] Empty state tampil untuk user baru.
- [ ] Banner hanya muncul saat relevan.
- [ ] Layout 360/768/1440 px rapi.

---

### TASK-015 — CRUD to-do list dan limit Free
`Fase 3` · Dependensi: 003, 008 · Ukuran: L

**Tujuan:** Pengguna dapat mengelola tugas pendukung tanpa berpindah aplikasi.

**Scope**
- Route `/app/tasks`; tambah, edit, selesai/batal selesai, hapus.
- Field: judul, catatan, due date opsional, prioritas rendah/sedang/tinggi.
- Tab aktif dan selesai; sorting due date lalu prioritas.
- Server action dengan validasi, ownership, dan limit Free.

**Spesifikasi kunci**
- Limit Free: 20 task **belum selesai** (A-03); task selesai tidak dihitung.
- Due date disimpan pukul 23:59 waktu lokal pengguna (A-17).
- Task selesai menyimpan `completed_at`; membatalkan mengosongkannya.
- Copy limit task: “Kamu sudah memakai 20 dari 20 tugas aktif. Selesaikan atau hapus tugas, atau upgrade untuk tugas tanpa batas.”
- Hapus memakai konfirmasi; tidak ada undo.

**Verifikasi**
- [ ] CRUD berfungsi dan hanya untuk user sendiri.
- [ ] Task ke-21 yang belum selesai ditolak untuk Free.
- [ ] Menyelesaikan task membebaskan kuota.
- [ ] Due date/overdue dihitung benar di zona waktu pengguna.
- [ ] Sorting dan tab konsisten.
- [ ] Empty state dan form validasi tersedia.

---

### TASK-016 — Integrasi tugas ke dashboard
`Fase 3` · Dependensi: 014, 015 · Ukuran: S

**Tujuan:** Dashboard menampilkan tugas yang paling perlu ditindaklanjuti.

**Scope**
- Ambil maksimal 5 task belum selesai; urutkan overdue, hari ini, mendatang, tanpa due date.
- Checkbox selesai langsung dari dashboard.
- Hitung jumlah seluruh task belum selesai untuk copy ringkasan.
- Tautan “Lihat semua tugas”.

**Spesifikasi kunci**
- Task selesai hilang dari daftar setelah revalidate.
- Overdue dibedakan dengan label, bukan hanya warna.
- Empty state tugas tidak mengganggu empty state habit.

**Verifikasi**
- [ ] Urutan task sesuai aturan.
- [ ] Jumlah di ringkasan cocok dengan total task aktif.
- [ ] Menyelesaikan task dari dashboard memperbarui daftar.
- [ ] Link menuju `/app/tasks`.
- [ ] Tidak ada query ganda yang berlebihan.

---

### TASK-017 — Infrastruktur web push dan service worker
`Fase 4` · Dependensi: 002, 008 · Ukuran: L

**Tujuan:** Browser pengguna bisa menerima notifikasi reminder setelah memberi izin.

**Scope**
- Generate VAPID key; env server/client sesuai §3.3.
- `public/sw.js` untuk menerima `push` dan `notificationclick`.
- Manifest PWA + ikon; tanpa offline caching (A-18).
- Registrasi service worker dan subscribe/unsubscribe.
- Simpan langganan di `push_subscriptions`; endpoint unik per device.
- UI izin: penjelasan sebelum prompt, status granted/denied/default, instruksi iOS.

**Spesifikasi kunci**
- Prompt izin hanya setelah aksi pengguna (toggle “Aktifkan pengingat”).
- Jika denied, tampilkan copy PRD: “Aktifkan notifikasi agar pengingat habit kamu muncul tepat waktu.” plus instruksi browser.
- Endpoint yang sama tidak membuat baris duplikat; update `last_used_at`.
- Klik notifikasi membuka `/app` dan fokus ke jendela yang ada.
- Jangan menampilkan notifikasi palsu saat subscribe.

**Verifikasi**
- [ ] Izin diminta setelah aksi pengguna.
- [ ] Langganan tersimpan dan bisa dicabut.
- [ ] Push uji diterima di Chrome desktop/Android.
- [ ] Service worker menangani klik dengan URL yang benar.
- [ ] Status denied/default/granted tampil benar.
- [ ] iOS menampilkan instruksi Add to Home Screen.

---

### TASK-018 — Penjadwalan reminder
`Fase 4` · Dependensi: 009, 011 · Ukuran: L

**Tujuan:** Reminder dibuat tepat waktu untuk habit yang punya jam pengingat.

**Scope**
- SQL function untuk membuat reminder yang jatuh tempo dalam window lookback 10 menit dan maksimal 5 menit ke depan.
- Hitung `scheduled_at` UTC dari `habits.reminder_time` + `users.timezone`.
- Supabase Cron setiap 5 menit memanggil endpoint internal via `pg_net`.
- Endpoint memverifikasi `CRON_SECRET`, menjalankan enqueue, lalu memanggil pengiriman.
- Unique constraint mencegah duplikat saat job berjalan ganda.

**Spesifikasi kunci**
- Lewati habit nonaktif, tanpa `reminder_time`, atau user tanpa channel aktif.
- Channel `web_push` untuk semua tier; `email` hanya jika opt-in dan plan Standard/Pro (A-04).
- Reminder untuk tanggal lokal yang benar; tidak mengirim untuk hari yang tidak terjadwal.
- Job harus idempotent dan aman dijalankan ulang.
- SLA ±5 menit (A-14).

**Verifikasi**
- [ ] Job Supabase Cron terdaftar dan terlihat di riwayat.
- [ ] Menjalankan endpoint dua kali tidak membuat reminder duplikat.
- [ ] Habit nonaktif dan tanpa jam tidak menghasilkan reminder.
- [ ] `scheduled_at` benar untuk `Asia/Jakarta` dan zona lain.
- [ ] Request tanpa `CRON_SECRET` ditolak 401.
- [ ] Reminder untuk hari yang tidak terjadwal tidak dibuat.

---

### TASK-019 — Pengiriman web push dan status
`Fase 4` · Dependensi: 017, 018 · Ukuran: M

**Tujuan:** Reminder yang sudah dijadwalkan benar-benar terkirim dan kegagalannya tercatat.

**Scope**
- Kirim push untuk reminder `pending` yang sudah jatuh tempo, batch maksimal 50.
- Payload: judul habit, ajakan singkat, URL `/app`.
- Update status `sent/failed`, `sent_at`, dan error terpotong.
- Retry sekali untuk error 5xx/timeout.
- Cabut langganan pada respons 404/410.

**Spesifikasi kunci**
- Endpoint pengiriman hanya bisa dipanggil dengan `CRON_SECRET`.
- Jangan mengirim reminder yang lebih dari 15 menit lewat; tandai `skipped`.
- Log terstruktur tanpa membocorkan endpoint/p256dh penuh.
- Pengiriman idempotent; reminder `sent` tidak dikirim ulang.

**Verifikasi**
- [ ] Push nyata diterima dari reminder terjadwal.
- [ ] Status dan `sent_at` terisi.
- [ ] 404/410 menonaktifkan langganan.
- [ ] Error 5xx dicatat dan di-retry sekali.
- [ ] Reminder basi ditandai `skipped`, bukan dikirim.
- [ ] Batch 50 berjalan tanpa timeout.

---

### TASK-020 — Email reminder opsional
`Fase 4` · Dependensi: 019 · Ukuran: S · **Tidak memblokir rilis**

**Tujuan:** Memberi fallback email bagi pelanggan Standard/Pro yang memilihnya.

**Scope**
- Integrasi Resend dengan env opsional.
- Toggle opt-in di settings; hanya untuk plan dengan feature email.
- Kirim email hanya jika tidak ada push subscription aktif atau push gagal.
- Template email reminder dengan tautan ke `/app`.

**Spesifikasi kunci**
- Default opt-out; email hanya dikirim jika alamat terverifikasi.
- Kegagalan email tidak menggagalkan reminder push dan hanya dicatat.
- Tidak ada tautan check-in bertoken di MVP; tautan hanya membuka aplikasi.
- Jika env Resend kosong, fitur email nonaktif dan UI menjelaskannya.

**Verifikasi**
- [ ] Toggle hanya tersedia untuk Standard/Pro.
- [ ] Email terkirim di environment test Resend.
- [ ] Tidak ada email jika opt-out atau push berhasil.
- [ ] Kegagalan Resend tercatat tanpa error ke pengguna.
- [ ] Free tidak bisa mengaktifkan lewat request langsung.

---

### TASK-021 — Halaman pricing publik
`Fase 5` · Dependensi: 003, 004 · Ukuran: M

**Tujuan:** Pengguna memahami perbedaan tier dan bisa memilih paket tanpa kebingungan.

**Scope**
- Route `/pricing`; tiga kartu Free, Standard, Pro dari database.
- Sorot Standard sebagai pilihan utama; tanpa klaim palsu.
- Perbandingan fitur, FAQ singkat, dan CTA.
- CTA menyesuaikan status: belum login → register; Free → checkout; sudah berbayar → billing.

**Spesifikasi kunci**
- Harga diformat dari integer; tidak ada harga hardcode ganda.
- Copy spesifik: batas habit/task, reminder, statistik, ekspor, tema.
- Harga dan fitur placeholder dapat diubah lewat seed tanpa mengubah komponen.
- Mobile-first; kartu bisa dibaca tanpa hover.

**Verifikasi**
- [ ] Tiga plan tampil dari database.
- [ ] CTA benar untuk anonim, Free, dan pelanggan aktif.
- [ ] Tidak ada testimoni/logo/angka fiktif.
- [ ] Layout 360 px dan 1440 px rapi.
- [ ] Metadata halaman benar.

---

### TASK-022 — Paywall dan enforcement tier terpusat
`Fase 5` · Dependensi: 003, 011, 015, 021 · Ukuran: M

**Tujuan:** Semua batas tier ditegakkan konsisten di server dan dijelaskan di UI.

**Scope**
- Gunakan `lib/entitlements.ts` sebagai satu-satunya sumber keputusan plan.
- Guard pembuatan habit/task, halaman statistik, ekspor, tema, dan email.
- Komponen paywall/limit banner dengan copy PRD.
- Tampilkan sisa kuota Free di tempat relevan.
- Setelah downgrade/expiry, data tetap ada tetapi fitur terkunci.

**Spesifikasi kunci**
- Pemeriksaan dilakukan di server action/route, bukan hanya tombol disabled.
- Jangan menghapus data saat downgrade; hanya membatasi fitur/penambahan.
- CTA upgrade tidak muncul di every page; hanya saat limit atau fitur terkait.
- Free dapat melihat preview statistik terkunci, bukan halaman error.

**Verifikasi**
- [ ] Request langsung untuk habit ke-4 / task ke-21 ditolak.
- [ ] Free tidak bisa membuka data statistik/ekspor/tema Pro.
- [ ] Pelanggan aktif tidak melihat paywall yang salah.
- [ ] Setelah `expired`, akun berperilaku Free tanpa kehilangan data.
- [ ] Unit test untuk setiap capability.

---

### TASK-023 — Checkout Snap dan pembayaran awal
`Fase 5` · Dependensi: 021, 022, 002 · Ukuran: L

**Tujuan:** Pengguna dapat membayar bulan pertama lewat Midtrans Snap dengan aman.

**Scope**
- Route `/checkout/[planId]`: ringkasan paket, harga, dan tombol bayar.
- Server action membuat transaksi Snap (`redirect_url`) dan record `payments` status `pending`.
- Metadata berisi `user_id`, `plan_code`, `purpose=initial_subscription`.
- Sertakan objek `recurring` (`required: true`, interval 1 bulan, `start_time`) agar Snap menyimpan kartu untuk recurring; pastikan One Click/recurring aktif di akun Midtrans.
- Hanya tampilkan metode pembayaran yang mendukung recurring (kartu; GoPay bila aktif).
- Halaman finish/pending/failed dengan copy PRD.
- Cegah checkout ganda saat sudah punya langganan atau payment pending yang baru.

**Spesifikasi kunci**
- Server key hanya di server; panggilan Midtrans memakai Basic Auth.
- `order_id` unik dan tersimpan; jangan dibuat ulang saat retry halaman.
- Halaman finish **bukan** bukti pembayaran; status menunggu webhook.
- Copy pending: “Pembayaran sedang diproses. Fitur Premium akan aktif otomatis setelah pembayaran dikonfirmasi.”
- Copy gagal: “Pembayaran belum berhasil. Coba lagi atau pilih metode pembayaran lain.”
- Redirect URL hanya ke domain aplikasi.

**Verifikasi**
- [ ] Checkout membuat Snap redirect di sandbox.
- [ ] `payments` pending tercatat dengan order id dan amount benar.
- [ ] Pengguna anonim diarahkan login.
- [ ] Pelanggan aktif tidak bisa checkout duplikat.
- [ ] Halaman finish menampilkan pending sampai webhook masuk.
- [ ] Tidak ada server key di bundle client.
- [ ] Kartu sandbox sukses dan gagal diuji.
- [ ] Snap menerima objek recurring dan menyimpan kartu untuk subscription berikutnya.

---

### TASK-024 — Aktivasi recurring subscription Midtrans
`Fase 5` · Dependensi: 023 · Ukuran: L

**Tujuan:** Setelah pembayaran awal sukses, langganan bulanan otomatis dibuat di Midtrans.

**Scope**
- Service `subscriptions` untuk membuat, menonaktifkan, dan membaca subscription Midtrans.
- Ambil `saved_token_id` kartu dari status transaksi; ambil `account_id` GoPay bila diaktifkan.
- Buat subscription dengan interval 1 bulan, `start_time` satu bulan setelah pembayaran awal.
- `max_interval` dihilangkan/`null` agar berjalan terus sampai dinonaktifkan.
- `retry_schedule` 1 hari × 3 agar selaras dengan grace A-07.
- Simpan `gateway_subscription_id` dan `current_period_end`.
- Idempotensi: satu subscription per user; jangan menagih dua kali.

**Spesifikasi kunci**
- Pembayaran awal menutup periode berjalan; recurring pertama dimulai pada `start_time`.
- Kartu adalah jalur wajib. GoPay hanya jika aktif di akun Midtrans (A-10).
- Nama subscription ≤40 karakter dengan simbol yang diizinkan; `amount` berupa string integer; `customer_details` diisi.
- Jika pembuatan subscription gagal, tandai perlu tindakan dan tampilkan status pending ke pengguna; jangan aktifkan fitur berbayar.
- Jangan menyimpan token kartu di database; simpan hanya ID subscription Midtrans.
- Semua panggilan Midtrans hanya dari server dengan timeout dan error terklasifikasi.

**Verifikasi**
- [ ] Kartu sandbox: pembayaran awal sukses → subscription `active` di Midtrans.
- [ ] Transaksi awal mengembalikan `saved_token_id`; tidak ada token kartu yang disimpan di database.
- [ ] Tidak ada charge kedua saat aktivasi.
- [ ] `current_period_end` sama dengan `start_time` recurring pertama.
- [ ] Retry schedule terlihat di Midtrans.
- [ ] Pemanggilan ulang tidak membuat subscription duplikat.
- [ ] Kegagalan API dicatat dan tidak mengaktifkan plan.
- [ ] GoPay diuji hanya jika fitur aktif; jika tidak, tidak ditawarkan.

---

### TASK-025 — Webhook Midtrans dan state machine
`Fase 5` · Dependensi: 024 · Ukuran: L

**Tujuan:** Status pembayaran dan langganan selalu sinkron, tahan retry, dan tidak bisa dipalsukan.

**Scope**
- Route `/api/webhooks/midtrans` untuk notifikasi transaksi dan recurring.
- Verifikasi `signature_key` notifikasi transaksi: SHA512(`order_id + status_code + gross_amount + server_key`).
- Verifikasi notifikasi recurring dengan membaca subscription dari Core API; payload mentah tidak dipercaya.
- Simpan semua event di `webhook_events` dengan `event_key` unik.
- Proses idempotent: payment paid/pending/failed/expired/refunded, subscription active/past_due/canceled/expired.
- Pembayaran awal sukses memicu aktivasi recurring (TASK-024).
- Respons cepat 200 setelah event tersimpan; 401 untuk signature salah; 5xx hanya jika proses perlu retry.

**Spesifikasi kunci**
- Bandingkan signature dengan timing-safe compare.
- Event key transaksi: `transaction_id + transaction_status`; recurring: `subscription_id + current_interval + status`.
- Jangan memperbarui plan berdasarkan halaman finish atau query string.
- `subscription.charge` sukses memperpanjang `current_period_end` memakai `next_execution_at`.
- Charge gagal → `past_due`; setelah retry habis/inactive → `expired` (A-07).
- Refund manual di Midtrans → `payments.refunded`; akses mengikuti status subscription.
- Log terstruktur tanpa server key/token.

**Verifikasi**
- [ ] Signature valid diterima; signature salah 401 dan tidak mengubah data.
- [ ] Event duplikat tidak mengubah state dua kali.
- [ ] Notifikasi transaksi palsu untuk order yang tidak ada ditolak.
- [ ] Recurring palsu untuk subscription yang tidak ada ditolak.
- [ ] Pembayaran awal sukses mengaktifkan plan.
- [ ] Charge sukses memperpanjang periode.
- [ ] Charge gagal → `past_due`; inactive → `expired`.
- [ ] Fixture transaksi dan recurring tersimpan di `webhook_events`.

---

### TASK-026 — Customer portal dan billing
`Fase 5` · Dependensi: 024, 025 · Ukuran: L

**Tujuan:** Pengguna dapat melihat status langganan, riwayat pembayaran, membatalkan, dan mengganti paket.

**Scope**
- Route `/billing`: plan aktif, status, tanggal perpanjangan, payment method ringkas.
- Riwayat pembayaran dengan status dan receipt printable.
- Batalkan langganan dengan konfirmasi; akses tetap sampai `current_period_end`.
- Ganti paket sesuai A-06 dengan peringatan no-prorata.
- Empty state untuk Free; CTA ke pricing.
- Tautan prioritas support untuk Pro.

**Spesifikasi kunci**
- Cancel memanggil disable subscription Midtrans dan menandai `canceled`; tidak menghapus periode aktif.
- Ganti paket: checkout paket baru; setelah pembayaran baru sukses, nonaktifkan langganan lama. Tampilkan konsekuensi biaya dengan jelas.
- Jangan menampilkan tombol ganti paket jika ada payment pending.
- Receipt memuat nomor order, tanggal, plan, jumlah, status; bukan invoice pajak (A-13).
- Hanya data user sendiri; admin tidak memakai halaman ini.

**Verifikasi**
- [ ] Status dan tanggal sesuai database/Midtrans.
- [ ] Cancel menghentikan perpanjangan dan tetap memberi akses sampai akhir periode.
- [ ] Ganti paket tidak meninggalkan dua langganan aktif.
- [ ] Receipt bisa dicetak dan datanya benar.
- [ ] Free melihat empty state, bukan error.
- [ ] Tidak ada kebocoran data user lain.

---

### TASK-027 — Rekonsiliasi dan penanganan gagal bayar
`Fase 5` · Dependensi: 025 · Ukuran: M

**Tujuan:** Webhook yang terlewat atau gagal tidak membuat status langganan permanen salah.

**Scope**
- Job harian Supabase Cron untuk menyinkronkan subscription non-terminal dengan Midtrans.
- Cek payment pending lebih dari 24 jam lewat Get Transaction API.
- Terapkan transisi `past_due` → `expired` setelah grace A-07.
- Tandai anomali agar terlihat admin; log hasil job.
- Idempotensi dan batas request.

**Spesifikasi kunci**
- Job memakai service role dan `CRON_SECRET`.
- Jangan menimpa status yang lebih baru dari Midtrans dengan data lokal lama.
- Jika Midtrans tidak bisa dihubungi, jangan ubah state; catat dan coba lagi besok.
- Payment yang sudah paid tidak diubah menjadi failed oleh job.

**Verifikasi**
- [ ] Mock Midtrans: status lokal disinkronkan benar.
- [ ] Payment pending 24 jam diselesaikan/ditandai sesuai status gateway.
- [ ] Grace berakhir → `expired` dan user turun ke Free.
- [ ] Kegagalan API tidak mengubah data.
- [ ] Job idempotent saat dijalankan dua kali.
- [ ] Anomali muncul di admin (TASK-029).

---

### TASK-028 — Guard dan layout admin
`Fase 6` · Dependensi: 006, 008 · Ukuran: S

**Tujuan:** Area admin hanya bisa diakses role admin dan tidak terindeks mesin pencari.

**Scope**
- Layout `/admin` dengan navigasi Pengguna, Langganan, Transaksi, Metrik.
- `requireAdmin()` di layout dan setiap route/server action admin.
- Halaman 403/404 yang aman.
- `noindex` dan tidak ada tautan dari UI pengguna biasa.
- Akses data memakai service role hanya di server.

**Spesifikasi kunci**
- Role dibaca dari database, bukan email hardcode.
- Jangan mengandalkan middleware saja; cek di server component/action.
- Service role client diberi `import 'server-only'`.
- Tidak ada aksi tulis di MVP (A-11).

**Verifikasi**
- [ ] User biasa mendapat 403 di semua route admin.
- [ ] Admin bisa membuka dashboard.
- [ ] Tidak ada service key di client.
- [ ] Halaman admin `noindex`.
- [ ] Tidak ada link admin di navigasi user.

---

### TASK-029 — Admin pengguna, langganan, dan transaksi
`Fase 6` · Dependensi: 028, 002 · Ukuran: L

**Tujuan:** Admin bisa mengaudit pengguna dan status pembayaran tanpa mengubah kode.

**Scope**
- Tabel pengguna: email, nama, role, tanggal daftar, plan aktif, status langganan, jumlah habit/task.
- Tabel langganan: user, plan, status, periode, gateway ID, tanggal dibuat.
- Tabel transaksi: order, user, jumlah, status, tanggal, link receipt internal.
- Pencarian, filter status/plan, dan pagination server-side.
- Detail ringkas per pengguna (read-only).

**Spesifikasi kunci**
- Query hanya kolom yang diperlukan; jangan menampilkan token/payload sensitif.
- Pagination minimal 25 baris; jangan memuat semua user ke client.
- Format tanggal konsisten `Asia/Jakarta` untuk admin, dengan label zona waktu.
- Data pembayaran dan langganan read-only.

**Verifikasi**
- [ ] Pencarian/filter/pagination bekerja.
- [ ] Join plan/status benar untuk user tanpa langganan.
- [ ] Data sensitif tidak tampil.
- [ ] Non-admin tidak bisa memanggil API data admin.
- [ ] Tabel responsive (scroll horizontal terkontrol) dan bisa dioperasikan keyboard.

---

### TASK-030 — Metrik admin dan kesehatan produk
`Fase 6` · Dependensi: 029 · Ukuran: L

**Tujuan:** Admin dapat memantau KPI inti MVP dan kesehatan operasional dari data aplikasi.

**Scope**
- Kartu utama: total user, user baru 30 hari, aktivasi (≥1 habit), retensi D1/D7/D30, konversi berbayar, MRR, ARPU.
- Langganan: aktif per plan, churn 30 hari per plan, failed payment rate.
- Produk: rata-rata habit aktif per user, rasio task selesai, median waktu signup → habit pertama.
- Operasional: webhook failure rate, reminder sent/failed, reminder action rate.
- Definisi metrik ditampilkan (tooltip/catatan).
- Query agregasi di server/SQL view; tanpa library chart berat.
- Tabel kecil langganan bermasalah, pembayaran gagal, dan webhook gagal terbaru.

**Spesifikasi kunci**
- MRR = jumlah harga bulanan subscription aktif Standard/Pro; tidak termasuk Free.
- ARPU = MRR / jumlah pelanggan berbayar aktif.
- Konversi = user dengan langganan aktif / total user terdaftar.
- Churn per plan = langganan canceled/expired dalam 30 hari / langganan aktif di awal periode pada plan tersebut.
- Retensi D1/D7/D30 = user yang check-in pada hari ke-1/ke-7/ke-30 setelah signup / user yang sudah melewati hari tersebut.
- Failed payment rate = payment failed / total percobaan payment dalam 30 hari.
- Webhook failure rate = event gagal / total event 30 hari.
- Reminder action rate = check-in dalam 60 menit setelah reminder terkirim / reminder terkirim; proksi tanpa click tracking.
- Waktu ke habit pertama memakai median, bukan rata-rata yang mudah terdistorsi.

**Verifikasi**
- [ ] Angka cocok dengan fixture seed.
- [ ] Definisi terlihat di UI.
- [ ] Query tidak memuat seluruh tabel ke aplikasi.
- [ ] Zona waktu periode 30 hari konsisten.
- [ ] Metrik per plan, retensi, reminder, dan webhook tampil.
- [ ] ARPU dan D30 konsisten dengan definisi.
- [ ] Non-admin tidak bisa mengakses.

---

### TASK-031 — Statistik dasar dan lanjutan
`Fase 7` · Dependensi: 013, 022 · Ukuran: L

**Tujuan:** Pengguna melihat konsistensi tanpa harus menghitung manual.

**Scope**
- Route `/app/stats`.
- Standard: completion rate 7/30 hari, streak saat ini per habit, bar sederhana.
- Pro: tren 90 hari, completion rate per habit, best streak, pola per hari dalam seminggu.
- Free: preview terkunci + CTA upgrade, bukan halaman error.
- Empty state untuk data kurang dari satu hari.

**Spesifikasi kunci**
- Chart memakai CSS/SVG sederhana; tanpa library berat dan tanpa heatmap.
- Semua angka dihitung dari `habit_logs` + jadwal, bukan nilai tersimpan.
- Chart punya label teks/aria; warna bukan satu-satunya pembeda.
- Data discope ke user dan zona waktunya.
- Query agregasi, bukan loop N+1 per habit.

**Verifikasi**
- [ ] Standard melihat data 7/30 hari; Pro melihat 90 hari dan pola hari.
- [ ] Free melihat preview terkunci.
- [ ] Angka cocok dengan fixture log.
- [ ] Empty state dan error state tersedia.
- [ ] Chart terbaca screen reader dan responsive.
- [ ] Tidak ada heatmap atau fitur future phase.

---

### TASK-032 — Ekspor CSV untuk Pro
`Fase 7` · Dependensi: 022, 031 · Ukuran: M

**Tujuan:** Pelanggan Pro dapat membawa data mereka keluar.

**Scope**
- Route server `/api/export` dengan pilihan dataset: habit, task, log check-in.
- File CSV UTF-8 dengan BOM agar terbaca Excel.
- Nama file jelas dan berisi tanggal.
- Gating Pro di server; Free mendapat 403 + pesan upgrade.

**Spesifikasi kunci**
- Escape kutip, koma, newline; cegah CSV formula injection (`=`, `+`, `-`, `@` di awal sel).
- Hanya data milik user; jangan mengekspor token/payment.
- Rate/abuse: tolak ekspor bersamaan berulang; tidak perlu antrean.
- Kolom habit: nama, frekuensi, reminder, status, streak saat ini.
- Kolom log: tanggal, habit, status selesai.
- Kolom task: judul, prioritas, due, status, completed_at.

**Verifikasi**
- [ ] Pro mengunduh CSV yang terbuka benar di Excel.
- [ ] Free tidak bisa mengakses route langsung.
- [ ] Data user lain tidak ikut.
- [ ] Karakter khusus dan formula di-escape.
- [ ] File kosong tetap menghasilkan header yang valid.

---

### TASK-033 — Tema premium gelap untuk Pro
`Fase 7` · Dependensi: 004, 022 · Ukuran: M

**Tujuan:** Pro mendapat tema premium yang konsisten tanpa merusak keterbacaan.

**Scope**
- Token tema gelap selaras Clean Product; bukan inversi otomatis.
- Preferensi `users.theme` (`light`/`dark`), diterapkan server-side.
- Toggle di settings; hanya Pro.
- Free melihat opsi terkunci.
- Downgrade/expiry memaksa tampilan terang tanpa menghapus preferensi.

**Spesifikasi kunci**
- Kontras teks AA; focus ring tetap terlihat.
- Tidak ada flash tema salah saat load.
- Chart, badge, dan state error tetap terbaca.
- Gating diperiksa di server action, bukan hanya UI.

**Verifikasi**
- [ ] Pro mengaktifkan tema dan persist setelah login ulang.
- [ ] Free tidak bisa mengaktifkan lewat request langsung.
- [ ] Downgrade menampilkan tema terang.
- [ ] Semua halaman utama lolos cek kontras.
- [ ] Tidak ada flash of wrong theme.

---

### TASK-034 — Landing page
`Fase 8` · Dependensi: 004, 021 · Ukuran: L

**Tujuan:** Menjelaskan nilai HabitFlow secara spesifik dan mengarahkan ke pendaftaran.

**Scope**
- Hero, cara kerja 3 langkah, fitur habit + task + reminder, ringkasan pricing, FAQ, CTA.
- Header/footer dengan tautan pricing, login, register.
- Preview UI asli (komponen), bukan mockup palsu.
- Copy Indonesia yang konkret, tanpa klaim bombastis.

**Spesifikasi kunci**
- CTA utama: “Mulai gratis”; tanpa “tanpa kartu kredit” jika tidak dijelaskan.
- Tidak ada testimoni, logo perusahaan, atau angka pengguna fiktif.
- Pricing mengambil data dari database; sorot Standard.
- Mobile-first; CTA terlihat tanpa scroll berlebihan.
- Halaman legal (A-16) ditautkan hanya jika sudah tersedia.

**Verifikasi**
- [ ] Semua CTA menuju route yang benar.
- [ ] Pricing konsisten dengan `/pricing`.
- [ ] Tampil rapi di 360/768/1440 px.
- [ ] Tidak ada klaim/angka palsu.
- [ ] Tidak ada layout shift besar saat load.
- [ ] Target mobile LCP <2,5 dtk, CLS <0,1, INP <200 ms.
- [ ] Gambar/font dioptimalkan; tanpa library berat di landing.

---

### TASK-035 — SEO dan metadata
`Fase 8` · Dependensi: 034 · Ukuran: S

**Tujuan:** Halaman publik mudah ditemukan dan dibagikan dengan benar.

**Scope**
- Metadata per halaman, canonical, Open Graph, Twitter card.
- OG image statis/dinamis yang menampilkan brand dan value proposition.
- `sitemap.xml`, `robots.txt`, `lang="id-ID"`.
- JSON-LD SoftwareApplication di landing.
- `noindex` untuk `/app`, `/admin`, `/billing`, `/checkout`, dan auth.

**Spesifikasi kunci**
- URL canonical memakai `NEXT_PUBLIC_APP_URL`.
- Jangan mengindeks halaman dengan data pribadi.
- Metadata tidak menjanjikan fitur yang belum ada.
- Sitemap hanya berisi halaman publik yang valid.

**Verifikasi**
- [ ] Metadata/OG tampil benar di preview.
- [ ] Sitemap dan robots dapat diakses.
- [ ] Halaman privat `noindex`.
- [ ] Tidak ada canonical ganda.
- [ ] Lighthouse SEO halaman publik ≥90.

---

### TASK-036 — Empty, error, loading state, dan audit copy
`Fase 8` · Dependensi: fitur inti (014, 016, 019, 023, 026) · Ukuran: M

**Tujuan:** Semua kondisi yang disebut PRD punya tampilan dan copy yang konsisten.

**Scope**
- Audit seluruh halaman untuk empty/loading/error/success state.
- Terapkan copy PRD untuk kondisi penting.
- 404 dan 500 yang aman; error boundary.
- Toast dan inline error yang konsisten.
- Jangan menampilkan stack trace, kode SQL, atau secret.

**Copy wajib**
- Empty habit: “Belum ada habit. Buat satu kebiasaan kecil yang bisa Anda lakukan hari ini.”
- Limit habit: “Kamu sudah memakai 3 dari 3 habit aktif. Upgrade ke Standard untuk membuat habit tanpa batas.”
- Payment pending: “Pembayaran sedang diproses. Fitur Premium akan aktif otomatis setelah pembayaran dikonfirmasi.”
- Payment gagal: “Pembayaran belum berhasil. Coba lagi atau pilih metode pembayaran lain.”
- Notifikasi ditolak: “Aktifkan notifikasi agar pengingat habit kamu muncul tepat waktu.”

**Spesifikasi kunci**
- Loading memakai skeleton/spinner yang tidak menggeser layout.
- Error form dekat field; error halaman punya aksi retry/kembali.
- Copy memakai “kamu” untuk pengguna dan konsisten di seluruh produk.
- Tidak ada emoji di UI.

**Verifikasi**
- [ ] Setiap kondisi di atas bisa direproduksi dan tampil benar.
- [ ] Tidak ada teks error mentah dari database/gateway.
- [ ] Retry bekerja pada error yang bisa dipulihkan.
- [ ] 404/500 tidak membocorkan detail internal.
- [ ] Audit copy selesai dan tidak ada placeholder “Lorem ipsum”.

---

### TASK-037 — Responsive dan aksesibilitas
`Fase 8` · Dependensi: 036 · Ukuran: M

**Tujuan:** Aplikasi nyaman dipakai di ponsel dan bisa dioperasikan tanpa mouse.

**Scope**
- Uji 360 px, 768 px, dan 1440 px untuk route utama.
- Keyboard navigation, focus order, focus trap dialog.
- Label form, `aria-live` untuk status, nama tombol ikon.
- Kontras AA; target sentuh 44 px; `prefers-reduced-motion`.
- Perbaiki temuan axe kritis.

**Spesifikasi kunci**
- Tidak ada horizontal scroll di 360 px.
- Navigasi bawah tidak menutupi konten (safe area).
- Chart/status tidak hanya mengandalkan warna.
- Modal/dialog mengembalikan fokus ke pemicu.
- Form bisa diselesaikan dengan keyboard saja.

**Verifikasi**
- [ ] Matriks 360/768/1440 lolos untuk landing, today, habits, tasks, stats, billing, admin.
- [ ] axe tidak menemukan pelanggaran kritis di halaman utama.
- [ ] Alur check-in, buat habit, task, checkout bisa keyboard-only.
- [ ] Kontras teks AA.
- [ ] `prefers-reduced-motion` dihormati.

---

### TASK-038 — Unit, integration, dan test RLS
`Fase 9` · Dependensi: 009, 022, 024, 025, 027, 030 · Ukuran: L

**Tujuan:** Logika berisiko tinggi terlindungi sebelum rilis.

**Scope**
- Unit test: entitlement/limit, streak/timezone, state machine webhook, plan change/cancel, CSV escaping, format harga.
- Integration test dengan Supabase lokal: RLS antar-user, unique check-in, enqueue reminder, akses admin.
- Contract test Midtrans memakai fixture, tanpa network nyata.
- Test webhook signature valid/invalid/duplikat.

**Spesifikasi kunci**
- Test deterministik; waktu dibekukan (`vi.setSystemTime`) bila perlu.
- Tidak ada test yang bergantung pada data production.
- Seed test minimal dan idempoten.
- Jangan mengejar coverage global; fokus pada jalur uang, akses, dan data.

**Verifikasi**
- [ ] Semua test lolos di mesin bersih.
- [ ] RLS terbukti menolak akses lintas user.
- [ ] Signature invalid/duplikat diuji.
- [ ] Timezone/streak diuji di dua zona.
- [ ] Tidak ada panggilan Midtrans/push/email nyata.
- [ ] `npm test` selesai dalam waktu wajar.

---

### TASK-039 — E2E alur kritis
`Fase 9` · Dependensi: 038, 036 · Ukuran: L

**Tujuan:** Membuktikan alur pengguna utama berjalan end-to-end.

**Scope**
- Playwright dengan seed user Free/Standard/Admin.
- Alur: register/login, onboarding, buat habit, check-in/undo, limit Free, CRUD task, paywall, checkout (route Midtrans dimock), webhook sukses → plan aktif, cancel, admin guard.
- Viewport mobile dan desktop untuk alur utama.
- Artefak screenshot/trace saat gagal.

**Spesifikasi kunci**
- Pembayaran tidak memanggil Snap/Midtrans nyata; gunakan fixture + panggil webhook lokal dengan signature valid.
- Test tidak bergantung pada urutan eksekusi.
- Waktu tunggu eksplisit, bukan sleep arbitrer.
- Jalankan terhadap database test yang di-reset.

**Verifikasi**
- [ ] Minimal 8 alur kritis lolos.
- [ ] Test bisa dijalankan berulang tanpa flake.
- [ ] Checkout sukses mengaktifkan plan dan membuka fitur.
- [ ] Cancel tetap memberi akses sampai akhir periode.
- [ ] User biasa tidak bisa membuka admin.
- [ ] Screenshot/trace tersedia saat gagal.

---

### TASK-040 — Security hardening
`Fase 9` · Dependensi: 039 · Ukuran: M

**Tujuan:** Menutup celah akses, input, secret, dan webhook sebelum production.

**Scope**
- Audit otorisasi semua Server Action/Route Handler.
- Validasi Zod di boundary; sanitasi output; cek open redirect.
- Security headers dan CSP yang kompatibel dengan Next.js/Midtrans Snap.
- Pastikan service role/server key tidak masuk client.
- Audit RLS dan dependency (`npm audit`).
- Kontrol penyalahgunaan: rate limit auth dari Supabase, dedupe checkout, idempotensi webhook.
- Cek cache header untuk halaman/data privat.

**Spesifikasi kunci**
- Webhook tidak boleh bergantung pada secret URL saja.
- Jangan menonaktifkan RLS demi kemudahan.
- `no-store` untuk data pribadi; jangan cache halaman `(app)`.
- Secret scanning pada diff sebelum rilis.
- CSP harus mengizinkan domain Snap yang diperlukan, tanpa `unsafe-eval` yang tidak perlu.

**Verifikasi**
- [ ] Tidak ada secret di source/client bundle.
- [ ] Setiap endpoint memeriksa user/role.
- [ ] RLS dan IDOR diuji.
- [ ] Signature webhook invalid ditolak.
- [ ] Header keamanan terpasang.
- [ ] `npm audit` tidak menyisakan high/critical tanpa alasan terdokumentasi.
- [ ] Halaman privat tidak ter-cache publik.

---

### TASK-041 — Deployment, observability, dan launch
`Fase 9` · Dependensi: 040 · Ukuran: L

**Tujuan:** Merilis MVP yang bisa dipantau, dipulihkan, dan diverifikasi.

**Scope**
- Project Supabase production; jalankan migrasi + seed plan; konfigurasi auth dan Google OAuth.
- Vercel production; env lengkap; domain dan SSL.
- Midtrans production: server key, Payment Notification URL, Recurring Notification URL, finish redirect.
- Supabase Cron aktif; VAPID aktif; Resend/SMTP bila dipakai.
- Vercel Analytics, log terstruktur, health check `/api/health`.
- Backup/export sebelum migrasi berisiko; documented rollback.
- Smoke test production dan checklist rilis.

**Spesifikasi kunci**
- Jangan memakai kredensial sandbox di production atau sebaliknya.
- Webhook URL harus HTTPS dan dapat diakses publik.
- Halaman legal (A-16) tersedia sebelum mengaktifkan pembayaran production.
- Rollback: redeploy versi sebelumnya + migrasi tidak merusak data (backward compatible).
- Production payment smoke test memakai nominal terkecil dan di-refund setelah verifikasi.

**Verifikasi**
- [ ] Build production sukses dan domain aktif.
- [ ] Signup → onboarding → habit → check-in berjalan.
- [ ] Reminder terjadwal terkirim dan tercatat.
- [ ] Pembayaran production sukses mengaktifkan plan; webhook tercatat.
- [ ] Cancel dan rekonsiliasi berjalan.
- [ ] Admin bisa melihat metrik.
- [ ] Health check, log, dan alert dasar berfungsi.
- [ ] Backup dan rollback terdokumentasi.
- [ ] Checklist rilis §6 selesai.

---

## 6. Release Checklist

### Fungsi
- [ ] Registrasi, login email, Google, reset password, logout.
- [ ] Onboarding selesai/lewati; preferensi tersimpan.
- [ ] Habit CRUD, aktif/nonaktif, hapus, check-in, undo, streak.
- [ ] Task CRUD, selesai/batal, due date, prioritas.
- [ ] Dashboard Today akurat menurut zona waktu.
- [ ] Reminder web push diterima; status tercatat.
- [ ] Upgrade, ganti paket, cancel, dan downgrade/expiry.
- [ ] Limit Free tidak bisa ditembus lewat request langsung.
- [ ] Admin guard, data, dan metrik.

### Pembayaran
- [ ] Sandbox: sukses, pending, gagal, expired.
- [ ] Webhook signature valid/invalid/duplikat.
- [ ] Recurring charge sukses memperpanjang periode.
- [ ] Recurring gagal → `past_due`; retry habis → `expired`.
- [ ] Cancel menghentikan renewal tetapi akses bertahan sampai periode akhir.
- [ ] Rekonsiliasi menangani webhook yang terlewat.
- [ ] Receipt dapat dicetak.

### Responsive dan aksesibilitas
- [ ] 360 px, 768 px, 1440 px untuk route utama.
- [ ] Keyboard-only untuk alur inti.
- [ ] Kontras AA, label form, focus state, target 44 px.
- [ ] axe tanpa pelanggaran kritis.
- [ ] `prefers-reduced-motion` dihormati.

### SEO dan performa
- [ ] Metadata, canonical, OG, sitemap, robots, `id-ID`.
- [ ] Halaman privat `noindex`.
- [ ] Lighthouse landing/pricing: performance, accessibility, SEO ≥90.
- [ ] Landing tidak memuat data privat atau library berat yang tidak perlu.

### Keamanan
- [ ] RLS dan otorisasi server diuji.
- [ ] Secret tidak ada di client/repository.
- [ ] Webhook terverifikasi dan idempotent.
- [ ] Input tervalidasi; open redirect ditutup.
- [ ] Dependency audit bersih dari high/critical.
- [ ] Data privat tidak ter-cache publik.

### Operasional
- [ ] Env production lengkap dan benar.
- [ ] Migrasi/seed dijalankan; backup tersedia.
- [ ] Cron reminder dan rekonsiliasi terlihat berjalan.
- [ ] Webhook URL production terdaftar di Midtrans.
- [ ] Monitoring/log/health check aktif.
- [ ] Rollback dan runbook terdokumentasi.
- [ ] Halaman legal tersedia.

---

## 7. Out of Scope MVP

Sesuai PRD §6 dan keputusan di dokumen ini:

- Aplikasi native iOS/Android; PWA hanya manifest + push, tanpa offline mode.
- Social feed, leaderboard, gamifikasi kompleks, habit bersama/komunitas.
- Integrasi kalender penuh, AI coach, template habit/task.
- Subscription tahunan, multi-currency, trial, kupon/referral, team/family plan.
- Heatmap konsistensi dan analitik lanjutan di luar A-12.
- Edit plan/harga lewat UI admin; aksi tulis admin.
- Perubahan metode pembayaran kartu secara self-service; refund otomatis.
- Invoice pajak, akuntansi, dan laporan keuangan.
- Notifikasi native, SMS, WhatsApp.
- Account deletion dan permintaan data otomatis (kebijakan privasi manual).
- Custom domain email transaksional di luar Resend/SMTP dasar.

---

## 8. Cara Mengeksekusi

Untuk setiap task, gunakan instruksi singkat berikut:

```text
Eksekusi TASK-XXX dari TASKS.md.
Baca CLAUDE.md dan PRD.md terlebih dahulu.
Kerjakan hanya scope TASK-XXX; jangan refactor kode di luar task.
Jika ada asumsi yang belum jelas, berhenti dan tanyakan.
Tulis/ubah test yang relevan, lalu jalankan:
npm run lint && npm run typecheck && npm test && npm run build
Laporkan file yang berubah, hasil verifikasi, dan risiko yang tersisa.
```

**Aturan eksekusi**
1. Selesaikan fondasi (001–005) sebelum fitur.
2. Jangan mengerjakan task yang dependensinya belum selesai.
3. Satu task = satu perubahan yang bisa diverifikasi; hindari menggabungkan beberapa task besar dalam satu langkah.
4. Perbarui dokumen ini hanya bila keputusan produk berubah; jangan mengubah acceptance criteria agar task lama terlihat selesai.
5. Kalau implementasi menemukan kontradiksi PRD, catat dan tanyakan; jangan memilih diam-diam.

