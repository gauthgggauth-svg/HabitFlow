PRD: HabitFlow — Aplikasi Habit Tracker Berlangganan



Versi: 1.0-draft

Tanggal: 23 November 2026

Pemilik produk: \[Nama Anda]

Status: Draft — menunggu pemilihan desain dan stack

Target pengguna: Individu yang ingin membangun kebiasaan rutin, mengelola tugas harian, dan menerima pengingat agar konsisten.



Aplikasi ini akan menggabungkan habit tracker, to-do list, pengingat, dan subscription berbayar. MVP difokuskan pada pembuktian bahwa pengguna dapat membuat kebiasaan, menandai progres, menerima pengingat, lalu meng-upgrade ke paket berbayar.



1\. Ringkasan Produk



HabitFlow adalah aplikasi full-stack untuk membantu pengguna membangun kebiasaan positif dan menyelesaikan tugas harian. Pengguna dapat membuat habit dengan frekuensi tertentu, menandai selesai setiap hari, melihat streak/progress, serta menerima pengingat.



Model bisnis menggunakan tiga tier:



Paket Harga indikatif Batasan utama



Free Rp0 Maksimum 3 habit aktif, to-do list maksimum 20 item, pengingat dasar

Standard Rp29.000/bulan Habit unlimited, to-do list unlimited, pengingat, statistik dasar

Pro Rp59.000/bulan Semua fitur Standard, statistik lanjutan, ekspor data, tema premium, prioritas dukungan





Harga bersifat placeholder dan perlu disesuaikan dengan target pasar serta biaya payment gateway. Midtrans mendukung recurring/subscription dengan penjadwalan otomatis melalui Snap dan Core API; metode recurring yang didukung mencakup kartu dan GoPay Tokenization.\[1]\[2]



2\. Masalah dan Peluang



Problem statement



Banyak orang ingin membangun kebiasaan rutin tetapi kehilangan konsistensi karena tidak ada pengingat yang relevan, progres yang terlihat, dan cara sederhana mengelola tugas pendukung. Aplikasi habit tracker yang ada sering memisahkan habit dan to-do list, sehingga pengguna harus memakai beberapa aplikasi sekaligus.



Peluang



HabitFlow dapat menjadi satu tempat untuk membentuk kebiasaan, mengeksekusi tugas harian, dan tetap diingatkan, dengan monetisasi subscription yang jelas. Free tier berfungsi sebagai akuisisi pengguna, sedangkan Standard dan Pro membatasi kapasitas serta fitur bernilai tambah.



3\. Tujuan dan Metrik



Tujuan bisnis



\- Mengubah pengguna free menjadi pelanggan Standard atau Pro.

\- Menghasilkan recurring revenue bulanan yang dapat diprediksi.

\- Menjaga churn subscription tetap rendah melalui pengingat dan nilai harian yang nyata.



Tujuan pengguna



\- Membuat dan menjalankan habit dengan konsisten.

\- Mendapatkan pengingat tepat waktu.

\- Melihat kemajuan tanpa harus membuka aplikasi terlalu sering.

\- Mengelola to-do list tanpa berpindah aplikasi.



KPI utama



Metrik Target MVP 90 hari



Aktivasi: membuat minimal 1 habit 60% pengguna baru

Retensi habit check-in harian D7 30%

Konversi free ke berbayar 3–5%

Trial-to-paid conversion, jika trial digunakan 15%

Pembatalan subscription dalam 30 hari pertama Di bawah 15%

Pengingat yang dibuka atau ditindaklanjuti 25%





Indikator pendukung



\- Jumlah habit aktif per pengguna.

\- Rasio to-do list yang diselesaikan.

\- Waktu dari sign-up hingga habit pertama dibuat.

\- Tingkat kegagalan webhook pembayaran.

\- Churn bulanan per tier.



4\. Persona Pengguna



Persona 1 — Rina, Pembentuk Kebiasaan



\- Usia 22–35, mahasiswa atau pekerja muda.

\- Ingin konsisten olahraga, membaca, belajar, atau tidur lebih teratur.

\- Butuh pengingat dan visual progres sederhana.

\- Kemungkinan memakai Free, lalu upgrade jika habit melebihi batas.



Persona 2 — Dimas, Profesional Sibuk



\- Usia 25–40, pekerja kantoran atau freelancer.

\- Ingin menggabungkan rutinitas pribadi dan tugas kerja harian.

\- Membutuhkan to-do list, pengingat, dan tampilan hari ini yang padat.

