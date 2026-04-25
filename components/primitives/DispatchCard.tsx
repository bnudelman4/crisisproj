import { cn } from "@/lib/cn";
import { Badge } from "./Badge";
import { Check, AlertTriangle } from "lucide-react";

type ScoreRow = { label: string; value: number; weight: number };

export function DispatchCard({
  className,
  inverse = false,
  approved = false,
}: {
  className?: string;
  inverse?: boolean;
  approved?: boolean;
}) {
  const scores: ScoreRow[] = [
    { label: "Urgency", value: 0.92, weight: 0.4 },
    { label: "Proximity", value: 0.78, weight: 0.25 },
    { label: "Capability match", value: 0.84, weight: 0.2 },
    { label: "Helper reliability", value: 0.71, weight: 0.15 },
  ];

  const composite = scores.reduce((acc, r) => acc + r.value * r.weight, 0);

  return (
    <article
      className={cn(
        "rounded-2xl overflow-hidden",
        inverse
          ? "bg-inverse-elevated border border-on-inverse"
          : "bg-elevated border border-hairline",
        className
      )}
    >
      <header
        className={cn(
          "flex items-center justify-between gap-3 px-4 py-3 border-b",
          inverse ? "border-on-inverse" : "border-hairline"
        )}
      >
        <div className="flex items-center gap-2">
          <Badge variant={inverse ? "inverse" : "outline"} className="!font-mono">
            DISPATCH-0142
          </Badge>
          <Badge variant="critical" dot>
            Critical
          </Badge>
        </div>
        <span
          className={cn(
            "font-mono text-[10px] tracking-[0.14em] uppercase",
            inverse ? "text-ink-on-inverse-muted" : "text-ink-tertiary"
          )}
        >
          T+ 00:42
        </span>
      </header>

      <div className="px-4 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div
            className={cn(
              "font-mono text-[10.5px] tracking-[0.14em] uppercase mb-1.5",
              inverse ? "text-ink-on-inverse-muted" : "text-ink-tertiary"
            )}
          >
            Need
          </div>
          <div className={cn("font-sans text-[13.5px] leading-[1.5]", inverse ? "text-ink-on-inverse" : "text-ink")}>
            Insulin delivery — Sam K., Mews Hall 312
          </div>
          <div
            className={cn(
              "mt-1 font-mono text-[10.5px] tracking-[0.14em] uppercase",
              inverse ? "text-ink-on-inverse-muted" : "text-ink-tertiary"
            )}
          >
            North Campus · Power outage
          </div>
        </div>
        <div>
          <div
            className={cn(
              "font-mono text-[10.5px] tracking-[0.14em] uppercase mb-1.5",
              inverse ? "text-ink-on-inverse-muted" : "text-ink-tertiary"
            )}
          >
            Helper
          </div>
          <div className={cn("font-sans text-[13.5px] leading-[1.5]", inverse ? "text-ink-on-inverse" : "text-ink")}>
            Leo M. — vehicle, available 2–5pm
          </div>
          <div
            className={cn(
              "mt-1 font-mono text-[10.5px] tracking-[0.14em] uppercase",
              inverse ? "text-ink-on-inverse-muted" : "text-ink-tertiary"
            )}
          >
            Collegetown · 1.4mi · Verified
          </div>
        </div>
      </div>

      <div
        className={cn(
          "px-4 py-4 border-t grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end",
          inverse ? "border-on-inverse" : "border-hairline"
        )}
      >
        <div className="space-y-2">
          <div
            className={cn(
              "font-mono text-[10.5px] tracking-[0.14em] uppercase",
              inverse ? "text-ink-on-inverse-muted" : "text-ink-tertiary"
            )}
          >
            Score breakdown · composite {composite.toFixed(2)}
          </div>
          <ul className="space-y-1.5">
            {scores.map((row) => (
              <li key={row.label} className="grid grid-cols-[120px_1fr_44px] items-center gap-3">
                <span
                  className={cn(
                    "font-sans text-[12px]",
                    inverse ? "text-ink-on-inverse" : "text-ink-secondary"
                  )}
                >
                  {row.label}
                </span>
                <span
                  className={cn(
                    "h-1 rounded-full overflow-hidden",
                    inverse ? "bg-white/[0.06]" : "bg-muted"
                  )}
                >
                  <span
                    className="block h-full"
                    style={{
                      width: `${row.value * 100}%`,
                      background: inverse ? "var(--text-on-inverse)" : "var(--accent)",
                    }}
                  />
                </span>
                <span
                  className={cn(
                    "text-right font-mono text-[11px]",
                    inverse ? "text-ink-on-inverse-muted" : "text-ink-tertiary"
                  )}
                >
                  ×{row.weight.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center gap-2">
          <button
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 h-8 font-sans text-[12px] font-medium border transition-colors",
              inverse
                ? "border-on-inverse text-ink-on-inverse-muted hover:bg-white/5"
                : "border-hairline text-ink-secondary hover:bg-muted"
            )}
          >
            <AlertTriangle size={13} strokeWidth={1.6} />
            Hold
          </button>
          <button
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3.5 h-8 font-sans text-[12px] font-medium",
              approved
                ? "bg-[var(--signal-success)]/15 text-[var(--signal-success)] border border-[var(--signal-success)]/30"
                : inverse
                ? "bg-elevated text-ink"
                : "bg-[var(--accent)] text-[var(--text-on-inverse)]"
            )}
          >
            <Check size={13} strokeWidth={1.8} />
            {approved ? "Dispatched" : "Approve dispatch"}
          </button>
        </div>
      </div>
    </article>
  );
}
