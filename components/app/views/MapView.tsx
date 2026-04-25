"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useApp } from "../AppContext";
import { MapCanvas } from "@/components/primitives/MapCanvas";
import { MatchCard } from "@/components/primitives/MatchCard";
import { mapPins } from "@/lib/feed";
import { cn } from "@/lib/cn";
import {
  Filter,
  Layers,
  ShieldCheck,
  Activity,
  CloudLightning,
  RadioTower,
  Loader2,
  RefreshCw,
  Map as MapIcon,
  Satellite,
} from "lucide-react";

/**
 * Real Leaflet map. Loaded dynamically with ssr:false because Leaflet
 * touches `window` on import, which trips Next.js SSR.
 */
const LeafletMap = dynamic(() => import("../LeafletMap"), {
  ssr: false,
  loading: () => (
    <div
      className="rounded-2xl border border-on-inverse bg-[color:var(--bg-inverse-elevated)] flex items-center justify-center"
      style={{ minHeight: 520 }}
    >
      <span className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-on-inverse-muted inline-flex items-center gap-2">
        <Loader2 size={11} strokeWidth={1.6} className="animate-spin" />
        Loading map · CARTO dark tiles
      </span>
    </div>
  ),
});

type MapMode = "live" | "stylized";

export default function MapView({
  onOpenMatch,
}: {
  onOpenMatch: (matchId: string) => void;
}) {
  const { feed, matches, live, refreshLive } = useApp();
  const [mode, setMode] = useState<MapMode>("live");
  const [stylizedSelected, setStylizedSelected] = useState<string | undefined>("p-1");
  const [liveSelectedId, setLiveSelectedId] = useState<string | null>("match-sam-leo");

  const approvedIds = Object.values(matches)
    .filter((m) => m.status === "approved" || m.status === "messaging" || m.status === "active" || m.status === "complete")
    .map((m) => m.id);
  const blockedIds = Object.values(matches)
    .filter((m) => m.status === "blocked")
    .map((m) => m.id);

  // Stylized map detail
  const selectedPin = mapPins.find((p) => p.id === stylizedSelected);
  const stylizedFeed = selectedPin ? feed.find((f) => f.id === selectedPin.feedId) : null;
  const stylizedMatch = stylizedFeed?.matchId ? matches[stylizedFeed.matchId] : null;

  // Live map detail
  const liveMatch = liveSelectedId ? matches[liveSelectedId] : null;
  const liveFeed = liveSelectedId
    ? feed.find((f) => f.matchId === liveSelectedId)
    : null;

  const sidebarFeed = mode === "live" ? liveFeed : stylizedFeed;
  const sidebarMatch = mode === "live" ? liveMatch : stylizedMatch;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px]">
      <div className="p-4 lg:p-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-on-inverse-muted inline-flex items-center gap-2">
              <ShieldCheck size={12} strokeWidth={1.6} />
              Safety overlay · privacy-protected
            </span>
            <span aria-hidden className="h-3 w-px bg-white/10 hidden md:block" />
            <span className="hidden md:inline-flex font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-on-inverse-muted items-center gap-2">
              <RadioTower size={12} strokeWidth={1.6} />
              {live.requests.length} req · {live.providers.length} helpers · {live.matches.length} dispatches
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Map mode segmented control */}
            <div className="inline-flex items-center rounded-md border border-on-inverse overflow-hidden">
              <ModePill
                active={mode === "live"}
                onClick={() => setMode("live")}
                icon={<Satellite size={11} strokeWidth={1.6} />}
                label="Live"
              />
              <span aria-hidden className="h-7 w-px bg-on-inverse" />
              <ModePill
                active={mode === "stylized"}
                onClick={() => setMode("stylized")}
                icon={<MapIcon size={11} strokeWidth={1.6} />}
                label="Stylized"
              />
            </div>
            <button
              type="button"
              onClick={() => void refreshLive()}
              className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-on-inverse text-ink-on-inverse-muted hover:text-ink-on-inverse font-mono text-[10.5px] tracking-[0.14em] uppercase"
            >
              {live.status === "loading" ? (
                <Loader2 size={11} strokeWidth={1.6} className="animate-spin" />
              ) : (
                <RefreshCw size={11} strokeWidth={1.6} />
              )}
              Refresh
            </button>
            <button className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-on-inverse text-ink-on-inverse-muted font-mono text-[10.5px] tracking-[0.14em] uppercase">
              <Filter size={12} strokeWidth={1.6} /> Filters
            </button>
            <button className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-on-inverse text-ink-on-inverse-muted font-mono text-[10.5px] tracking-[0.14em] uppercase">
              <Layers size={12} strokeWidth={1.6} /> Zones
            </button>
          </div>
        </div>

        {mode === "live" ? (
          <LeafletMap
            selectedMatchId={liveSelectedId}
            onSelectMatch={setLiveSelectedId}
            onOpenMatch={onOpenMatch}
            height={520}
          />
        ) : (
          <MapCanvas
            feed={feed}
            inverse
            selectedPinId={stylizedSelected}
            onSelectPin={setStylizedSelected}
            approvedMatchIds={approvedIds}
            blockedMatchIds={blockedIds}
            height={520}
          />
        )}

        {/* Live backend strip — disaster + DB rows. Citizen-style band. */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <LivePanel
            icon={<CloudLightning size={12} strokeWidth={1.6} />}
            title="Live disasters · USGS + NWS"
            count={live.disasters.length}
            empty="No significant events in the feed window."
            items={live.disasters.slice(0, 4).map((d) => ({
              id: d.id,
              primary: d.title,
              meta: `${d.type === "earthquake" ? "Seismic" : "Weather"} · ${d.severity}`,
              tone: severityTone(d.severity),
            }))}
          />
          <LivePanel
            icon={<Activity size={12} strokeWidth={1.6} />}
            title="Persistent · SQLite (better-sqlite3)"
            count={live.requests.length + live.providers.length}
            empty="Use Compose → Register helper to add the first row."
            items={[
              ...live.requests.slice(0, 2).map((r) => ({
                id: `req-${r.id}`,
                primary: r.description.slice(0, 80),
                meta: `Need · ${r.type} · u${r.urgency ?? "?"}`,
                tone: "warn" as const,
              })),
              ...live.providers.slice(0, 2).map((p) => ({
                id: `prov-${p.id}`,
                primary: p.description.slice(0, 80),
                meta: `Helper · ${p.type} · ${p.status}`,
                tone: "ok" as const,
              })),
            ]}
          />
        </div>
      </div>

      <aside className="border-t lg:border-t-0 lg:border-l border-on-inverse p-4 lg:p-5 bg-[color:var(--bg-inverse)]">
        <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-on-inverse-muted mb-3">
          Pin detail
        </div>
        {sidebarFeed ? (
          <article className="rounded-2xl bg-inverse-elevated border border-on-inverse p-4 mb-4">
            <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-on-inverse-muted">
              {sidebarFeed.zone} · {sidebarFeed.kind.toUpperCase()}
            </div>
            <h4 className="mt-1 font-display text-[18px] leading-[1.1] text-ink-on-inverse" style={{ letterSpacing: "-0.02em", fontWeight: 500 }}>
              {sidebarFeed.title}
            </h4>
            <p className="mt-2 text-[12.5px] leading-[1.55] text-ink-on-inverse-muted">
              {sidebarFeed.body}
            </p>
            {sidebarFeed.privateAddressHidden && (
              <div className="mt-3 inline-flex items-center gap-1.5 font-mono text-[10.5px] tracking-[0.14em] uppercase text-ink-on-inverse-muted">
                Exact location hidden
              </div>
            )}
          </article>
        ) : (
          <div className="text-[12.5px] text-ink-on-inverse-muted">
            Tap a pin to see details. Private addresses are hidden until coordinator approval.
          </div>
        )}

        {sidebarMatch && (
          <MatchCard
            match={sidebarMatch}
            inverse
            onReview={() => onOpenMatch(sidebarMatch.id)}
            onChange={() => onOpenMatch(sidebarMatch.id)}
            onMore={() => onOpenMatch(sidebarMatch.id)}
            onBlock={() => onOpenMatch(sidebarMatch.id)}
          />
        )}
      </aside>
    </div>
  );
}

