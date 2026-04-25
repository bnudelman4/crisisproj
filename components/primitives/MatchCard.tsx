"use client";

import { cn } from "@/lib/cn";
import {
  Match,
  safetyFlags,
  handoffOptionLabels,
} from "@/lib/safety";
import { useAuth } from "@/components/auth/AuthContext";
import { Badge } from "./Badge";
import { SafetyScoreRing } from "./SafetyScore";
import {
  Lock,
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
  Ban,
  HandHelping,
} from "lucide-react";

export function MatchCard({
  match,
  inverse = false,
  onReview,
  onApprove,
  onChange,
  onMore,
  onBlock,
  className,
}: {
  match: Match;
  inverse?: boolean;
  onReview?: () => void;
  onApprove?: () => void;
  onChange?: () => void;
  onMore?: () => void;
  onBlock?: () => void;
  className?: string;
}) {
  const { user } = useAuth();
  const isCoordinator = user?.role === "coordinator";
  const blocked = match.status === "blocked";
  const approved = match.status === "approved" || match.status === "messaging" || match.status === "active" || match.status === "complete";

  return (
    <article
      className={cn(
        "rounded-2xl overflow-hidden",
        inverse
          ? "bg-inverse-elevated border border-on-inverse"
          : "bg-elevated border border-hairline",
        blocked && "ring-1 ring-[var(--signal-critical)]/30",
        className
      )}
    >
      {/* Header strip — wraps gracefully in narrow rails */}
      <header
        className={cn(
          "flex items-start justify-between gap-2 flex-wrap px-4 py-3 border-b",
          inverse ? "border-on-inverse" : "border-hairline"
        )}
      >
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {match.bestMatch && !blocked && (
            <Badge variant={inverse ? "inverse" : "outline"} className="!font-mono">
              ★ Best match
            </Badge>
          )}
          {blocked ? (
            <Badge variant="critical" dot>
              Blocked
            </Badge>
          ) : approved ? (
            <Badge variant="success" dot>
              Safety plan approved
            </Badge>
          ) : (
            <Badge variant="warning" dot>
              Safety check required
            </Badge>
          )}
          <Badge variant={match.urgency === "critical" ? "critical" : match.urgency === "high" ? "warning" : "outline"} dot>
            {match.urgency}
          </Badge>
        </div>
        <span
          className={cn(
            "shrink-0 whitespace-nowrap font-mono text-[10px] tracking-[0.14em] uppercase",
            inverse ? "text-ink-on-inverse-muted" : "text-ink-tertiary"
          )}
        >
          T+ {match.postedAt}
        </span>
      </header>

      {/* Need + Helper — container query so the layout adapts to its parent
          width, not the viewport. In the dashboard's 360px right rail this
          keeps stacked; in the modal's 670px column it splits in two. */}
      <div className="@container">
        <div className="px-4 py-4 grid grid-cols-1 @[420px]:grid-cols-[1fr_1fr] gap-4">
          <div className="min-w-0">
            <div className={cn("font-mono text-[10.5px] tracking-[0.14em] uppercase mb-1.5", inverse ? "text-ink-on-inverse-muted" : "text-ink-tertiary")}>
              Need
            </div>
            <div className={cn("font-sans text-[14px] font-medium leading-[1.4]", inverse ? "text-ink-on-inverse" : "text-ink")}>
              {match.needTitle}
            </div>
            <div className={cn("mt-1 text-[12.5px] leading-[1.5]", inverse ? "text-ink-on-inverse-muted" : "text-ink-secondary")}>
              {match.needSummary}
            </div>
            <div className={cn("mt-2 flex items-center gap-1.5 flex-wrap font-mono text-[10.5px] tracking-[0.14em] uppercase", inverse ? "text-ink-on-inverse-muted" : "text-ink-tertiary")}>
              <span>{match.requester.initials}</span>
              <span aria-hidden>·</span>
              <span className="truncate">{match.requester.zone}</span>
              {match.requester.privateAddress && (
                <>
                  <span aria-hidden>·</span>
                  <span className="inline-flex items-center gap-1">
                    <Lock size={10} strokeWidth={1.6} /> Address hidden
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="min-w-0">
            <div className={cn("font-mono text-[10.5px] tracking-[0.14em] uppercase mb-1.5", inverse ? "text-ink-on-inverse-muted" : "text-ink-tertiary")}>
              Helper · {match.matchScore}% match
            </div>
            <div className={cn("font-sans text-[14px] font-medium leading-[1.4]", inverse ? "text-ink-on-inverse" : "text-ink")}>
              {match.helper.name}
            </div>
            <div className={cn("mt-1 text-[12.5px] leading-[1.5] break-words", inverse ? "text-ink-on-inverse-muted" : "text-ink-secondary")}>
              {match.helper.role} · {match.helper.distance} · {match.helper.availability}
            </div>
            <div className={cn("mt-2 flex items-center gap-2 flex-wrap font-mono text-[10.5px] tracking-[0.14em] uppercase", inverse ? "text-ink-on-inverse-muted" : "text-ink-tertiary")}>
              <span>Demo profile</span>
              <span aria-hidden>·</span>
              <span>Past assists {match.helper.pastAssists}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Safety strip — container query so the score ring + flags stack
          vertically when the card is in a narrow rail */}
      <div
        className={cn(
          "@container px-4 py-4 border-t grid grid-cols-1 @[420px]:grid-cols-[auto_1fr] gap-4 items-center",
          inverse ? "border-on-inverse bg-[color:var(--bg-inverse-elevated)]" : "border-hairline bg-muted/30"
        )}
      >
        <SafetyScoreRing score={match.matchScore < 100 ? Math.round((match.matchScore + (blocked ? 0 : 6)) / 2 + 30) : match.matchScore} inverse={inverse} />
        <div>
          <div className={cn("font-mono text-[10.5px] tracking-[0.18em] uppercase mb-1", inverse ? "text-ink-on-inverse-muted" : "text-ink-tertiary")}>
            Safety flags
          </div>
          {match.flags.length === 0 ? (
            <div className={cn("text-[12.5px]", inverse ? "text-ink-on-inverse-muted" : "text-ink-secondary")}>
              No active flags. Plan complies with default precautions.
            </div>
          ) : (
            <ul className="flex flex-wrap gap-1.5">
              {match.flags.map((id) => (
                <li key={id}>
                  <Badge
                    variant={inverse ? "inverse" : "outline"}
                    dot
                    className="!font-mono"
                  >
                    {safetyFlags[id].label}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
          {blocked && match.blockedReason && (
            <div className="mt-2 inline-flex items-center gap-2 text-[12px] font-mono tracking-[0.04em] uppercase text-[var(--signal-critical)]">
              <Ban size={13} strokeWidth={1.6} />
              {match.blockedReason}
            </div>
          )}
        </div>
      </div>

      {/* Recommended plan — container query so buttons stack below in narrow rails */}
      <div
        className={cn(
          "@container px-4 py-4 border-t grid grid-cols-1 @[460px]:grid-cols-[1fr_auto] gap-3 items-end",
          inverse ? "border-on-inverse" : "border-hairline"
        )}
      >
        <div>
          <div className={cn("font-mono text-[10.5px] tracking-[0.18em] uppercase mb-1", inverse ? "text-ink-on-inverse-muted" : "text-ink-tertiary")}>
            Recommended plan
          </div>
          <div className={cn("text-[13px] leading-[1.55]", inverse ? "text-ink-on-inverse" : "text-ink")}>
            {match.recommendedHandoff.location}
          </div>
          <div className={cn("text-[12px] leading-[1.5] mt-1", inverse ? "text-ink-on-inverse-muted" : "text-ink-secondary")}>
            {match.recommendedHandoff.rationale}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          {blocked ? (
            <button
              onClick={onMore}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 h-9 font-sans text-[12.5px] font-medium",
                inverse ? "bg-elevated text-ink" : "bg-[var(--accent)] text-[var(--text-on-inverse)]"
              )}
            >
              <ShieldAlert size={14} strokeWidth={1.6} />
              Request more info
            </button>
          ) : approved ? (
            <button
              onClick={onApprove}
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 h-9 font-sans text-[12.5px] font-medium bg-[var(--signal-success)]/15 text-[var(--signal-success)] border border-[var(--signal-success)]/30"
            >
              <ShieldCheck size={14} strokeWidth={1.6} />
              Plan approved
            </button>
          ) : isCoordinator ? (
            <>
              <button
                onClick={onChange}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 h-9 font-sans text-[12.5px] font-medium border transition-colors",
                  inverse
                    ? "border-on-inverse text-ink-on-inverse-muted hover:bg-white/5"
                    : "border-hairline text-ink-secondary hover:bg-muted"
                )}
              >
                Change location
              </button>
              <button
                onClick={onBlock}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 h-9 font-sans text-[12.5px] font-medium border transition-colors",
                  inverse
                    ? "border-on-inverse text-ink-on-inverse-muted hover:bg-white/5"
                    : "border-hairline text-ink-secondary hover:bg-muted"
                )}
              >
                Block
              </button>
              <button
                onClick={onReview}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3.5 h-9 font-sans text-[12.5px] font-medium",
                  inverse ? "bg-elevated text-ink hover:bg-canvas" : "bg-[var(--accent)] text-[var(--text-on-inverse)] hover:bg-[var(--accent-emphasis)]"
                )}
              >
                Review match
                <ArrowRight size={13} strokeWidth={1.6} />
              </button>
            </>
          ) : (
            // Member-side actions — single primary "offer to help" CTA + a
            // softer secondary that opens the same modal for read-through.
            <>
              <button
                onClick={onMore}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 h-9 font-sans text-[12.5px] font-medium border transition-colors",
                  inverse
                    ? "border-on-inverse text-ink-on-inverse-muted hover:bg-white/5"
                    : "border-hairline text-ink-secondary hover:bg-muted"
                )}
              >
                Ask coordinator
              </button>
              <button
                onClick={onReview}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3.5 h-9 font-sans text-[12.5px] font-medium",
                  inverse ? "bg-elevated text-ink hover:bg-canvas" : "bg-[var(--accent)] text-[var(--text-on-inverse)] hover:bg-[var(--accent-emphasis)]"
                )}
              >
                <HandHelping size={13} strokeWidth={1.8} />
                Offer to help
              </button>
            </>
          )}
        </div>
      </div>

      {/* Plan options strip */}
      {match.handoffOptions.length > 0 && (
        <div
          className={cn(
            "px-4 py-3 border-t flex flex-wrap gap-2",
            inverse ? "border-on-inverse" : "border-hairline"
          )}
        >
          {match.handoffOptions.map((opt) => (
            <span
              key={opt}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 h-7 font-mono text-[10.5px] tracking-[0.14em] uppercase border",
                inverse ? "border-on-inverse text-ink-on-inverse-muted" : "border-hairline text-ink-tertiary"
              )}
            >
              {handoffOptionLabels[opt]}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