\- Potensi pelanggan Standard atau Pro.



Persona 3 — Admin/Pemilik Produk



\- Mengelola pengguna, paket, transaksi, dan status langganan.

\- Perlu melihat metrik konversi, MRR, churn, dan kegagalan pembayaran.

\- Tidak perlu mengubah kode untuk mengubah harga atau copy plan, idealnya.



5\. User Journey



Journey utama



1\. Pengguna membuka landing page dan memilih Mulai gratis.

2\. Mendaftar dengan email/password atau Google.

3\. Menjawab onboarding singkat: tujuan habit dan jam pengingat preferensi.

4\. Membuat habit pertama, misalnya “Olahraga 20 menit”, frekuensi harian, jam 06.30.

5\. Membuat to-do list pendukung, misalnya “Siapkan sepatu”.

6\. Menerima pengingat pada waktu yang dipilih.

7\. Menandai habit selesai; streak dan progress diperbarui.

8\. Saat mencapai batas Free, pengguna melihat paywall dan memilih Standard/Pro.

9\. Menyelesaikan pembayaran melalui payment gateway.

10\. Webhook memperbarui status subscription dan membuka fitur sesuai tier.



Kondisi penting



\- Empty state: “Belum ada habit. Buat satu kebiasaan kecil yang bisa Anda lakukan hari ini.”

\- Limit Free: “Kamu sudah memakai 3 dari 3 habit aktif. Upgrade ke Standard untuk membuat habit tanpa batas.”

\- Pembayaran pending: “Pembayaran sedang diproses. Fitur Premium akan aktif otomatis setelah pembayaran dikonfirmasi.”

\- Pembayaran gagal: “Pembayaran belum berhasil. Coba lagi atau pilih metode pembayaran lain.”

\- Pengingat tidak diizinkan: “Aktifkan notifikasi agar pengingat habit kamu muncul tepat waktu.”



6\. Ruang Lingkup MVP



In Scope MVP



\- Registrasi dan login email/password serta Google OAuth.

\- Onboarding singkat.

\- CRUD habit: nama, deskripsi, frekuensi, waktu pengingat, warna/ikon dari icon library, status aktif.

\- Check-in harian habit dan streak sederhana.

\- To-do list: tambah, edit, selesai, hapus, due date opsional.

\- Dashboard “Hari ini”: habit yang harus dilakukan dan tugas aktif.

\- Notifikasi pengingat berbasis web push dan email opsional.

\- Halaman pricing dengan Free, Standard, Pro.

\- Payment gateway untuk subscription bulanan.

\- Webhook pembayaran dan sinkronisasi status langganan.

\- Pembatasan fitur berdasarkan tier.

\- Customer portal: lihat langganan, ubah paket, batalkan langganan.

\- Admin dashboard dasar: pengguna, subscription, transaksi, metrik.



Out of Scope MVP



\- Aplikasi native iOS/Android.

\- Social feed, gamifikasi kompleks, leaderboard.

\- Integrasi kalender penuh.

\- Habit bersama/komunitas.

\- AI coach atau rekomendasi habit otomatis.

\- Pembayaran tahunan pada rilis pertama, kecuali mudah didukung gateway.

\- Multi-currency.



Future Phase



\- Mobile app dengan push notification native.

\- Statistik lanjutan dan heatmap konsistensi.

\- Template habit dan to-do list.

\- Integrasi Google Calendar.

\- AI assistant untuk menyusun rutinitas.

\- Referral dan kupon.

\- Team/family plan.



7\. Information Architecture



Struktur halaman



/ Landing page  

/login Login  

/register Registrasi  

/onboarding Onboarding awal  

/app Dashboard hari ini  

/app/habits Daftar habit  

/app/habits/new Buat habit  

/app/habits/\[id] Detail dan edit habit  

/app/tasks To-do list  

/app/stats Statistik dasar  

/app/settings Profil, notifikasi, langganan  

/pricing Halaman paket  

/checkout/\[planId] Checkout subscription  

/billing Status langganan dan invoice  

/admin Admin dashboard



Entitas data utama



Entitas Field penting Relasi



users id, email, name, role, timezone, notification\_permission Memiliki banyak habits, tasks, subscriptions

habits id, user\_id, title, description, frequency, reminder\_time, color, icon, is\_active Memiliki banyak habit\_logs

habit\_logs id, habit\_id, user\_id, completed\_at, scheduled\_date Milik habit

tasks id, user\_id, title, notes, due\_at, is\_completed, priority Milik user

