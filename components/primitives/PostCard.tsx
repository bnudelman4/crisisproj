import { cn } from "@/lib/cn";
import { FeedItem } from "@/lib/feed";
import { Badge } from "./Badge";
import {
  HeartHandshake,
  HandHelping,
  Pin,
  Lock,
  MessageSquare,
  ChevronRight,
} from "lucide-react";

const kindLabel: Record<FeedItem["kind"], string> = {
  need: "Need",
  offer: "Offer",
  broadcast: "Broadcast",
  match: "Match",
  completed: "Completed",
  alert: "Alert",
};

const kindBadge: Record<FeedItem["kind"], "critical" | "warning" | "success" | "outline" | "neutral"> = {
  need: "critical",
  offer: "success",
  broadcast: "outline",
  match: "warning",
  completed: "success",
  alert: "warning",
};

export function PostCard({
  item,
  onOpenMatch,
  inverse = false,
  className,
}: {
  item: FeedItem;
  onOpenMatch?: (matchId: string) => void;
  inverse?: boolean;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "rounded-2xl overflow-hidden",
        inverse ? "bg-inverse-elevated border border-on-inverse" : "bg-elevated border border-hairline",
        className
      )}
    >
      <header className={cn("flex items-center gap-3 px-4 py-3 border-b", inverse ? "border-on-inverse" : "border-hairline")}>
        <span
          aria-hidden
          className={cn(
            "h-8 w-8 rounded-full inline-flex items-center justify-center font-mono text-[11px]",
            inverse ? "bg-white/[0.05] text-ink-on-inverse border border-on-inverse" : "bg-muted text-ink border border-hairline"
          )}
        >
          {item.author.initials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("text-[13px] font-medium", inverse ? "text-ink-on-inverse" : "text-ink")}>
              {item.author.name}
            </span>
            <Badge variant={kindBadge[item.kind]} dot>
              {kindLabel[item.kind]}
            </Badge>
            {item.urgency === "critical" && (
              <Badge variant="critical" dot>Critical</Badge>
            )}
            {item.reactions?.pinned && (
              <Badge variant={inverse ? "inverse" : "outline"} className="!font-mono">
                <Pin size={10} strokeWidth={1.8} /> Pinned
              </Badge>
            )}
          </div>
          <div className={cn("flex items-center gap-2 text-[11px] mt-0.5", inverse ? "text-ink-on-inverse-muted" : "text-ink-tertiary")}>
            <span className="font-mono uppercase tracking-[0.14em]">{item.zone}</span>
            <span aria-hidden>·</span>
            <span>{item.source}</span>
            <span aria-hidden>·</span>
            <span>{item.postedAt}</span>
          </div>
        </div>
      </header>

      <div className="px-4 py-4">
        <h3 className={cn("font-display text-[19px] leading-[1.1] mb-1", inverse ? "text-ink-on-inverse" : "text-ink")} style={{ letterSpacing: "-0.02em", fontWeight: 500 }}>
          {item.title}
        </h3>
        <p className={cn("text-[13.5px] leading-[1.55]", inverse ? "text-ink-on-inverse-muted" : "text-ink-secondary")}>
          {item.body}
        </p>

        {(item.privateAddressHidden || item.matchId) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {item.privateAddressHidden && (
              <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 h-6 font-mono text-[10px] tracking-[0.14em] uppercase", inverse ? "bg-white/[0.04] text-ink-on-inverse-muted" : "bg-muted text-ink-secondary")}>
                <Lock size={10} strokeWidth={1.8} /> Exact location hidden
              </span>
            )}
            {item.matchId && (
              <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 h-6 font-mono text-[10px] tracking-[0.14em] uppercase", inverse ? "bg-white/[0.04] text-ink-on-inverse-muted" : "bg-muted text-ink-secondary")}>
                Safety check required
              </span>
            )}
          </div>
        )}
      </div>

      <footer className={cn("flex items-center justify-between px-4 py-2.5 border-t", inverse ? "border-on-inverse" : "border-hairline")}>
        <div className={cn("flex items-center gap-3 text-[11.5px]", inverse ? "text-ink-on-inverse-muted" : "text-ink-secondary")}>
          {item.reactions?.care !== undefined && (
            <span className="inline-flex items-center gap-1.5">
              <HeartHandshake size={12} strokeWidth={1.6} /> {item.reactions.care}
            </span>
          )}
          {item.reactions?.help !== undefined && (
            <span className="inline-flex items-center gap-1.5">
              <HandHelping size={12} strokeWidth={1.6} /> {item.reactions.help}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <MessageSquare size={12} strokeWidth={1.6} /> Reply
          </span>
        </div>
        {item.matchId && (
          <button
            onClick={() => item.matchId && onOpenMatch?.(item.matchId)}
            className={cn("inline-flex items-center gap-1.5 rounded-full px-3 h-7 font-sans text-[11.5px] font-medium",
              inverse ? "bg-elevated text-ink" : "bg-[var(--accent)] text-[var(--text-on-inverse)] hover:bg-[var(--accent-emphasis)]"
            )}
          >
            Review match
            <ChevronRight size={12} strokeWidth={1.6} />
          </button>
        )}
      </footer>
    </article>
  );
}
