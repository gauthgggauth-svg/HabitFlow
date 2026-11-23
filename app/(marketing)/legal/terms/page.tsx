import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Syarat Layanan",
  description: "Syarat Layanan HabitFlow.",
  alternates: { canonical: "/legal/terms" },
};

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
        Legal
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        Syarat Layanan
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">Terakhir diperbarui: 23 November 2026</p>

      <div className="mt-6 rounded-xl border border-amber-600/25 bg-amber-600/5 p-4 text-sm leading-6">
        <strong>Draf.</strong> Dokumen ini perlu ditinjau dan dilengkapi sebelum
        pembayaran production diaktifkan. Identitas badan usaha, kebijakan
        refund, dan kanal kontak resmi wajib diisi oleh pemilik produk.
      </div>

      <div className="mt-8 space-y-7 text-sm leading-7 text-muted-foreground">
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">1. Layanan</h2>
          <p>
            HabitFlow adalah aplikasi web untuk mencatat habit, mengelola tugas,
            menerima pengingat, dan melihat statistik konsistensi. Layanan
            disediakan apa adanya selama masa MVP dan dapat berubah seiring
            perbaikan produk.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">2. Akun</h2>
          <p>
            Kamu bertanggung jawab menjaga kerahasiaan kata sandi dan aktivitas
            yang terjadi pada akunmu. Gunakan alamat email yang valid. Satu akun
            ditujukan untuk satu pengguna; berbagi akun berbayar tidak
            diperbolehkan.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">3. Paket dan pembayaran</h2>
          <p>
            Paket berbayar ditagih bulanan melalui Midtrans. Harga yang berlaku
            adalah harga yang ditampilkan pada halaman checkout saat pembayaran
            dilakukan. Pembayaran pertama mengaktifkan akses untuk periode
            berjalan, dan pembayaran berikutnya dilakukan otomatis sampai
            langganan dibatalkan.
          </p>
          <p>
            Perubahan paket dilakukan dengan pembayaran paket baru. Tidak ada
            prorata atau refund otomatis untuk sisa periode paket sebelumnya.
            Jika pembayaran berulang gagal, akses berbayar dapat dipertahankan
            selama masa tenggang singkat sebelum akun kembali ke paket Free.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">4. Pembatalan</h2>
          <p>
            Kamu dapat membatalkan perpanjangan kapan saja dari halaman
            Langganan. Pembatalan menghentikan tagihan berikutnya, tetapi akses
            berbayar tetap berlaku sampai akhir periode yang sudah dibayar.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">5. Penggunaan yang dilarang</h2>
          <p>
            Dilarang menggunakan layanan untuk aktivitas ilegal, mengakses data
            pengguna lain, mengganggu keamanan sistem, atau menyalahgunakan
            endpoint pembayaran dan pengingat. Pelanggaran dapat menyebabkan
            pembatasan atau penonaktifan akun.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">6. Batasan tanggung jawab</h2>
          <p>
            HabitFlow membantu pencatatan dan pengingat, tetapi tidak menjamin
            hasil kesehatan, produktivitas, atau kebiasaan tertentu. Layanan
            dapat mengalami gangguan teknis. Sepanjang diizinkan hukum, tanggung
            jawab kami dibatasi pada nilai langganan yang dibayarkan.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">7. Perubahan syarat</h2>
          <p>
            Perubahan material akan diumumkan melalui aplikasi atau email
            terdaftar. Penggunaan layanan setelah perubahan berlaku berarti kamu
            menyetujui versi terbaru.
          </p>
        </section>
      </div>
    </article>
  );
}