plans id, code, name, price, interval, limits, features Memiliki banyak subscriptions

subscriptions id, user\_id, plan\_id, status, current\_period\_end, gateway\_subscription\_id Milik user dan plan

payments id, user\_id, subscription\_id, gateway\_transaction\_id, amount, status, paid\_at Milik user/subscription

reminders id, habit\_id, user\_id, scheduled\_at, channel, status Milik habit/user

webhook\_events id, provider, event\_type, payload, processed\_at, status Audit pembayaran





8\. Prototype Design Direction



Prinsip anti-AI-slop



\- Menggunakan icon library seperti Lucide atau Phosphor, bukan emoji.

\- Tidak memakai gradien ungu-biru generik sebagai identitas visual.

\- Fokus pada hierarchy: “Apa yang harus saya lakukan hari ini?” selalu paling menonjol.

\- Komponen reusable: habit card, task row, streak indicator, plan card, reminder setting, empty state.

\- Mobile-first dengan target sentuh minimal 44 px.

\- Warna dan copywriting yang spesifik, bukan klaim bombastis.



Opsi A — Clean Product



Aspek Detail



Gaya Netral, tenang, fokus produktivitas

Palet Ink #111827, paper #FAFAF9, muted gray #6B7280, aksen hijau lumut #3F6212, warning amber #B45309

Tipografi Inter atau Geist untuk UI; JetBrains Mono untuk angka streak

Komponen Card putih, border tipis, radius 12–16 px, shadow sangat halus

Mobile Tab bawah: Today, Habits, Tasks, Profile

Desktop Sidebar kiri, konten tengah maksimum 960 px

Copy “3 habit selesai hari ini. 1 tugas masih menunggu.”

Kelebihan Mudah dipakai harian, terasa kredibel, cocok untuk SaaS

Risiko Bisa terlihat terlalu polos jika tidak ada detail visual yang kuat





Struktur dashboard: header dengan tanggal dan streak, section “Hari ini”, daftar habit, section “Tugas aktif”, CTA upgrade hanya muncul saat relevan.



Opsi B — Editorial Modern



Aspek Detail



Gaya Tenang, personal, seperti jurnal digital

Palet Warm ivory #F7F3EC, charcoal #1F1D1B, terracotta #B4552D, sage #5F7150

Tipografi Fraunces untuk heading, Inter untuk body

Komponen Card lembut, garis pemisah tipis, ilustrasi minimal, progress berbasis garis

Mobile Scroll vertikal dengan section besar dan CTA sticky

Desktop Grid dua kolom: habit di kiri, refleksi/statistik di kanan

Copy “Hari ke-12 menjaga kebiasaan tidur sebelum jam 23.00.”

Kelebihan Terasa manusiawi dan berbeda dari habit tracker generik

Risiko Butuh disiplin desain agar tidak terlihat seperti blog





Struktur dashboard: greeting personal, ringkasan konsistensi, habit cards bergaya jurnal, to-do list sebagai “Rencana hari ini”.



Opsi C — Bold Conversion



Aspek Detail



Gaya Energik, tegas, berorientasi aksi

Palet Off-black #0B0F14, off-white #F4F4F0, lime #B7F04A, coral #FF5C39

Tipografi Space Grotesk untuk heading, Inter untuk body

Komponen Kontras tinggi, CTA besar, progress bar tegas, badge tier

Mobile CTA upgrade sticky, quick check-in besar

Desktop Hero dengan social proof, pricing comparison, dashboard preview

Copy “Bangun momentum. Jangan biarkan hari ini berlalu tanpa satu langkah.”

Kelebihan Kuat untuk akuisisi dan konversi subscription

Risiko Dapat terasa agresif untuk penggunaan harian jika berlebihan





Struktur landing: headline masalah, demo check-in, pricing, FAQ, CTA “Mulai gratis, tanpa kartu kredit”.



Rekomendasi



Opsi A — Clean Product paling cocok untuk MVP karena mendukung penggunaan harian, mudah dikembangkan, dan tetap profesional untuk halaman pricing/subscription. Opsi B dapat dipakai sebagai arah branding jangka panjang; Opsi C cocok untuk landing page akuisisi.



9\. Stack Teknologi



Opsi 1 — Next.js + Supabase + Midtrans



Komponen Pilihan



Frontend Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui

Backend Next.js Route Handlers / Server Actions

Database PostgreSQL via Supabase

Auth Supabase Auth, email/password dan Google OAuth

Storage Supabase Storage

