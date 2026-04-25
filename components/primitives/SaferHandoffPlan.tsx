import { cn } from "@/lib/cn";
import { Match, handoffOptionLabels } from "@/lib/safety";
import { Check, Lock, Users, MessageSquare } from "lucide-react";

const stepCopy = [
  "Helper confirms availability and accepts handoff terms.",
  "Coordinator confirms request details and identity.",
  "Exact details shared only after approval.",
  "Handoff happens in the public location above.",
  "Both sides mark complete.",
];

export function SaferHandoffPlan({
  match,
  inverse = false,
  className,
}: {
  match: Match;
  inverse?: boolean;
  className?: string;
}) {
  return (
    <div
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
          "px-4 py-3 border-b flex items-center justify-between gap-3",
          inverse ? "border-on-inverse" : "border-hairline"
        )}
      >
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "font-mono text-[10.5px] tracking-[0.18em] uppercase",
              inverse ? "text-ink-on-inverse-muted" : "text-ink-tertiary"
            )}
          >
            Safer Handoff Plan
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full px-2 h-5 bg-[var(--signal-success)]/15 text-[var(--signal-success)] font-mono text-[10px] tracking-[0.14em] uppercase">
            <Lock size={10} strokeWidth={1.8} /> Privacy guard active
          </span>
        </div>
        <span
          className={cn(
            "font-mono text-[10px] tracking-[0.14em] uppercase",
            inverse ? "text-ink-on-inverse-muted" : "text-ink-tertiary"
          )}
        >
          {match.id.toUpperCase()}
        </span>
      </header>

      <div className="px-4 py-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-b" style={{ borderColor: inverse ? "var(--border-on-inverse)" : "var(--border-hairline)" }}>
        <div>
          <div className={cn("font-mono text-[10.5px] tracking-[0.18em] uppercase mb-1", inverse ? "text-ink-on-inverse-muted" : "text-ink-tertiary")}>
            Recommended meetup
          </div>
          <div className={cn("text-[14px] font-medium", inverse ? "text-ink-on-inverse" : "text-ink")}>
            {match.recommendedHandoff.location}
          </div>
          <div className={cn("text-[12.5px] leading-[1.55] mt-1", inverse ? "text-ink-on-inverse-muted" : "text-ink-secondary")}>
            {match.recommendedHandoff.rationale}
          </div>
        </div>
        <div>
          <div className={cn("font-mono text-[10.5px] tracking-[0.18em] uppercase mb-1", inverse ? "text-ink-on-inverse-muted" : "text-ink-tertiary")}>
            Privacy posture
          </div>
          <ul className={cn("space-y-1 text-[12.5px]", inverse ? "text-ink-on-inverse" : "text-ink")}>
            <li className="flex items-center gap-2"><Lock size={11} strokeWidth={1.6} className="text-ink-tertiary" /> Exact addresses hidden until approved.</li>
            <li className="flex items-center gap-2"><Users size={11} strokeWidth={1.6} className="text-ink-tertiary" /> Buddy / contact sharing suggested.</li>
            <li className="flex items-center gap-2"><MessageSquare size={11} strokeWidth={1.6} className="text-ink-tertiary" /> Coordinator brokers first message.</li>
          </ul>
        </div>
      </div>

      <ol className="px-4 py-4 space-y-2">
        {stepCopy.map((step, i) => (
          <li key={i} className="flex items-start gap-3">
            <span
              className={cn(
                "h-5 w-5 shrink-0 rounded-full inline-flex items-center justify-center font-mono text-[10px]",
                inverse ? "bg-white/[0.06] text-ink-on-inverse-muted" : "bg-muted text-ink-tertiary"
              )}
            >
              {i + 1}
            </span>
            <span className={cn("text-[13px] leading-[1.5]", inverse ? "text-ink-on-inverse" : "text-ink")}>
              {step}
            </span>
          </li>
        ))}
      </ol>

      <footer
        className={cn(
          "px-4 py-3 border-t flex flex-wrap gap-2",
          inverse ? "border-on-inverse" : "border-hairline"
        )}
      >
        {match.handoffOptions.map((opt) => (
          <span
            key={opt}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 h-7 font-mono text-[10.5px] tracking-[0.14em] uppercase",
              inverse
                ? "bg-white/[0.04] text-ink-on-inverse-muted"
                : "bg-muted text-ink-secondary"
            )}
          >
            <Check size={11} strokeWidth={1.8} />
            {handoffOptionLabels[opt]}
          </span>
        ))}
      </footer>
    </div>
  );
}
