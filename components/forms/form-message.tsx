import { AlertCircle, CheckCircle2 } from "lucide-react";

import type { FormState } from "@/lib/validation";
import { cn } from "@/lib/utils";

export function FormMessage({
  state,
  className,
}: {
  state: FormState;
  className?: string;
}) {
  if (state.status === "idle" || !state.message) return null;

  const isError = state.status === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live="polite"
      className={cn(
        "flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm leading-5",
        isError
          ? "border-destructive/25 bg-destructive/5 text-destructive"
          : "border-primary/25 bg-primary/5 text-primary",
        className,
      )}
    >
      {isError ? (
        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      ) : (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      )}
      <span>{state.message}</span>
    </div>
  );
}

export function FieldError({
  id,
  message,
}: {
  id: string;
  message?: string;
}) {
  if (!message) return null;

  return (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  );
}
