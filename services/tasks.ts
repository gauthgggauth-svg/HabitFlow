import "server-only";

import { createServerSupabase } from "@/lib/supabase/server";
import type { Task } from "@/types/domain";

export async function listTasks(userId: string): Promise<Task[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .order("is_completed", { ascending: true })
    .order("due_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Gagal memuat tugas:", error.code);
    return [];
  }

  return data ?? [];
}

export async function countActiveTasks(userId: string): Promise<number> {
  const supabase = await createServerSupabase();
  const { count } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_completed", false);

  return count ?? 0;
}

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 } as const;

export function sortDashboardTasks(tasks: Task[]): Task[] {
  return [...tasks]
    .filter((task) => !task.is_completed)
    .sort((a, b) => {
      if (a.due_at && b.due_at) {
        const difference = new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
        if (difference !== 0) return difference;
      } else if (a.due_at) {
        return -1;
      } else if (b.due_at) {
        return 1;
      }

      return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    });
}
