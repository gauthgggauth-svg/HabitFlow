import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description: "Kebijakan Privasi HabitFlow.",
  alternates: { canonical: "/legal/privacy" },
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
        Legal
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        Kebijakan Privasi
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">Terakhir diperbarui: 23 November 2026</p>

      <div className="mt-6 rounded-xl border border-amber-600/25 bg-amber-600/5 p-4 text-sm leading-6">
        <strong>Draf.</strong> Dokumen ini menjelaskan praktik data versi MVP dan
        perlu ditinjau sebelum pembayaran production diaktifkan. Identitas badan
        usaha, alamat, dan kontak resmi harus dilengkapi oleh pemilik produk.
      </div>

      <div className="prose-custom mt-8 space-y-7 text-sm leading-7 text-muted-foreground">
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">1. Data yang kami simpan</h2>
          <p>
            Kami menyimpan data akun (nama, email, zona waktu, preferensi
            pengingat), data habit dan riwayat check-in, tugas yang kamu buat,
            status langganan dan riwayat pembayaran, serta langganan web push
            perangkat jika kamu mengaktifkan notifikasi.
          </p>
          <p>
            Kata sandi dikelola oleh penyedia autentikasi dan tidak pernah
            disimpan dalam bentuk teks biasa oleh HabitFlow. Data pembayaran
            sensitif, seperti nomor kartu, diproses oleh Midtrans dan tidak
            disimpan di database HabitFlow.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">2. Tujuan penggunaan</h2>
          <p>
            Data dipakai untuk menjalankan fitur aplikasi: menampilkan habit dan
            tugas, menghitung streak, mengirim pengingat, memproses langganan,
            menampilkan riwayat pembayaran, serta membantu penyelesaian masalah
            teknis. Kami tidak menjual data pribadi kepada pihak ketiga.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">3. Pihak ketiga</h2>
          <p>
            HabitFlow memakai layanan infrastruktur dan integrasi berikut:
            Supabase (database dan autentikasi), Midtrans (pembayaran), serta
            layanan email dan web push yang dikonfigurasi oleh pengelola produk.
            Masing-masing pihak memproses data sesuai kebijakan mereka sendiri.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">4. Akses dan keamanan</h2>
          <p>
            Data pengguna dipisahkan dengan aturan akses tingkat baris pada
            database. Karyawan atau administrator tidak memakai akses tersebut
            untuk mengubah data pengguna tanpa alasan operasional yang sah.
            Akses admin bersifat read-only di versi MVP.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">5. Penyimpanan dan penghapusan</h2>
          <p>
            Data disimpan selama akun aktif atau selama diperlukan untuk
            memenuhi kewajiban hukum dan pembukuan. Permintaan penghapusan akun
            dapat diajukan melalui kanal dukungan resmi. Penghapusan akun akan
            menghapus habit, tugas, dan riwayat check-in terkait.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">6. Hak pengguna</h2>
          <p>
            Kamu dapat memperbarui nama, zona waktu, dan preferensi pengingat
            dari halaman Pengaturan. Kamu juga dapat meminta salinan atau
            penghapusan data melalui kanal dukungan resmi. Pelanggan Pro dapat
            mengekspor habit, tugas, dan riwayat check-in dalam format CSV.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">7. Perubahan kebijakan</h2>
          <p>
            Perubahan material akan diumumkan melalui aplikasi atau email
            terdaftar. Tanggal pembaruan di bagian atas halaman ini menunjukkan
            versi terakhir.
          </p>
        </section>
      </div>
    </article>
  );
}
