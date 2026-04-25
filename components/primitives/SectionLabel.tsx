import { cn } from "@/lib/cn";

export function SectionLabel({
  children,
  className,
  inverse = false,
}: {
  children: React.ReactNode;
  className?: string;
  inverse?: boolean;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 font-mono text-[10.5px] tracking-[0.18em] uppercase",
        inverse ? "text-ink-on-inverse-muted" : "text-ink-secondary",
        className
      )}
    >
      <span
        aria-hidden
        className="h-px w-6"
        style={{ background: inverse ? "rgba(255,255,255,0.18)" : "var(--border-hairline)" }}
      />
      <span>{children}</span>
    </div>
  );
}
