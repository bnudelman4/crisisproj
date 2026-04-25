import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

type Variant =
  | "neutral"
  | "source"
  | "critical"
  | "warning"
  | "success"
  | "outline"
  | "inverse";

export function Badge({
  children,
  variant = "neutral",
  className,
  dot = false,
}: {
  children: ReactNode;
  variant?: Variant;
  className?: string;
  dot?: boolean;
}) {
  const styles: Record<Variant, string> = {
    neutral: "bg-muted text-ink-secondary",
    source: "bg-elevated text-ink border border-hairline",
    critical: "bg-[#FEE9E9] text-[#B91C1C]",
    warning: "bg-[#FEF3C7] text-[#92400E]",
    success: "bg-[#D1FAE5] text-[#047857]",
    outline:
      "bg-transparent text-ink-secondary border border-hairline",
    inverse: "bg-white/[0.04] text-ink-on-inverse-muted border border-white/[0.06]",
  };

  const dotColor: Record<Variant, string> = {
    neutral: "bg-ink-tertiary",
    source: "bg-ink-tertiary",
    critical: "bg-[#B91C1C]",
    warning: "bg-[#92400E]",
    success: "bg-[#047857]",
    outline: "bg-ink-tertiary",
    inverse: "bg-white/40",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-[3px] font-mono text-[10px] tracking-[0.14em] uppercase",
        styles[variant],
        className
      )}
    >
      {dot && <span className={cn("h-1 w-1 rounded-full", dotColor[variant])} />}
      {children}
    </span>
  );
}
