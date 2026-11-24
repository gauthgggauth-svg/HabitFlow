import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireAccount } from "@/lib/auth/account";
import { formatDateShort } from "@/lib/format";
import { createAdminSupabase } from "@/lib/supabase/admin";
import type { Plan, Profile, Subscription } from "@/types/domain";

export const metadata = { title: "Pengguna" };

const PAGE_SIZE = 25;

function safeQuery(value: string | undefined): string {
  return (value ?? "").replace(/[^a-zA-Z0-9@._\-\s]/g, "").trim().slice(0, 80);
}

function pageLink(params: { q: string; plan: string; page: number }): string {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.plan) search.set("plan", params.plan);
  if (params.page > 1) search.set("page", String(params.page));
  const query = search.toString();
  return query ? `/admin/users?${query}` : "/admin/users";
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; plan?: string; page?: string }>;
}) {
  const account = await requireAccount();

  if (account.profile?.role !== "admin") notFound();

  const params = await searchParams;
  const q = safeQuery(params.q);
  const planCode = safeQuery(params.plan);
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const admin = createAdminSupabase();

  const { data: plansData } = await admin.from("plans").select("*").order("sort_order");
  const plans = (plansData ?? []) as Plan[];

  let planUserIds: string[] | null = null;

  if (planCode) {
    const plan = plans.find((candidate) => candidate.code === planCode);

    if (!plan) {
      planUserIds = [];
    } else {
      const { data: subscriptions } = await admin
        .from("subscriptions")
        .select("user_id")
        .eq("plan_id", plan.id)
        .eq("status", "active");
      planUserIds = [...new Set((subscriptions ?? []).map((row) => row.user_id))];
    }
  }

  let users: Profile[] = [];
  let count = 0;

  if (!planUserIds || planUserIds.length > 0) {
    let query = admin
      .from("users")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    if (q) {
      query = query.or(`email.ilike.%${q}%,name.ilike.%${q}%`);
    }

    if (planUserIds) {
      query = query.in("id", planUserIds);
    }

    const result = await query;
    users = (result.data ?? []) as Profile[];
    count = result.count ?? 0;
  }

  const userIds = users.map((user) => user.id);
  const [subscriptionsResult, habitsResult, tasksResult] = await Promise.all([
    userIds.length
      ? admin
          .from("subscriptions")
          .select("*")
          .in("user_id", userIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as Subscription[] }),
    userIds.length
      ? admin.from("habits").select("user_id, is_active").in("user_id", userIds)
      : Promise.resolve({ data: [] as { user_id: string; is_active: boolean }[] }),
    userIds.length
      ? admin.from("tasks").select("user_id, is_completed").in("user_id", userIds)
      : Promise.resolve({ data: [] as { user_id: string; is_completed: boolean }[] }),
  ]);

  const planById = new Map(plans.map((plan) => [plan.id, plan]));
  const subscriptions = (subscriptionsResult.data ?? []) as Subscription[];
  const subscriptionByUser = new Map<string, Subscription>();

  for (const subscription of subscriptions) {
    if (!subscriptionByUser.has(subscription.user_id)) {
      subscriptionByUser.set(subscription.user_id, subscription);
    }
  }

  const habitCounts = new Map<string, number>();
  for (const habit of habitsResult.data ?? []) {
    if (habit.is_active) {
      habitCounts.set(habit.user_id, (habitCounts.get(habit.user_id) ?? 0) + 1);
    }
  }

  const taskCounts = new Map<string, number>();
  for (const task of tasksResult.data ?? []) {
    if (!task.is_completed) {
      taskCounts.set(task.user_id, (taskCounts.get(task.user_id) ?? 0) + 1);
    }
  }

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Pengguna</h1>
        <p className="text-sm text-muted-foreground">
          {count} pengguna terdaftar. Data read-only, maksimal {PAGE_SIZE} baris per halaman.
        </p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-2">
        <div className="min-w-48 flex-1 space-y-1">
          <label htmlFor="q" className="text-xs font-medium text-muted-foreground">
            Cari email atau nama
          </label>
          <Input id="q" name="q" defaultValue={q} placeholder="contoh: akram" />
        </div>
        <div className="space-y-1">
          <label htmlFor="plan" className="text-xs font-medium text-muted-foreground">
            Plan aktif
          </label>
          <select
            id="plan"
            name="plan"
            defaultValue={planCode}
            className="h-11 rounded-lg border border-input bg-transparent px-3 text-sm"
          >
            <option value="">Semua</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.code}>
                {plan.name}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit">Terapkan</Button>
        {q || planCode ? (
          <Link
            href="/admin/users"
            className="inline-flex h-11 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Reset
          </Link>
        ) : null}
      </form>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <caption className="sr-only">Daftar pengguna HabitFlow</caption>
          <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">Email</th>
              <th scope="col" className="px-3 py-2 font-medium">Nama</th>
              <th scope="col" className="px-3 py-2 font-medium">Role</th>
              <th scope="col" className="px-3 py-2 font-medium">Daftar</th>
              <th scope="col" className="px-3 py-2 font-medium">Plan</th>
              <th scope="col" className="px-3 py-2 font-medium">Status</th>
              <th scope="col" className="px-3 py-2 font-medium">Habit aktif</th>
              <th scope="col" className="px-3 py-2 font-medium">Task aktif</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
                  Tidak ada pengguna yang cocok dengan filter.
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const subscription = subscriptionByUser.get(user.id);
                const plan = subscription ? planById.get(subscription.plan_id) : null;

                return (
                  <tr key={user.id} className="border-t border-border align-top">
                    <td className="px-3 py-2 font-medium">{user.email}</td>
                    <td className="px-3 py-2">{user.name || "—"}</td>
                    <td className="px-3 py-2">
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {formatDateShort(user.created_at, "Asia/Jakarta")}
                    </td>
                    <td className="px-3 py-2">{plan?.name ?? "Free"}</td>
                    <td className="px-3 py-2">{subscription?.status ?? "free"}</td>
                    <td className="px-3 py-2">{habitCounts.get(user.id) ?? 0}</td>
                    <td className="px-3 py-2">{taskCounts.get(user.id) ?? 0}</td>
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
              href={pageLink({ q, plan: planCode, page: page - 1 })}
              className="inline-flex h-10 items-center rounded-lg border border-border px-3 font-medium hover:bg-muted"
            >
              Sebelumnya
            </Link>
          ) : null}
          {page < totalPages ? (
            <Link
              href={pageLink({ q, plan: planCode, page: page + 1 })}
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
