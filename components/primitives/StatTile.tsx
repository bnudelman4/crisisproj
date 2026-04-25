import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export function StatTile({
  label,
  value,
  delta,
  caption,
  inverse = false,
  accent,
  className,
}: {
  label: string;
  value: ReactNode;
  delta?: string;
  caption?: string;
  inverse?: boolean;
  accent?: "critical" | "success" | "neutral";
  className?: string;
}) {
  const accentColor =
    accent === "critical"
      ? "var(--signal-critical)"
      : accent === "success"
      ? "var(--signal-success)"
      : inverse
      ? "var(--text-on-inverse)"
      : "var(--text-primary)";

  return (
    <div
      className={cn(
        "rounded-xl p-4 flex flex-col gap-2 min-h-[110px]",
        inverse
          ? "bg-inverse-elevated border border-on-inverse"
          : "bg-elevated border border-hairline",
        className
      )}
    >
      <div
        className={cn(
          "font-mono text-[10px] tracking-[0.18em] uppercase",
          inverse ? "text-ink-on-inverse-muted" : "text-ink-tertiary"
        )}
      >
        {label}
      </div>
      <div
        className={cn(
          "font-display text-[28px] leading-[1] tracking-[-0.02em]"
        )}
        style={{ color: accentColor }}
      >
        {value}
      </div>
      <div className="flex items-center justify-between gap-2 mt-auto">
        {caption && (
          <span
            className={cn(
              "font-mono text-[10px] tracking-[0.14em] uppercase",
              inverse ? "text-ink-on-inverse-muted" : "text-ink-tertiary"
            )}
          >
            {caption}
          </span>
        )}
        {delta && (
          <span
            className={cn(
              "font-mono text-[10.5px] tracking-[0.14em] uppercase",
              inverse ? "text-ink-on-inverse" : "text-ink-secondary"
            )}
          >
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}