type Tone = "ok" | "warn" | "block";

function severityTone(severity: string): Tone {
  const s = severity.toLowerCase();
  if (s === "extreme" || s === "major") return "block";
  if (s === "severe" || s === "strong" || s === "moderate") return "warn";
  return "ok";
}

function ModePill({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 h-7 px-2.5 font-mono text-[10.5px] tracking-[0.14em] uppercase transition-colors",
        active
          ? "bg-white/[0.06] text-ink-on-inverse"
          : "text-ink-on-inverse-muted hover:text-ink-on-inverse hover:bg-white/[0.03]"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function LivePanel({
  icon,
  title,
  count,
  empty,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  empty: string;
  items: Array<{ id: string; primary: string; meta: string; tone: Tone }>;
}) {
  return (
    <div className="rounded-2xl bg-inverse-elevated border border-on-inverse overflow-hidden">
      <header className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-on-inverse">
        <span className="inline-flex items-center gap-2 font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-on-inverse-muted">
          {icon}
          {title}
        </span>
        <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-on-inverse-muted">
          {count}
        </span>
      </header>
      {items.length === 0 ? (
        <div className="px-4 py-3 text-[12px] text-ink-on-inverse-muted">{empty}</div>
      ) : (
        <ul>
          {items.map((it) => (
            <li
              key={it.id}
              className="px-4 py-2.5 flex items-start gap-3 border-b border-on-inverse last:border-0"
            >
              <span
                aria-hidden
                className={cn(
                  "mt-1.5 h-1.5 w-1.5 rounded-full shrink-0",
                  it.tone === "block"
                    ? "bg-[var(--signal-critical)]"
                    : it.tone === "warn"
                    ? "bg-[#F59E0B]"
                    : "bg-[var(--signal-success)]"
                )}
              />
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] text-ink-on-inverse leading-[1.4] line-clamp-2">
                  {it.primary || "—"}
                </div>
                <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-on-inverse-muted mt-1">
                  {it.meta}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
