import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowUpRight, CreditCard, Repeat2, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireAccount } from "@/lib/auth/account";
import { formatDateTime, formatIDR, formatNumber, formatPercent } from "@/lib/format";
import { createAdminSupabase } from "@/lib/supabase/admin";

export const metadata = { title: "Metrik" };

interface AdminMetrics {
  generated_at: string;
  total_users: number;
  new_users_30d: number;
  activated_users: number;
  paid_active: number;
  conversion_rate: number;
  mrr: number;
  arpu: number;
  active_by_plan: Record<string, number>;
  retention: {
    d1: number;
    d1_base: number;
    d7: number;
    d7_base: number;
    d30: number;
    d30_base: number;
  };
  churn_30d: Record<string, number>;
  payment: { attempts_30d: number; failed_30d: number; failed_rate: number; pending: number };
  webhook: { events_30d: number; failed_30d: number; failure_rate: number };
  reminders: { sent_30d: number; failed_30d: number; action_rate: number };
  product: {
    avg_active_habits: number;
    task_completion_rate: number;
    median_minutes_to_first_habit: number;
  };
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="space-y-2 p-4">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="streak-number text-2xl font-semibold tracking-tight">{value}</p>
      {hint ? <p className="text-xs leading-5 text-muted-foreground">{hint}</p> : null}
    </Card>
  );
}