Email Resend

Notification Web Push via VAPID; email sebagai fallback

Payment Midtrans Subscription/Recurring

Hosting Vercel

Analytics PostHog atau Vercel Analytics

AI Opsional, OpenAI API





Midtrans mendukung subscription recurring dengan interval fleksibel dan auto-charge; API-nya mendukung pembuatan, enable, dan update subscription.\[1]\[2]\[3]



Estimasi biaya awal: dapat mulai dari Rp0 dengan Vercel Hobby dan Supabase Free; Supabase Free mencakup 500 MB database. Biaya gateway dan domain tetap perlu diperhitungkan.\[4]\[5]



Kelebihan: cepat dikembangkan, ekosistem kuat, cocok untuk full-stack TypeScript.

Kekurangan: vendor lock-in sedang pada Supabase; perlu disiplin pada RLS dan webhook security.

Rekomendasi: paling cocok untuk MVP.



Opsi 2 — Next.js + Neon + Prisma + Xendit



Komponen Pilihan



Frontend Next.js, TypeScript, Tailwind CSS

Backend Next.js API Routes

Database PostgreSQL via Neon

ORM Prisma

Auth Auth.js atau Clerk

Storage Cloudflare R2 atau Supabase Storage

Email Resend

Notification Web Push

Payment Xendit Subscriptions

Hosting Vercel

Analytics PostHog





Xendit menyediakan subscription dengan penjadwalan otomatis, retry pembayaran gagal, payment link pada kegagalan, dan penonaktifan plan bila seluruh percobaan gagal. Aktivasi recurring dapat memerlukan permintaan dan verifikasi dari Xendit.\[6]\[7]\[8]



Kelebihan: kontrol lebih besar atas data dan ORM, database serverless hemat biaya.

Kekurangan: lebih banyak konfigurasi awal dibanding Supabase.

Rekomendasi: cocok bila ingin arsitektur lebih portable.



Opsi 3 — Laravel + MySQL + Midtrans



Komponen Pilihan



Frontend Blade + Alpine.js, atau Inertia + React

Backend Laravel 11/12

Database MySQL

Auth Laravel Breeze/Fortify

Storage S3-compatible

Email Laravel Mail + SMTP/Resend

Notification Laravel Notifications + Web Push

Payment Midtrans

Hosting VPS atau Laravel Cloud

Analytics Plausible atau PostHog





Estimasi biaya awal: VPS mulai sekitar Rp50.000–Rp150.000/bulan, tergantung provider dan spesifikasi; tidak sepenuhnya gratis bila membutuhkan reliability production.



Kelebihan: ekosistem backend matang, cocok bila Anda sudah familiar PHP.

Kekurangan: deployment dan DevOps lebih banyak dibanding Vercel + Supabase.

Rekomendasi: pilih bila tim sudah kuat di PHP/Laravel.



10\. Task Breakdown



Task breakdown final akan dibuat setelah Anda memilih opsi desain dan opsi stack. Berikut contoh task awal yang akan menjadi fondasi:



\## TASK-001 — Inisialisasi Proyek dan Environment  

&#x20; 

\### Tujuan  

Menyiapkan repository, konfigurasi dasar, environment variables, dan struktur folder yang bersih.  

&#x20; 

\### Scope  

\- Inisialisasi project sesuai stack terpilih  

\- Konfigurasi TypeScript, linting, formatting, dan Git  

\- Struktur folder: UI, business logic, data access, integrasi  

\- Environment variables untuk database, auth, payment, email, dan push notification  

\- README dasar  

&#x20; 

\### Dependensi  

\- Tidak ada  

&#x20; 

\### Spesifikasi teknis  

\- Pisahkan folder `app/`, `components/`, `lib/`, `services/`, `integrations/`, `types/`  

\- Simpan secret hanya di environment variables  

\- Jangan commit `.env`  

\- Tambahkan validasi environment variable saat startup  

&#x20; 

\### Data / API  

\- Tidak ada endpoint bisnis pada task ini  

&#x20; 

\### UI/UX  

\- Halaman dasar dan layout aplikasi  

&#x20; 

\### Validasi  

\- Build berhasil  

\- Environment variable wajib terdeteksi  

&#x20; 

\### Error handling  

\- Tampilkan error konfigurasi yang aman tanpa membocorkan secret  

&#x20; 

\### Acceptance Criteria  

\- \[ ] Project dapat dijalankan lokal  

\- \[ ] Build production berhasil  

\- \[ ] Secret tidak ada di source code  

