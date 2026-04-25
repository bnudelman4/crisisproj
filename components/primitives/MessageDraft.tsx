import { cn } from "@/lib/cn";
import { Lock, ShieldCheck } from "lucide-react";

export function MessageDraft({
  to,
  body,
  inverse = false,
  className,
  meta,
}: {
  to: string;
  body: string;
  inverse?: boolean;
  className?: string;
  meta?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl overflow-hidden",
        inverse ? "bg-inverse-elevated border border-on-inverse" : "bg-elevated border border-hairline",
        className
      )}
    >
      <header className={cn("flex items-center justify-between gap-3 px-4 py-2.5 border-b", inverse ? "border-on-inverse" : "border-hairline")}>
        <div className="flex items-center gap-2">
          <span className={cn("font-mono text-[10.5px] tracking-[0.18em] uppercase", inverse ? "text-ink-on-inverse-muted" : "text-ink-tertiary")}>
            AI message draft · to {to}
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full px-2 h-5 bg-[var(--signal-success)]/15 text-[var(--signal-success)] font-mono text-[10px] tracking-[0.14em] uppercase">
          <Lock size={10} strokeWidth={1.8} /> Privacy guard
        </span>
      </header>
      <div className={cn("px-4 py-3 text-[13.5px] leading-[1.6]", inverse ? "text-ink-on-inverse" : "text-ink")}>
        {body}
      </div>
      <footer className={cn("px-4 py-2.5 border-t flex items-center justify-between gap-3", inverse ? "border-on-inverse" : "border-hairline")}>
        <span className={cn("font-mono text-[10.5px] tracking-[0.14em] uppercase inline-flex items-center gap-2", inverse ? "text-ink-on-inverse-muted" : "text-ink-tertiary")}>
          <ShieldCheck size={11} strokeWidth={1.6} /> Exact addresses hidden · sensitive details hidden
        </span>
        {meta && (
          <span className={cn("font-mono text-[10px] tracking-[0.14em] uppercase", inverse ? "text-ink-on-inverse-muted" : "text-ink-tertiary")}>
            {meta}
          </span>
        )}
      </footer>
    </div>
  );
}
