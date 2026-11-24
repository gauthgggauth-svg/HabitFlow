import Link from "next/link";

import { TaskCheckbox } from "@/components/tasks/task-checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { deleteTaskAction } from "./actions";
import { requireOnboardedAccount } from "@/lib/auth/account";
import { formatDateShort } from "@/lib/format";
import { listTasks, sortDashboardTasks } from "@/services/tasks";
import { ClipboardList, Trash2 } from "lucide-react";

const PRIORITY_LABELS = { low: "Rendah", medium: "Sedang", high: "Tinggi" } as const;
const PRIORITY_VARIANTS = { low: "secondary", medium: "default", high: "destructive" } as const;

export default async function TasksPage() {
  const { user, profile } = await requireOnboardedAccount();
  const timezone = profile?.timezone ?? "Asia/Jakarta";
  const tasks = sortDashboardTasks(await listTasks(user.id));

  const active = tasks.filter((task) => !task.is_completed);
  const completed = tasks.filter((task) => task.is_completed);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">Tugas</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Catat tugas pendukung harian, lalu selesaikan tanpa meninggalkan aplikasi.
          </p>
        </div>
        <Link
          href="/app/tasks/new"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Tambah tugas
        </Link>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Belum ada tugas"
          description="Catat tugas pendukung seperti persiapan atau pembayaran. Selesaikan tugas ini dari daftar."
          action={
            <Link
              href="/app/tasks/new"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Tambah tugas pertama
            </Link>
          }
        />
      ) : (
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">Aktif ({active.length})</TabsTrigger>
            <TabsTrigger value="completed">Selesai ({completed.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4 space-y-2">
            {active.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="Tidak ada tugas aktif"
                description="Semua tugas aktif sudah selesai. Nice work."
              />
            ) : (
              active.map((task) => (
                <div
                  key={task.id}
                  className="flex min-h-14 items-center gap-3 rounded-xl border border-border bg-card p-3"
                >
                  <TaskCheckbox taskId={task.id} completed={false} title={task.title} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{task.title}</p>
                    {task.notes ? (
                      <p className="truncate text-xs text-muted-foreground">{task.notes}</p>
                    ) : null}
                  </div>
                  <Badge variant={PRIORITY_VARIANTS[task.priority]}>{PRIORITY_LABELS[task.priority]}</Badge>
                  {task.due_at ? (
                    <span className="text-xs text-muted-foreground">{formatDateShort(task.due_at, timezone)}</span>
                  ) : null}
                  <form action={deleteTaskAction}>
                    <input type="hidden" name="taskId" value={task.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon"
                      aria-label={`Hapus tugas: ${task.title}`}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </form>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-4 space-y-2">
            {completed.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="Belum ada tugas selesai"
                description="Tugas yang kamu selesaikan akan muncul di tab ini."
              />
            ) : (
              completed.map((task) => (
                <div
                  key={task.id}
                  className="flex min-h-14 items-center gap-3 rounded-xl border border-border bg-card p-3"
                >
                  <TaskCheckbox taskId={task.id} completed title={task.title} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{task.title}</p>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