\- \[ ] Struktur folder sesuai standar  

&#x20; 

\### Definition of Done  

\- \[ ] Kode modular  

\- \[ ] Responsive  

\- \[ ] Aksesibel  

\- \[ ] Lolos build  

\- \[ ] Dokumentasi diperbarui



Task berikutnya akan mencakup database schema, auth, habit CRUD, to-do list, reminder, pricing, payment gateway, webhook, entitlement/feature gating, admin dashboard, dan QA.



11\. Rencana Rilis dan QA



Milestone



Milestone Isi utama



MVP Internal Auth, habit, to-do list, dashboard, pengingat dasar

Beta Private Subscription Midtrans/Xendit, webhook, limit tier, billing portal

Public Launch Landing page, onboarding, analytics, email, monitoring

Iterasi 1 Statistik lanjutan, template habit, mobile app/PWA improvement





Checklist QA



\- Fungsi: registrasi, login, habit CRUD, check-in, to-do, pengingat, upgrade, downgrade, cancel.

\- Responsive: mobile 360 px, tablet, desktop 1440 px.

\- Aksesibilitas: keyboard navigation, contrast ratio, label form, focus state.

\- SEO: metadata, Open Graph, canonical URL, sitemap.

\- Performa: Core Web Vitals, lazy loading, caching.

\- Security: RLS/authorization, validasi input, rate limiting, webhook signature verification, secret management.

\- Error handling: payment pending, failed payment, webhook retry, notification permission denied.



Metrik pasca-rilis



\- Signup harian dan aktivasi habit pertama.

\- D1/D7/D30 retention.

\- Conversion rate free-to-paid.

\- MRR, ARPU, churn, dan failed payment rate.

\- Delivery rate dan open rate pengingat.

\- Error rate pada endpoint payment/webhook.



Rencana iterasi



Setelah 2–4 minggu rilis, evaluasi: habit mana yang paling sering dibuat, pada titik mana pengguna free mencapai limit, dan metode pembayaran mana yang paling berhasil. Gunakan hasil tersebut untuk menyesuaikan harga, paywall, dan urutan fitur Pro.



Keputusan yang perlu Anda pilih



1\. Arah desain: A — Clean Product, B — Editorial Modern, atau C — Bold Conversion?

2\. Stack: Opsi 1 Next.js + Supabase + Midtrans, Opsi 2 Next.js + Neon + Prisma + Xendit, atau Opsi 3 Laravel + MySQL + Midtrans?

3\. Payment gateway: Midtrans atau Xendit?

4\. Frekuensi subscription: bulanan saja, atau bulanan + tahunan?

5\. Bahasa produk: Indonesia, Inggris, atau bilingual?

6\. Apakah ingin hosting gratis untuk MVP?



Setelah Anda menjawab, saya akan lanjutkan ke task breakdown lengkap TASK-001 sampai TASK selesai, siap dieksekusi oleh AI agent atau developer.



Kutipan:

\[1] Midtrans Documentation https://docs.midtrans.com/

\[2] API Methods - Midtrans Documentation https://docs.midtrans.com/reference/api-methods-1

\[3] Create Subscription https://docs.midtrans.com/reference/create-subscription

\[4] Pricing \& Fees https://supabase.com/pricing

\[5] supabase.com https://supabase.com/pricing.md

\[6] How subscriptions work https://docs.xendit.co/docs/how-subscriptions-work

\[7] Overview https://docs.xendit.co/docs/subscriptions-overview

\[8] How to activate auto debit to support Subscriptions payments? https://help.xendit.co/hc/en-us/articles/20698430664985-How-to-activate-auto-debit-to-support-Subscriptions-payments

\[9] Subscription / recurring payments https://midtrans.com/features/recurring-payment

\[10] docs.midtrans.com https://docs.midtrans.com/llms.txt

\[11] Recurring and merchant-initiated transactions https://docs.xendit.co/docs/cards-recurring-and-merchant-initiated-transactions

\[12] Subscription with initial payment https://docs.xendit.co/docs/subscription-with-initial-payment

\[13] Pembayaran Berulang | Pembayaran Berlangganan https://www.xendit.co/id/products/subscriptions/

\[14] Pembayaran berkala/ berulang https://midtrans.com/id/fitur/pembayaran-berkala-berulang

\[15] Subscription Payments in Southeast Asia: What Businesses Need to Know https://www.xendit.co/en-id/blog/subscription-payments-in-southeast-asia-what-businesses-need-to-know/

