"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { toggleTaskCompletionAction } from "@/app/(app)/app/tasks/actions";
import { cn } from "@/lib/utils";

export function TaskCheckbox({
  taskId,
  completed,
  title,
}: {
  taskId: string;
  completed: boolean;
  title: string;
}) {
  const router = useRouter();
  const [optimisticCompleted, setOptimisticCompleted] = useOptimistic(completed);
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      setOptimisticCompleted(!optimisticCompleted);
      const result = await toggleTaskCompletionAction(taskId);

      if (!result.ok) {
        toast.error(result.message ?? "Status tugas belum berhasil diubah.");
        return;
      }

      toast.success(result.completed ? "Tugas selesai." : "Tugas dibuka kembali.");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      role="checkbox"
      aria-checked={optimisticCompleted}
      aria-label={optimisticCompleted ? `Buka kembali tugas: ${title}` : `Selesaikan tugas: ${title}`}
      className="group/task -m-2 inline-flex size-11 shrink-0 items-center justify-center rounded-lg p-2 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <span
        className={cn(
          "flex size-5 items-center justify-center rounded-[5px] border transition-colors",
          optimisticCompleted
            ? "border-primary bg-primary text-primary-foreground"
            : "border-input bg-background group-hover/task:border-primary/60",
        )}
      >
        {pending ? (
          <Loader2 className="size-3 animate-spin" aria-hidden="true" />
        ) : optimisticCompleted ? (
          <Check className="size-3.5" aria-hidden="true" />
        ) : null}
      </span>
    </button>
  );
}
