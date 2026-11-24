import Link from "next/link";
import { AlertCircle, CheckCircle2, ReceiptText } from "lucide-react";

import { CancelSubscriptionDialog } from "./cancel-subscription-dialog";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireOnboardedAccount } from "@/lib/auth/account";
import { clientEnv } from "@/lib/env";
import {
  formatDateLong,
  formatDateTime,
  formatIDR,
  paymentStatusLabel,
  subscriptionStatusLabel,
} from "@/lib/format";
import { PENDING_PAYMENT_WINDOW_MINUTES } from "@/lib/payments";
import type { Subscription } from "@/types/domain";

export const metadata = {
  title: "Langganan",
  robots: { index: false, follow: false },
};

const ERROR_MESSAGES: Record<string, string> = {
  notfound: "Langganan tidak ditemukan. Muat ulang halaman lalu coba lagi.",
  inactive: "Langganan ini sudah tidak aktif, jadi tidak perlu dibatalkan.",
  cancel: "Pembatalan belum berhasil. Coba lagi beberapa saat atau hubungi dukungan.",
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { user, plans, entitlement, subscriptions, supabase } = await requireOnboardedAccount();

  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const paymentRows = payments ?? [];
  const planById = new Map(plans.map((plan) => [plan.id, plan]));
  const currentSubscription: Subscription | null =
    entitlement.subscription ?? subscriptions[0] ?? null;
  const currentPaidPlan = currentSubscription
    ? planById.get(currentSubscription.plan_id) ?? null
    : null;

  const pendingSince = new Date().getTime() - PENDING_PAYMENT_WINDOW_MINUTES * 60_000;
  const pendingPayment =
    paymentRows.find(
      (payment) =>
        payment.status === "pending" &&
        new Date(payment.created_at).getTime() >= pendingSince,
    ) ?? null;
  const pendingPlan = pendingPayment ? planById.get(pendingPayment.plan_id) ?? null : null;

  const isCancellable =
    currentSubscription?.status === "active" || currentSubscription?.status === "past_due";
  const isCanceled = currentSubscription?.status === "canceled";
  const isCanceledWithAccess = isCanceled && entitlement.isPaid;
  const otherPaidPlans = plans.filter(
    (plan) => plan.code !== "free" && plan.id !== entitlement.planId,
  );
  const supportEmail = clientEnv.NEXT_PUBLIC_SUPPORT_EMAIL ?? "dukungan@habitflow.id";

  const hasPeriodDate =
    currentSubscription?.status === "active" ||
    currentSubscription?.status === "canceled" ||
    currentSubscription?.status === "past_due";
  const accessUntilLabel = entitlement.accessUntil
    ? formatDateLong(entitlement.accessUntil, "Asia/Jakarta")
    : hasPeriodDate && currentSubscription?.current_period_end
      ? formatDateLong(currentSubscription.current_period_end, "Asia/Jakarta")
      : null;

  const renewalLabel = currentSubscription?.status === "active"
    ? "Perpanjangan berikutnya"
    : "Akses hingga";

  const badgeVariant =
    currentSubscription?.status === "active"
      ? "default"
      : currentSubscription?.status === "past_due"
        ? "destructive"
        : "secondary";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Langganan"
        description="Status paket berbayar, riwayat pembayaran, dan akses fitur premium."
      />

      {params.status === "canceled" ? (
        <div
          role="status"
          className="flex gap-2.5 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm leading-6 text-primary"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>
            Langganan dibatalkan. Perpanjangan otomatis berhenti; akses berbayar tetap berlaku
            sampai {accessUntilLabel ?? "akhir periode yang sudah dibayar"}.
          </p>
        </div>
      ) : null}

      {params.error ? (
        <div
          role="alert"
          className="flex gap-2.5 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm leading-6 text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>{ERROR_MESSAGES[params.error] ?? "Permintaan belum dapat diproses. Coba lagi."}</p>
        </div>
      ) : null}

      {pendingPayment ? (
        <div
          role="status"
          className="space-y-2 rounded-xl border border-amber/30 bg-amber/10 px-4 py-3 text-sm leading-6 text-amber"
        >
          <p className="font-medium">Pembayaran sedang diproses</p>
          <p>
            Order {pendingPayment.gateway_order_id} sebesar {formatIDR(pendingPayment.amount)}.
            Fitur premium aktif otomatis setelah pembayaran dikonfirmasi. Tombol ganti paket
            disembunyikan sampai status pembayaran jelas.
          </p>
          {pendingPlan ? (
            <Link
              href={`/checkout/${pendingPlan.id}/finish?order_id=${pendingPayment.gateway_order_id}`}
              className="inline-flex font-medium underline underline-offset-4"
            >
              Lihat status pembayaran
            </Link>
          ) : null}
        </div>
      ) : null}

      {currentSubscription?.status === "pending" && !pendingPayment ? (
        <div
          role="status"
          className="space-y-2 rounded-xl border border-amber/30 bg-amber/10 px-4 py-3 text-sm leading-6 text-amber"
        >
          <p className="font-medium">Langganan belum aktif</p>
          <p>
            Pembayaran sudah tercatat, tetapi aktivasi langganan bulanan belum selesai. Hubungi
            dukungan agar kami bantu menyelesaikan aktivasi tanpa menagih ulang.
          </p>
          <a
            href={`mailto:${supportEmail}?subject=${encodeURIComponent("HabitFlow — aktivasi langganan")}`}
            className="inline-flex font-medium underline underline-offset-4"
          >
            Hubungi dukungan
          </a>
        </div>
      ) : null}

      <Card className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <h2 className="text-base font-semibold tracking-tight">Paket saat ini</h2>
            <p className="text-sm text-muted-foreground">
              Status saat ini:{" "}
              <span className="font-medium text-foreground">{entitlement.planName}</span>
            </p>
          </div>
          <Badge variant={badgeVariant}>
            {subscriptionStatusLabel(currentSubscription?.status ?? "free")}
          </Badge>
        </div>

        <dl className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-muted/60 px-3 py-2">
            <dt className="text-xs text-muted-foreground">Harga</dt>
            <dd className="font-medium">{formatIDR(entitlement.price)}/bulan</dd>
          </div>
          <div className="rounded-lg bg-muted/60 px-3 py-2">
            <dt className="text-xs text-muted-foreground">{renewalLabel}</dt>
            <dd className="font-medium">{accessUntilLabel ?? "—"}</dd>
          </div>
          <div className="rounded-lg bg-muted/60 px-3 py-2">
            <dt className="text-xs text-muted-foreground">Metode perpanjangan</dt>
            <dd className="font-medium">
              {currentSubscription?.gateway_subscription_id
                ? isCanceled
                  ? "Dihentikan"
                  : "Kartu tersimpan"
                : "—"}
            </dd>
          </div>
        </dl>

        {isCanceledWithAccess ? (
          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-sm leading-6 text-muted-foreground">
              Perpanjangan otomatis sudah dihentikan. Data dan akses berbayar tetap tersedia
              sampai {accessUntilLabel ?? "akhir periode"}. Setelah itu akun kembali ke paket
              Free tanpa menghapus data.
            </p>
            {currentPaidPlan && !pendingPayment ? (
              <Link
                href={`/checkout/${currentPaidPlan.id}`}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Aktifkan kembali {currentPaidPlan.name}
              </Link>
            ) : null}
          </div>
        ) : null}

        {entitlement.isPaid ? (
          <div className="space-y-4 border-t border-border pt-4">
            <div className="flex flex-wrap gap-2">
              {isCancellable && currentSubscription ? (
                <CancelSubscriptionDialog
                  subscriptionId={currentSubscription.id}
                  planName={entitlement.planName}
                  accessUntil={accessUntilLabel}
                />
              ) : null}
            </div>

            {!pendingPayment && otherPaidPlans.length > 0 ? (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Ganti paket</h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  Biaya paket baru ditagih penuh untuk satu bulan. Tidak ada prorata atau refund
                  untuk sisa periode paket lama. Langganan lama otomatis dihentikan setelah
                  pembayaran baru berhasil.
                </p>
                <div className="flex flex-wrap gap-2">
                  {otherPaidPlans.map((plan) => (
                    <Link
                      key={plan.id}
                      href={`/checkout/${plan.id}`}
                      className="inline-flex h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
                    >
                      Pindah ke {plan.name} · {formatIDR(plan.price)}/bulan
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-sm leading-6 text-muted-foreground">
              {currentSubscription && currentSubscription.status !== "pending"
                ? `Langganan sebelumnya (${currentPaidPlan?.name ?? "berbayar"}) sudah berakhir. `
                : ""}
              Kamu berada di paket Free. Upgrade ke Standard atau Pro untuk menghapus batas habit
              dan tugas, membuka statistik, dan fitur premium lainnya.
            </p>
            <Link
              href="/pricing"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Lihat paket berbayar
            </Link>
          </div>
        )}
      </Card>

      <Card className="space-y-3 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold tracking-tight">Riwayat pembayaran</h2>
          <span className="text-xs text-muted-foreground">
            {paymentRows.length} transaksi
          </span>
        </div>

        {paymentsError ? (
          <p className="text-sm text-destructive">Riwayat pembayaran belum dapat dimuat.</p>
        ) : paymentRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada transaksi pembayaran.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border">
            {paymentRows.map((payment) => {
              const plan = planById.get(payment.plan_id);

              return (
                <li
                  key={payment.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <div className="space-y-0.5">
                    <p className="font-medium">
                      {plan?.name ?? "Paket"} · {formatIDR(payment.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(payment.created_at, "Asia/Jakarta")} ·{" "}
                      {payment.gateway_order_id}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        payment.status === "paid"
                          ? "default"
                          : payment.status === "failed" || payment.status === "expired"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {paymentStatusLabel(payment.status)}
                    </Badge>
                    <Link
                      href={`/billing/receipt/${payment.id}`}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      <ReceiptText className="size-4" aria-hidden="true" />
                      Receipt
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {entitlement.features.priority_support ? (
        <Card className="space-y-2 p-5 sm:p-6">
          <h2 className="text-base font-semibold tracking-tight">Prioritas dukungan</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Sebagai pelanggan Pro, pertanyaan soal pembayaran atau akun akan diprioritaskan.
          </p>
          <a
            href={`mailto:${supportEmail}?subject=${encodeURIComponent("HabitFlow Pro — bantuan akun")}`}
            className="inline-flex h-11 w-fit items-center justify-center rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
          >
            Hubungi dukungan
          </a>
        </Card>
      ) : null}
    </div>
  );
}
