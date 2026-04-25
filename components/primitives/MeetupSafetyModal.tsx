"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Match,
  bandFor,
  meetupLocationOptions,
  safetyFlags,
} from "@/lib/safety";
import { SafetyScoreRing } from "./SafetyScore";
import { cn } from "@/lib/cn";
import {
  X,
  Lock,
  ShieldCheck,
  ShieldAlert,
  Ban,
  Check,
  Info,
} from "lucide-react";

export type ModalAction =
  | "approve"
  | "request-info"
  | "change-location"
  | "block"
  | "close";

export function MeetupSafetyModal({
  open,
  match,
  onAction,
}: {
  open: boolean;
  match: Match | null;
  onAction: (a: ModalAction, payload?: unknown) => void;
}) {
  const [chosen, setChosen] = useState<string>(meetupLocationOptions[0].id);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onAction("close");
    };
    window.addEventListener("keydown", onKey);

    // Lock body scroll while modal is open. The modal itself uses
    // `data-lenis-prevent` so Lenis lets its overflow-y-auto handle wheel
    // events natively; this just ensures the page doesn't scroll behind.
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [open, onAction]);

  return (
    <AnimatePresence>
      {open && match && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
            onClick={() => onAction("close")}
          />
          <motion.div
            role="dialog"
            aria-modal
            aria-labelledby="safety-modal-title"
            data-lenis-prevent
            initial={{ opacity: 0, y: 14, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.985 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto overscroll-contain rounded-2xl bg-canvas border border-hairline shadow-[0_30px_120px_-30px_rgba(0,0,0,0.5)]"
          >
            <ModalContent
              match={match}
              chosen={chosen}
              setChosen={setChosen}
              onAction={onAction}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ModalContent({
  match,
  chosen,
  setChosen,
  onAction,
}: {
  match: Match;
  chosen: string;
  setChosen: (id: string) => void;
  onAction: (a: ModalAction, payload?: unknown) => void;
}) {
  const blocked = match.status === "blocked";
  const safetyDisplay = blocked
    ? Math.max(28, match.matchScore - 40)
    : Math.round((match.matchScore + 6) / 2 + 30);
  const band = bandFor(safetyDisplay);

  return (
    <div>
      <header className="flex items-start justify-between gap-3 px-6 pt-6 pb-4 border-b border-hairline">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
            <ShieldAlert size={16} strokeWidth={1.6} className="text-ink" />
          </span>
          <div>
            <span className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-tertiary">
              Meetup Safety Check · {match.id.toUpperCase()}
            </span>
            <h2 id="safety-modal-title" className="mt-1 font-display text-[24px] leading-[1.05] text-ink" style={{ letterSpacing: "-0.02em", fontWeight: 500 }}>
              {blocked
                ? "We can't approve this match yet."
                : "Review the meetup safety plan before messaging."}
            </h2>
            <p className="mt-1.5 text-[13px] leading-[1.55] text-ink-secondary max-w-[60ch]">
              CrisisMesh does not encourage strangers to meet blindly. Matches
              include a meetup safety check, privacy protection, public-handoff
              suggestions, and human approval before sensitive details are shared.
            </p>
          </div>
        </div>
        <button
          aria-label="Close"
          onClick={() => onAction("close")}
          className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted text-ink-tertiary"
        >
          <X size={16} strokeWidth={1.6} />
        </button>
      </header>

      {/* Risk row */}
      <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-[auto_1fr] gap-5 items-center border-b border-hairline">
        <SafetyScoreRing score={safetyDisplay} size={84} />
        <div>
          <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-tertiary mb-1">
            Risk level
          </div>
          <div className="text-[15px] font-medium text-ink">{band.label}</div>
          <div className="text-[12.5px] leading-[1.55] text-ink-secondary mt-1 max-w-[52ch]">
            {band.description}
          </div>
        </div>
      </div>

      {/* Detected risks */}
      <section className="px-6 py-5 border-b border-hairline">
        <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-tertiary mb-3">
          Detected risks
        </div>
        {match.flags.length === 0 ? (
          <div className="flex items-center gap-2 text-[13px] text-ink-secondary">
            <Check size={13} strokeWidth={1.6} className="text-[var(--signal-success)]" />
            No active flags. Proceed with default precautions.
          </div>
        ) : (
          <ul className="space-y-2">
            {match.flags.map((id) => {
              const f = safetyFlags[id];
              return (
                <li
                  key={id}
                  className="grid grid-cols-[24px_1fr] gap-3 items-start"
                >
                  <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--signal-critical)]/12 text-[var(--signal-critical)]">
                    <ShieldAlert size={11} strokeWidth={1.8} />
                  </span>
                  <div>
                    <div className="text-[13.5px] font-medium text-ink">
                      {f.label}
                    </div>
                    <div className="text-[12.5px] text-ink-secondary leading-[1.5] mt-0.5">
                      <span className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-ink-tertiary mr-2">
                        Risk
                      </span>
                      {f.risk}
                    </div>
                    <div className="text-[12.5px] text-ink leading-[1.5] mt-1">
                      <span className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-ink-tertiary mr-2">
                        Action
                      </span>
                      {f.action}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Required precautions */}
      <section className="px-6 py-5 border-b border-hairline">
        <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-tertiary mb-3">
          Required precautions
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            "Use a public handoff location",
            "Keep exact address hidden until approved",
            "Confirm both sides understand the plan",
            "Share coordinator contact",
            "Mark complete after handoff",
          ].map((line) => (
            <li
              key={line}
              className="flex items-center gap-2 text-[13px] text-ink"
            >
              <Check size={13} strokeWidth={1.6} className="text-[var(--signal-success)]" />
              {line}
            </li>
          ))}
        </ul>
      </section>

      {/* Choose safer meetup point */}
      <section className="px-6 py-5 border-b border-hairline">
        <div className="flex items-center justify-between mb-3">
          <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-tertiary">
            Choose safer meetup point
          </div>
          <span className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-ink-tertiary inline-flex items-center gap-1.5">
            <Info size={11} strokeWidth={1.6} /> Recommended: public, visible, easy to find
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {meetupLocationOptions.map((opt) => {
            const active = chosen === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setChosen(opt.id)}
                className={cn(
                  "rounded-xl border p-3 text-left transition-colors flex items-start gap-3",
                  active
                    ? "border-[var(--accent)] bg-elevated"
                    : "border-hairline hover:border-[var(--border-strong)] bg-elevated"
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "mt-0.5 h-4 w-4 rounded-full border inline-flex items-center justify-center",
                    active ? "bg-[var(--accent)] border-[var(--accent)]" : "border-hairline"
                  )}
                >
                  {active && (
                    <Check size={10} strokeWidth={2.4} className="text-[var(--text-on-inverse)]" />
                  )}
                </span>
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-ink">{opt.label}</div>
                  <div className="text-[11.5px] text-ink-secondary mt-0.5">
                    {opt.note}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        {match.requester.privateAddress && (
          <p className="mt-3 inline-flex items-center gap-2 text-[12px] text-ink-secondary">
            <Lock size={12} strokeWidth={1.6} />
            Exact private addresses are hidden until the coordinator approves
            sharing.
          </p>
        )}
      </section>

      {/* Footer */}
      <footer className="px-6 py-4 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <span className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-ink-tertiary inline-flex items-center gap-2">
          <Lock size={11} strokeWidth={1.6} />
          Privacy guard active · sensitive details hidden
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onAction("request-info")}
            className="inline-flex items-center gap-1.5 rounded-full px-3 h-9 text-[12.5px] font-medium border border-hairline text-ink-secondary hover:bg-muted"
          >
            Request more info
          </button>
          <button
            onClick={() => onAction("change-location", chosen)}
            className="inline-flex items-center gap-1.5 rounded-full px-3 h-9 text-[12.5px] font-medium border border-hairline text-ink-secondary hover:bg-muted"
          >
            Change location
          </button>
          <button
            onClick={() => onAction("block")}
            className="inline-flex items-center gap-1.5 rounded-full px-3 h-9 text-[12.5px] font-medium border border-[var(--signal-critical)]/30 text-[var(--signal-critical)] hover:bg-[var(--signal-critical)]/8"
          >
            <Ban size={13} strokeWidth={1.6} />
            Block match
          </button>
          {!blocked && (
            <button
              onClick={() => onAction("approve", chosen)}
              className="inline-flex items-center gap-1.5 rounded-full px-4 h-9 text-[12.5px] font-medium bg-[var(--accent)] text-[var(--text-on-inverse)] hover:bg-[var(--accent-emphasis)]"
            >
              <ShieldCheck size={13} strokeWidth={1.6} />
              Approve safety plan
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
