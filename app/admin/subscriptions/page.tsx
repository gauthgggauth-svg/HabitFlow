import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireAccount } from "@/lib/auth/account";
import { formatDateTime } from "@/lib/format";
import { createAdminSupabase } from "@/lib/supabase/admin";
import type { Plan, Profile, Subscription } from "@/types/domain";

export const metadata = { title: "Langganan" };

const PAGE_SIZE = 25;
const STATUSES = ["pending", "active", "past_due", "canceled", "expired"] as const;

function safeQuery(value: string | undefined): string {
  return (value ?? "").replace(/[^a-zA-Z0-9@._\-\s]/g, "").trim().slice(0, 80);
}

function pageLink(params: { status: string; q: string; page: number }): string {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.q) search.set("q", params.q);
  if (params.page > 1) search.set("page", String(params.page));
  const query = search.toString();
  return query ? `/admin/subscriptions?${query}` : "/admin/subscriptions";
}

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const account = await requireAccount();

  if (account.profile?.role !== "admin") notFound();

  const params = await searchParams;
  const status = STATUSES.find((candidate) => candidate === params.status) ?? "";
  const q = safeQuery(params.q);
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const admin = createAdminSupabase();

  let query = admin
    .from("subscriptions")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (status) query = query.eq("status", status);
  if (q) query = query.ilike("gateway_subscription_id", `%${q}%`);

  const [{ data: subscriptionsData, count }, plansResult] = await Promise.all([
    query,
    admin.from("plans").select("*").order("sort_order"),
  ]);

  const subscriptions = (subscriptionsData ?? []) as Subscription[];
  const plans = (plansResult.data ?? []) as Plan[];
  const userIds = [...new Set(subscriptions.map((subscription) => subscription.user_id))];

  const { data: usersData } = userIds.length
    ? await admin.from("users").select("id, email, name").in("id", userIds)
    : { data: [] as Pick<Profile, "id" | "email" | "name">[] };

  const planById = new Map(plans.map((plan) => [plan.id, plan]));
  const userById = new Map((usersData ?? []).map((user) => [user.id, user]));
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Langganan</h1>
        <p className="text-sm text-muted-foreground">
          {count ?? 0} langganan. Read-only; perubahan status hanya lewat webhook Midtrans.
        </p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-2">
        <div className="min-w-48 flex-1 space-y-1">
          <label htmlFor="q" className="text-xs font-medium text-muted-foreground">
            Cari gateway subscription ID
          </label>
          <Input id="q" name="q" defaultValue={q} placeholder="sub-..." />
        </div>
        <div className="space-y-1">
          <label htmlFor="status" className="text-xs font-medium text-muted-foreground">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status}
            className="h-11 rounded-lg border border-input bg-transparent px-3 text-sm"
          >
            <option value="">Semua</option>
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit">Terapkan</Button>
        {status || q ? (
          <Link
            href="/admin/subscriptions"
            className="inline-flex h-11 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Reset
          </Link>
        ) : null}
      </form>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <caption className="sr-only">Daftar langganan</caption>
          <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">Pengguna</th>
              <th scope="col" className="px-3 py-2 font-medium">Plan</th>
              <th scope="col" className="px-3 py-2 font-medium">Status</th>
              <th scope="col" className="px-3 py-2 font-medium">Periode</th>
              <th scope="col" className="px-3 py-2 font-medium">Gateway ID</th>
              <th scope="col" className="px-3 py-2 font-medium">Dibuat</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                  Tidak ada langganan yang cocok dengan filter.
                </td>
              </tr>
            ) : (
              subscriptions.map((subscription) => {
                const user = userById.get(subscription.user_id);
                const plan = planById.get(subscription.plan_id);

                return (
                  <tr key={subscription.id} className="border-t border-border align-top">
                    <td className="px-3 py-2">
                      <p className="font-medium">{user?.email ?? subscription.user_id}</p>
                      <p className="text-xs text-muted-foreground">{user?.name ?? "—"}</p>
                    </td>
                    <td className="px-3 py-2">{plan?.name ?? "—"}</td>
                    <td className="px-3 py-2">{subscription.status}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {subscription.current_period_start
                        ? formatDateTime(subscription.current_period_start, "Asia/Jakarta")
                        : "—"}
                      <br />
                      {subscription.current_period_end
                        ? formatDateTime(subscription.current_period_end, "Asia/Jakarta")
                        : "—"}
                    </td>
                    <td className="max-w-56 truncate px-3 py-2 text-xs">
                      {subscription.gateway_subscription_id ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {formatDateTime(subscription.created_at, "Asia/Jakarta")}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 text-sm">
        <p className="text-muted-foreground">
          Halaman {page} dari {totalPages}
        </p>
        <div className="flex gap-2">
          {page > 1 ? (
            <Link
              href={pageLink({ status, q, page: page - 1 })}
              className="inline-flex h-10 items-center rounded-lg border border-border px-3 font-medium hover:bg-muted"
            >
              Sebelumnya
            </Link>
          ) : null}
          {page < totalPages ? (
            <Link
              href={pageLink({ status, q, page: page + 1 })}
              className="inline-flex h-10 items-center rounded-lg border border-border px-3 font-medium hover:bg-muted"
            >
              Berikutnya
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
