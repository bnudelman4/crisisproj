import { cn } from "@/lib/cn";
import type { SampleMessage } from "@/lib/sample-messages";
import { sourceLabel } from "@/lib/sample-messages";
import { Badge } from "./Badge";

export function MessageCard({
  message,
  className,
  inverse = false,
  highlight,
}: {
  message: SampleMessage;
  className?: string;
  inverse?: boolean;
  highlight?: "critical" | "warning" | "success" | null;
}) {
  return (
    <article
      className={cn(
        "group relative rounded-2xl p-4 transition-colors",
        inverse
          ? "bg-inverse-card border border-on-inverse"
          : "bg-elevated border border-hairline",
        className
      )}
    >
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Badge variant={inverse ? "inverse" : "source"} dot>
            {sourceLabel[message.source]}
          </Badge>
          <span
            className={cn(
              "truncate font-sans text-[12.5px] font-medium",
              inverse ? "text-ink-on-inverse" : "text-ink"
            )}
          >
            {message.sender}
          </span>
        </div>
        <span
          className={cn(
            "shrink-0 font-mono text-[10px] tracking-[0.14em] uppercase",
            inverse ? "text-ink-on-inverse-muted" : "text-ink-tertiary"
          )}
        >
          {message.timestamp}
        </span>
      </header>
      <p
        className={cn(
          "mt-3 font-sans text-[13.5px] leading-[1.55]",
          inverse ? "text-ink-on-inverse/90" : "text-ink"
        )}
      >
        {message.text}
      </p>
      <footer
        className={cn(
          "mt-3 flex items-center justify-between gap-3 font-mono text-[10.5px] tracking-[0.14em] uppercase",
          inverse ? "text-ink-on-inverse-muted" : "text-ink-tertiary"
        )}
      >
        <span className="truncate">{message.contact}</span>
        {highlight && (
          <Badge
            variant={highlight}
            dot
            className="!font-mono"
          >
            {highlight === "critical" ? "Critical" : highlight === "warning" ? "Review" : "Matched"}
          </Badge>
        )}
      </footer>
    </article>
  );
}
