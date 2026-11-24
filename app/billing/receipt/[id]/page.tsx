import Link from "next/link";
import { notFound } from "next/navigation";

import { PrintReceiptButton } from "./print-button";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireOnboardedAccount } from "@/lib/auth/account";
import {
  formatDateTime,
  formatIDR,
  paymentStatusLabel,
} from "@/lib/format";
import type { Plan } from "@/types/domain";

export const metadata = {
  title: "Receipt",
  robots: { index: false, follow: false },
};

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, profile, supabase } = await requireOnboardedAccount();

  const { data: payment } = await supabase
    .from("payments")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!payment) {
    notFound();
  }

  const { data: planData } = await supabase
    .from("plans")
    .select("*")
    .eq("id", payment.plan_id)
    .maybeSingle();

  const plan = (planData ?? null) as Plan | null;
  const isPaid = payment.status === "paid";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="print:hidden">
        <PageHeader
          title="Receipt"
          description="Bukti pembayaran langganan HabitFlow. Dokumen ini bukan invoice pajak."
          action={<PrintReceiptButton />}
        />
      </div>

      <Card className="space-y-6 p-6 print:border-0 print:shadow-none sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              HabitFlow
            </p>
            <h1 className="text-xl font-semibold tracking-tight">Receipt pembayaran</h1>
            <p className="text-sm text-muted-foreground">{payment.gateway_order_id}</p>
          </div>
          <Badge variant={isPaid ? "default" : "secondary"}>
            {paymentStatusLabel(payment.status)}
          </Badge>
        </div>

        <dl className="divide-y divide-border text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 py-3">
            <dt className="text-muted-foreground">Nomor order</dt>
            <dd className="font-medium">{payment.gateway_order_id}</dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 py-3">
            <dt className="text-muted-foreground">Tanggal transaksi</dt>
            <dd className="font-medium">
              {formatDateTime(payment.created_at, "Asia/Jakarta")} WIB
            </dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 py-3">
            <dt className="text-muted-foreground">Paket</dt>
            <dd className="font-medium">{plan?.name ?? "HabitFlow"}</dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 py-3">
            <dt className="text-muted-foreground">Jumlah</dt>
            <dd className="font-medium">{formatIDR(payment.amount)}</dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 py-3">
            <dt className="text-muted-foreground">Status</dt>
            <dd className="font-medium">{paymentStatusLabel(payment.status)}</dd>
          </div>
          {payment.paid_at ? (
            <div className="flex flex-wrap items-center justify-between gap-2 py-3">
              <dt className="text-muted-foreground">Dibayar pada</dt>
              <dd className="font-medium">
                {formatDateTime(payment.paid_at, "Asia/Jakarta")} WIB
              </dd>
            </div>
          ) : null}
        </dl>

        <div className="rounded-lg bg-muted/60 px-4 py-3 text-sm leading-6 text-muted-foreground">
          <p className="font-medium text-foreground">Ditagihkan kepada</p>
          <p>{profile?.name || user.email}</p>
          <p>{user.email}</p>
        </div>

        <p className="text-xs leading-5 text-muted-foreground">
          {isPaid
            ? "Pembayaran sudah diterima. Simpan receipt ini sebagai bukti transaksi."
            : "Receipt ini mencatat status transaksi saat halaman dibuka. Status dapat berubah setelah konfirmasi pembayaran."}
        </p>
      </Card>

      <div className="flex flex-wrap gap-2 print:hidden">
        <Link
          href="/billing"
          className="inline-flex h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
        >
          Kembali ke langganan
        </Link>
      </div>
    </div>
  );
}
