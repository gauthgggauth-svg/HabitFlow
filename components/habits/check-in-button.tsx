"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { toggleHabitCheckInAction } from "@/app/(app)/app/habits/actions";
import { cn } from "@/lib/utils";

export function CheckInButton({
  habitId,
  completed,
  showLabel = false,
  className,
}: {
  habitId: string;
  completed: boolean;
  showLabel?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [optimisticCompleted, setOptimisticCompleted] = useOptimistic(completed);
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      setOptimisticCompleted(!optimisticCompleted);
      const result = await toggleHabitCheckInAction(habitId);

      if (!result.ok) {
        toast.error(result.message ?? "Check-in belum berhasil.");
        return;
      }

      toast.success(
        result.completed ? "Habit ditandai selesai." : "Check-in dibatalkan.",
      );
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={optimisticCompleted}
      aria-label={optimisticCompleted ? "Batalkan check-in hari ini" : "Tandai habit selesai hari ini"}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-70",
        optimisticCompleted
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-primary",
        showLabel ? "px-4" : "size-11 p-0",
        className,
      )}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <Check className="size-4" aria-hidden="true" />
      )}
      {showLabel ? <span>{optimisticCompleted ? "Selesai" : "Tandai"}</span> : null}
    </button>
  );
}
