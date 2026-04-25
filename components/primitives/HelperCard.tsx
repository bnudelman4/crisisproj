import { cn } from "@/lib/cn";
import { Match } from "@/lib/safety";
import { Phone, Info } from "lucide-react";

export function HelperCard({
  helper,
  inverse = false,
  className,
}: {
  helper: Match["helper"];
  inverse?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl p-4",
        inverse ? "bg-inverse-elevated border border-on-inverse" : "bg-elevated border border-hairline",
        className
      )}
    >
      <header className="flex items-center gap-3">
        <span
          aria-hidden
          className={cn(
            "h-9 w-9 rounded-full inline-flex items-center justify-center font-mono text-[12px]",
            inverse
              ? "bg-white/[0.05] text-ink-on-inverse border border-on-inverse"
              : "bg-muted text-ink border border-hairline"
          )}
        >
          {helper.initials}
        </span>
        <div className="min-w-0">
          <div className={cn("text-[13.5px] font-medium leading-tight", inverse ? "text-ink-on-inverse" : "text-ink")}>
            {helper.name}
          </div>
          <div className={cn("text-[11.5px] leading-tight mt-0.5", inverse ? "text-ink-on-inverse-muted" : "text-ink-secondary")}>
            {helper.role} · {helper.distance} · {helper.availability}
          </div>
        </div>
      </header>
      <div className={cn("mt-4 grid grid-cols-2 gap-3 text-[11.5px]", inverse ? "text-ink-on-inverse-muted" : "text-ink-secondary")}>
        <div>
          <div className={cn("font-mono text-[10.5px] tracking-[0.18em] uppercase", inverse ? "text-ink-on-inverse-muted" : "text-ink-tertiary")}>
            Verification
          </div>
          <div className="mt-1">Demo profile</div>
          <div className="mt-0.5 inline-flex items-center gap-1.5">
            <Phone size={10} strokeWidth={1.6} /> Phone confirmed: simulated
          </div>
        </div>
        <div>
          <div className={cn("font-mono text-[10.5px] tracking-[0.18em] uppercase", inverse ? "text-ink-on-inverse-muted" : "text-ink-tertiary")}>
            Past assists
          </div>
          <div className="mt-1">{helper.pastAssists} completed</div>
          <div className="mt-0.5">Status: {helper.availability}</div>
        </div>
      </div>
      <div className={cn("mt-3 inline-flex items-center gap-2 text-[11px]", inverse ? "text-ink-on-inverse-muted" : "text-ink-tertiary")}>
        <Info size={11} strokeWidth={1.6} />
        Identity verification is simulated in this demo.
      </div>
    </div>
  );
}
