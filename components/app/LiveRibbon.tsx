"use client";

import { useApp } from "./AppContext";
import { cn } from "@/lib/cn";
import { CloudLightning, Loader2 } from "lucide-react";

/**
 * Citizen-style live status ribbon that sits at the top of the dashboard.
 * Compact, dense, urgent. Always visible; surfaces backend health
 * (last-fetched timestamp) and any active disasters in the feed.
 */
export function LiveRibbon({ onJumpToAlerts }: { onJumpToAlerts?: () => void }) {
  const { live } = useApp();
  const top = live.disasters[0];
  const tone = top ? severityTone(top.severity) : "ok";
  const label = top
    ? top.title
    : live.status === "loading"
    ? "Live feed warming up…"
    : "All quiet · USGS + NWS feeds healthy";

  const dotClass =
    tone === "block"
      ? "bg-[var(--signal-critical)]"
      : tone === "warn"
      ? "bg-[#F59E0B]"
      : "bg-[var(--signal-success)]";

  return (
    <button
      type="button"
      onClick={onJumpToAlerts}
      className={cn(
        "group relative w-full overflow-hidden",
        "flex items-center gap-3 px-4 py-2 border-b border-on-inverse text-left",
        "bg-[linear-gradient(90deg,rgba(91,141,239,0.08)_0%,rgba(0,0,0,0)_60%)]",
        "hover:bg-white/[0.02] transition-colors"
      )}
    >
      <span className="relative inline-flex h-1.5 w-1.5">
        <span className={cn("absolute inset-0 rounded-full", dotClass)} />
        <span className={cn("absolute inset-0 rounded-full animate-pulse-soft", dotClass)} />
      </span>
      <span className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-on-inverse">
        Live
      </span>
      <span aria-hidden className="h-3 w-px bg-white/10" />
      <span className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-ink-on-inverse-muted shrink-0 inline-flex items-center gap-1.5">
        <CloudLightning size={11} strokeWidth={1.6} />
        {live.disasters.length} disaster{live.disasters.length === 1 ? "" : "s"}
      </span>
      <span aria-hidden className="h-3 w-px bg-white/10" />
      <span className="text-[12px] text-ink-on-inverse truncate min-w-0 flex-1">
        {label}
      </span>
      <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-on-inverse-muted shrink-0 hidden sm:inline-flex items-center gap-1.5">
        {live.status === "loading" && (
          <Loader2 size={10} strokeWidth={1.6} className="animate-spin" />
        )}
        {live.fetchedAt
          ? `Updated ${secondsAgo(live.fetchedAt)}s ago`
          : "Connecting…"}
      </span>
    </button>
  );
}

function severityTone(severity: string): "block" | "warn" | "ok" {
  const s = severity.toLowerCase();
  if (s === "extreme" || s === "major") return "block";
  if (s === "severe" || s === "strong" || s === "moderate") return "warn";
  return "ok";
}

function secondsAgo(ms: number): number {
  return Math.max(0, Math.round((Date.now() - ms) / 1000));
}
