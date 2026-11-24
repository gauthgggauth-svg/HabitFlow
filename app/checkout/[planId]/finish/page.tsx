import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { requireOnboardedAccount } from "@/lib/auth/account";
import type { Payment } from "@/types/domain";

export const metadata = {
  title: "Status pembayaran",
  robots: { index: false, follow: false },
};

export default async function CheckoutFinishPage({
  searchParams,
}: {
  params: Promise<{ planId: string }>;
  searchParams: Promise<{ order_id?: string }>;
}) {
  const { order_id } = await searchParams;
  const { user, supabase } = await requireOnboardedAccount();

  const { data: payment } = order_id
    ? await supabase
        .from("payments")
        .select("*")
        .eq("gateway_order_id", order_id)
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };

  const paymentRecord = (payment ?? null) as Payment | null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Status pembayaran"
        description="Status transaksi Midtrans untuk paket yang kamu pilih."
      />

      <Card className="space-y-3 p-5 sm:p-6">
        <h2 className="text-base font-semibold tracking-tight">Status pembayaran</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          {paymentRecord
            ? `Order ${paymentRecord.gateway_order_id} · ${paymentRecord.status}.`
            : "Transaksi belum ditemukan."}
        </p>

        {paymentRecord?.status === "paid" ? (
          <>
            <p className="text-sm leading-6 text-muted-foreground">
              Pembayaran berhasil. Fitur Premium aktif untuk periode berikutnya.
            </p>
            <Link
              href="/app"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Buka aplikasi
            </Link>
          </>
        ) : null}

        {paymentRecord?.status === "failed" || paymentRecord?.status === "expired" ? (
          <>
            <p className="text-sm leading-6 text-muted-foreground">
              Pembayaran belum berhasil. Coba lagi atau pilih metode pembayaran lain.
            </p>
            <Link
              href="/pricing"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
            >
              Pilih paket lain
            </Link>
          </>
        ) : null}

        {(!paymentRecord || paymentRecord.status === "pending") ? (
          <>
            <p className="text-sm leading-6 text-muted-foreground">
              Pembayaran sedang diproses. Fitur Premium akan aktif otomatis setelah pembayaran
              dikonfirmasi.
            </p>
            <Link
              href="/billing"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
            >
              Lihat status langganan
            </Link>
          </>
        ) : null}
      </Card>
    </div>
  );
}
