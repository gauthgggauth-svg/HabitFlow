import Link from "next/link";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export function Logo({
  href = "/",
  className,
  showWordmark = true,
}: {
  href?: string;
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2.5 rounded-lg font-heading text-lg font-semibold tracking-tight",
        className,
      )}
      aria-label="HabitFlow — beranda"
    >
      <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
        <Check className="size-5" strokeWidth={2.6} aria-hidden="true" />
      </span>
      {showWordmark ? <span>HabitFlow</span> : null}
    </Link>
  );
}
