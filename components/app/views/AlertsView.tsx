"use client";

import { useApp } from "../AppContext";
import { cn } from "@/lib/cn";
import {
  ShieldAlert,
  ShieldCheck,
  Ban,
  BellDot,
  ChevronRight,
  Activity,
  CloudLightning,
  Loader2,
  RefreshCw,
} from "lucide-react";
import type { DisasterEvent } from "@/lib/backend/disasters";

const toneIcon = {
  ok: ShieldCheck,
  warn: ShieldAlert,
  block: Ban,
};

const toneStyle = {
  ok: { bg: "bg-[var(--signal-success)]/15", text: "text-[var(--signal-success)]" },
  warn: { bg: "bg-[#F59E0B]/15", text: "text-[#F59E0B]" },
  block: { bg: "bg-[var(--signal-critical)]/15", text: "text-[var(--signal-critical)]" },
};

function severityTone(severity: string): "block" | "warn" | "ok" {
  const s = severity.toLowerCase();
  if (s === "extreme" || s === "major") return "block";
  if (s === "severe" || s === "strong" || s === "moderate") return "warn";
  return "ok";
}

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "—";
  const diff = Date.now() - t;
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

export default function AlertsView({
  onOpenMatch,
}: {
  onOpenMatch: (matchId: string) => void;
}) {
  const { alerts, live, refreshLive } = useApp();
  const disasterCount = live.disasters.length;
  const criticalCount =
    alerts.filter((a) => a.tone !== "ok").length +
    live.disasters.filter((d) => severityTone(d.severity) === "block").length;

  return (
    <div className="p-4 lg:p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <span className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-on-inverse-muted">
            Alerts · Live + coordinator inbox
          </span>
          <h2 className="mt-1 font-display text-[28px] leading-[1] text-ink-on-inverse" style={{ fontWeight: 500, letterSpacing: "-0.02em" }}>
            What needs eyes right now.
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-2 font-mono text-[10.5px] tracking-[0.14em] uppercase text-ink-on-inverse-muted">
            <BellDot size={12} strokeWidth={1.6} />
            {alerts.length + disasterCount} active · {criticalCount} need attention
          </span>
          <button
            type="button"
            onClick={() => void refreshLive()}
            className="inline-flex items-center gap-1.5 rounded-full h-8 px-3 border border-on-inverse text-ink-on-inverse-muted hover:text-ink-on-inverse hover:bg-white/[0.04] transition-colors font-mono text-[10.5px] tracking-[0.14em] uppercase"
          >
            {live.status === "loading" ? (
              <Loader2 size={11} strokeWidth={1.6} className="animate-spin" />
            ) : (
              <RefreshCw size={11} strokeWidth={1.6} />
            )}
            Refresh
          </button>
        </div>
      </div>

      {/* Live disasters band */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-on-inverse-muted inline-flex items-center gap-2">
            <CloudLightning size={12} strokeWidth={1.6} />
            Live disasters · USGS + NWS
            <span aria-hidden className="h-1 w-1 rounded-full bg-[var(--accent-emphasis)] animate-pulse-soft" />
          </div>
          <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-on-inverse-muted">
            {live.fetchedAt ? `Updated ${timeAgo(new Date(live.fetchedAt).toISOString())}` : "—"}
          </span>
        </div>

        {live.status === "error" ? (
          <div className="rounded-xl border border-[var(--signal-critical)]/30 bg-[var(--signal-critical)]/8 px-4 py-3 text-[12.5px] text-[var(--signal-critical)]">
            Could not reach the disaster feed: {live.error}
          </div>
        ) : disasterCount === 0 ? (
          <div className="rounded-xl border border-on-inverse bg-inverse-elevated px-4 py-4 text-[12.5px] text-ink-on-inverse-muted">
            No active significant disasters in the feed window. USGS reports
            earthquakes M≥4.5 over 7 days; NWS reports actual immediate /
            expected weather alerts.
          </div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {live.disasters.slice(0, 6).map((d) => (
              <DisasterCard key={d.id} d={d} />
            ))}
          </ul>
        )}
      </section>

      {/* Coordinator inbox */}
      <section>
        <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-on-inverse-muted mb-3 inline-flex items-center gap-2">
          <Activity size={12} strokeWidth={1.6} />
          Coordinator inbox
        </div>
        <ul className="space-y-2.5">
          {alerts.map((a) => {
            const Icon = toneIcon[a.tone];
            const tone = toneStyle[a.tone];
            return (
              <li
                key={a.id}
                className={cn(
                  "rounded-2xl border p-4 grid grid-cols-[36px_1fr_auto] gap-3 items-center bg-inverse-elevated",
                  "border-on-inverse"
                )}
              >
                <span className={cn("h-9 w-9 rounded-xl inline-flex items-center justify-center", tone.bg, tone.text)}>
                  <Icon size={15} strokeWidth={1.6} />
                </span>
                <div className="min-w-0">
                  <div className="text-[13.5px] font-medium text-ink-on-inverse">{a.title}</div>
                  <div className="text-[12px] text-ink-on-inverse-muted leading-[1.5] mt-0.5">{a.body}</div>
                  <div className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-ink-on-inverse-muted mt-1.5">
                    {a.postedAt}
                  </div>
                </div>
                {a.matchId ? (
                  <button
                    onClick={() => onOpenMatch(a.matchId!)}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 h-8 font-sans text-[12px] font-medium bg-elevated text-ink"
                  >
                    Review
                    <ChevronRight size={12} strokeWidth={1.6} />
                  </button>
                ) : (
                  <span className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-ink-on-inverse-muted">
                    Info
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function DisasterCard({ d }: { d: DisasterEvent }) {
  const tone = severityTone(d.severity);
  const toneClass =
    tone === "block"
      ? "bg-[var(--signal-critical)]/12 text-[var(--signal-critical)] border-[var(--signal-critical)]/30"
      : tone === "warn"
      ? "bg-[#F59E0B]/12 text-[#F59E0B] border-[#F59E0B]/30"
      : "bg-white/[0.04] text-ink-on-inverse-muted border-on-inverse";

  return (
    <li className="rounded-2xl border border-on-inverse bg-inverse-elevated p-4">
      <header className="flex items-center justify-between gap-3">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2 h-5 font-mono text-[10px] tracking-[0.14em] uppercase border",
            toneClass
          )}
        >
          <span className="h-1 w-1 rounded-full bg-current" />
          {d.type === "earthquake" ? "USGS · seismic" : "NWS · weather"}
        </span>
        <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-on-inverse-muted">
          {timeAgo(d.time)}
        </span>
      </header>
      <h4 className="mt-2 font-sans text-[13.5px] font-medium leading-[1.4] text-ink-on-inverse line-clamp-2">
        {d.title}
      </h4>
      <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-[10.5px] tracking-[0.14em] uppercase text-ink-on-inverse-muted">
        <span>Severity · {d.severity}</span>
        <span className="text-right">
          {d.lat.toFixed(2)}, {d.lng.toFixed(2)}
        </span>
      </div>
    </li>
  );
}