export default async function AdminDashboardPage() {
  const account = await requireAccount();

  if (account.profile?.role !== "admin") notFound();

  const admin = createAdminSupabase();

  const [{ data: metricsData, error }, failedWebhooks, failedPayments, problemSubscriptions] =
    await Promise.all([
      admin.rpc("admin_metrics"),
      admin
        .from("webhook_events")
        .select("id, event_key, event_type, error, created_at")
        .eq("status", "failed")
        .order("created_at", { ascending: false })
        .limit(5),
      admin
        .from("payments")
        .select("id, gateway_order_id, amount, status, created_at")
        .in("status", ["failed", "expired"])
        .order("created_at", { ascending: false })
        .limit(5),
      admin
        .from("subscriptions")
        .select("id, status, current_period_end, updated_at")
        .in("status", ["past_due", "expired"])
        .order("updated_at", { ascending: false })
        .limit(5),
    ]);

  if (error || !metricsData) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">Metrik</h1>
        <p className="text-sm text-muted-foreground">Metrik belum dapat dimuat. Coba lagi nanti.</p>
      </div>
    );
  }

  const metrics = metricsData as unknown as AdminMetrics;
  const activePlanEntries = Object.entries(metrics.active_by_plan ?? {}).filter(
    ([code]) => code !== "free",
  );

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Metrik</h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          Ringkasan KPI MVP dari data aplikasi. Angka dihitung server-side; tidak ada data pribadi
          yang dikirim ke client selain agregat.
        </p>
        <p className="text-xs text-muted-foreground">
          Dibuat {formatDateTime(metrics.generated_at, "Asia/Jakarta")} WIB
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="KPI utama">
        <StatCard label="Total pengguna" value={formatNumber(metrics.total_users)} hint={`${formatNumber(metrics.new_users_30d)} baru dalam 30 hari`} />
        <StatCard label="Aktivasi" value={formatNumber(metrics.activated_users)} hint="Pengguna dengan minimal satu habit" />
        <StatCard label="Pelanggan aktif" value={formatNumber(metrics.paid_active)} hint={`Konversi ${formatPercent(metrics.conversion_rate)}`} />
        <StatCard label="MRR" value={formatIDR(metrics.mrr)} hint={`ARPU ${formatIDR(metrics.arpu)}`} />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Retensi">
        <StatCard label="Retensi D1" value={formatPercent(metrics.retention.d1)} hint={`${formatNumber(metrics.retention.d1_base)} pengguna melewati D1`} />
        <StatCard label="Retensi D7" value={formatPercent(metrics.retention.d7)} hint={`${formatNumber(metrics.retention.d7_base)} pengguna melewati D7`} />
        <StatCard label="Retensi D30" value={formatPercent(metrics.retention.d30)} hint={`${formatNumber(metrics.retention.d30_base)} pengguna melewati D30`} />
        <StatCard label="Rata-rata habit aktif" value={formatNumber(metrics.product.avg_active_habits)} hint="Per pengguna" />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
              <CreditCard className="size-4 text-muted-foreground" aria-hidden="true" />
              Langganan
            </h2>
            <Link href="/admin/subscriptions" className="text-sm font-medium text-primary hover:underline">
              Lihat semua
            </Link>
          </div>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            {activePlanEntries.length === 0 ? (
              <p className="col-span-2 text-sm text-muted-foreground">Belum ada langganan aktif.</p>
            ) : (
              activePlanEntries.map(([code, total]) => (
                <div key={code} className="rounded-lg bg-muted/60 px-3 py-2">
                  <dt className="text-xs capitalize text-muted-foreground">{code}</dt>
                  <dd className="font-medium">{formatNumber(total)} aktif</dd>
                </div>
              ))
            )}
            <div className="rounded-lg bg-muted/60 px-3 py-2">
              <dt className="text-xs text-muted-foreground">Churn 30 hari</dt>
              <dd className="font-medium">
                {Object.entries(metrics.churn_30d ?? {})
                  .filter(([code]) => code !== "free")
                  .map(([code, total]) => `${code}: ${total}`)
                  .join(" · ") || "0"}
              </dd>
            </div>
            <div className="rounded-lg bg-muted/60 px-3 py-2">
              <dt className="text-xs text-muted-foreground">Pembayaran gagal</dt>
              <dd className="font-medium">
                {formatPercent(metrics.payment.failed_rate)} · {metrics.payment.failed_30d}/
                {metrics.payment.attempts_30d}
              </dd>
            </div>
          </dl>
        </Card>

        <Card className="space-y-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
              <Repeat2 className="size-4 text-muted-foreground" aria-hidden="true" />
              Operasional
            </h2>
            <Badge variant={metrics.webhook.failed_30d > 0 ? "destructive" : "secondary"}>
              Webhook {formatPercent(metrics.webhook.failure_rate)} gagal
            </Badge>
          </div>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg bg-muted/60 px-3 py-2">
              <dt className="text-xs text-muted-foreground">Reminder terkirim</dt>
              <dd className="font-medium">{formatNumber(metrics.reminders.sent_30d)}</dd>
            </div>
            <div className="rounded-lg bg-muted/60 px-3 py-2">
              <dt className="text-xs text-muted-foreground">Aksi setelah reminder</dt>
              <dd className="font-medium">{formatPercent(metrics.reminders.action_rate)}</dd>
            </div>
            <div className="rounded-lg bg-muted/60 px-3 py-2">
              <dt className="text-xs text-muted-foreground">Reminder gagal</dt>
              <dd className="font-medium">{formatNumber(metrics.reminders.failed_30d)}</dd>
            </div>
            <div className="rounded-lg bg-muted/60 px-3 py-2">
              <dt className="text-xs text-muted-foreground">Pembayaran pending</dt>
              <dd className="font-medium">{formatNumber(metrics.payment.pending)}</dd>
            </div>
            <div className="rounded-lg bg-muted/60 px-3 py-2">
              <dt className="text-xs text-muted-foreground">Task selesai</dt>
              <dd className="font-medium">{formatPercent(metrics.product.task_completion_rate)}</dd>
            </div>
            <div className="rounded-lg bg-muted/60 px-3 py-2">
              <dt className="text-xs text-muted-foreground">Median ke habit pertama</dt>
              <dd className="font-medium">
                {formatNumber(metrics.product.median_minutes_to_first_habit)} menit
              </dd>
            </div>
          </dl>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="space-y-3 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="size-4 text-destructive" aria-hidden="true" />
            Webhook gagal
          </h2>
          {!failedWebhooks.data || failedWebhooks.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tidak ada webhook gagal.</p>
          ) : (
            <ul className="space-y-2 text-xs">
              {failedWebhooks.data.map((event) => (
                <li key={event.id} className="rounded-lg bg-muted/60 px-3 py-2">
                  <p className="truncate font-medium">{event.event_key}</p>
                  <p className="text-muted-foreground">{event.error ?? "Tanpa pesan"}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="space-y-3 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <CreditCard className="size-4 text-muted-foreground" aria-hidden="true" />
            Pembayaran bermasalah
          </h2>
          {!failedPayments.data || failedPayments.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tidak ada pembayaran gagal.</p>
          ) : (
            <ul className="space-y-2 text-xs">
              {failedPayments.data.map((payment) => (
                <li key={payment.id} className="rounded-lg bg-muted/60 px-3 py-2">
                  <p className="truncate font-medium">{payment.gateway_order_id}</p>
                  <p className="text-muted-foreground">
                    {formatIDR(payment.amount)} · {payment.status}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="space-y-3 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Users className="size-4 text-muted-foreground" aria-hidden="true" />
            Langganan bermasalah
          </h2>
          {!problemSubscriptions.data || problemSubscriptions.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tidak ada langganan bermasalah.</p>
          ) : (
            <ul className="space-y-2 text-xs">
              {problemSubscriptions.data.map((subscription) => (
                <li key={subscription.id} className="rounded-lg bg-muted/60 px-3 py-2">
                  <p className="font-medium">{subscription.status}</p>
                  <p className="text-muted-foreground">
                    {subscription.current_period_end
                      ? formatDateTime(subscription.current_period_end, "Asia/Jakarta")
                      : "Tanpa periode"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <Card className="space-y-3 p-5">
        <h2 className="text-base font-semibold tracking-tight">Definisi metrik</h2>
        <ul className="grid gap-2 text-xs leading-5 text-muted-foreground sm:grid-cols-2">
          <li>MRR = jumlah harga bulanan langganan aktif Standard/Pro.</li>
          <li>ARPU = MRR ÷ jumlah pelanggan berbayar aktif.</li>
          <li>Konversi = pelanggan aktif ÷ total pengguna terdaftar.</li>
          <li>Churn 30 hari = langganan canceled/expired dalam 30 hari per plan.</li>
          <li>Retensi D1/D7/D30 = pengguna yang check-in pada hari tersebut ÷ pengguna yang sudah melewatinya.</li>
          <li>Failed payment rate = pembayaran gagal ÷ total percobaan 30 hari.</li>
          <li>Webhook failure rate = event gagal ÷ total event 30 hari.</li>
          <li>Reminder action rate = check-in dalam 60 menit setelah reminder terkirim ÷ reminder terkirim.</li>
        </ul>
        <Link
          href="/admin/users"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          Telusuri pengguna
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </Link>
      </Card>
    </div>
  );
}
