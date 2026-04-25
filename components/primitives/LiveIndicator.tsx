import { cn } from "@/lib/cn";

export function LiveIndicator({
  className,
  inverse = false,
  label = "LIVE",
}: {
  className?: string;
  inverse?: boolean;
  label?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 font-mono text-[10.5px] tracking-[0.18em]",
        inverse ? "text-ink-on-inverse-muted" : "text-ink-secondary",
        className
      )}
    >
      <span className="relative inline-flex h-1.5 w-1.5">
        <span
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: "var(--accent-emphasis)" }}
        />
        <span
          className="absolute inset-0 rounded-full animate-pulse-soft"
          style={{ backgroundColor: "var(--accent-emphasis)" }}
        />
      </span>
      <span>{label}</span>
    </div>
  );
}
