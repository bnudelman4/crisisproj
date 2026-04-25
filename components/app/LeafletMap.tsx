"use client";

import {
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { useEffect, useMemo, useRef } from "react";
import { useApp } from "./AppContext";
import { Match, sampleMatches, DEMO_GEO } from "@/lib/safety";
import type { DisasterEvent } from "@/lib/backend/disasters";

const DEFAULT_CENTER: [number, number] = [DEMO_GEO.default.lat, DEMO_GEO.default.lng];
const DEFAULT_ZOOM = 13;

/**
 * Carto's Dark Matter tiles — free, no API key, on-brand for the editorial
 * dispatch aesthetic. Subdomains rotate via {s}; @2x retina-aware.
 */
const TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const TILE_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

type Props = {
  selectedMatchId?: string | null;
  onSelectMatch?: (id: string | null) => void;
  onOpenMatch?: (id: string) => void;
  height?: number;
};

export default function LeafletMap({
  selectedMatchId,
  onSelectMatch,
  onOpenMatch,
  height = 520,
}: Props) {
  const { matches, live } = useApp();

  // Pull seeded matches with coordinates so the demo flow always has pins
  // even before the SQLite store has registered users.
  const seedMatches = useMemo(
    () => sampleMatches.filter((m) => m.needCoord || m.helperCoord),
    []
  );

  // Active matches from AppContext (could be approved/blocked Sam ↔ Leo etc)
  const activeMatches = useMemo(() => Object.values(matches), [matches]);

  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-on-inverse"
      style={{ minHeight: height }}
    >
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom
        style={{ height, width: "100%", background: "#000" }}
        attributionControl={false}
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTR} maxZoom={19} />
        <FitToBounds matches={activeMatches} disasters={live.disasters} />

        {/* Seeded match pairs — need + helper + dashed suggestion line */}
        {seedMatches.map((m) => {
          const liveMatch = matches[m.id] ?? m;
          return (
            <MatchLayer
              key={m.id}
              match={liveMatch}
              isSelected={selectedMatchId === m.id}
              onSelect={() => onSelectMatch?.(m.id)}
              onOpen={() => onOpenMatch?.(m.id)}
            />
          );
        })}

        {/* SQLite-backed live requests / providers */}
        {live.requests.map((r) => (
          <CircleMarker
            key={`req-${r.id}`}
            center={[r.lat, r.lng]}
            radius={6}
            pathOptions={{
              color: "#EF4444",
              fillColor: "#EF4444",
              fillOpacity: 0.55,
              weight: 1.5,
            }}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
              <span className="text-[11px] font-mono uppercase tracking-[0.14em]">
                Need · {r.type}
              </span>
            </Tooltip>
          </CircleMarker>
        ))}
        {live.providers.map((p) => (
          <CircleMarker
            key={`prov-${p.id}`}
            center={[p.lat, p.lng]}
            radius={6}
            pathOptions={{
              color: "#10B981",
              fillColor: "#10B981",
              fillOpacity: 0.55,
              weight: 1.5,
            }}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
              <span className="text-[11px] font-mono uppercase tracking-[0.14em]">
                Helper · {p.type}
              </span>
            </Tooltip>
          </CircleMarker>
        ))}

        {/* Live disasters (USGS earthquakes + NWS alerts) */}
        {live.disasters.map((d) => (
          <DisasterPulse key={d.id} d={d} />
        ))}
      </MapContainer>

      {/* Brand chrome over the map — keeps Citizen × Apple feel */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-14 z-[400]"
        style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0))" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-12 z-[400]"
        style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.55), rgba(0,0,0,0))" }}
      />
      <div className="absolute left-3 bottom-3 z-[500] flex flex-wrap gap-2 font-mono text-[10px] tracking-[0.14em] uppercase">
        <Legend dot="#EF4444" label="Need" />
        <Legend dot="#10B981" label="Helper" />
        <Legend dot="#5B8DEF" label="Approved match" />
        <Legend dot="#F59E0B" label="Disaster" />
      </div>
      <div className="absolute right-3 bottom-3 z-[500] font-mono text-[10px] tracking-[0.14em] uppercase text-white/55 bg-black/55 backdrop-blur-md rounded-md px-2 py-1">
        © OpenStreetMap · CARTO
      </div>
    </div>
  );
}

function MatchLayer({
  match,
  isSelected,
  onSelect,
  onOpen,
}: {
  match: Match;
  isSelected: boolean;
  onSelect: () => void;
  onOpen: () => void;
}) {
  const need = match.needCoord;
  const helper = match.helperCoord;
  const handoff = match.handoffCoord;
  if (!need && !helper) return null;

  const status = match.status;
  const lineColor =
    status === "blocked"
      ? "#EF4444"
      : status === "approved" || status === "messaging" || status === "active" || status === "complete"
      ? "#5B8DEF"
      : "#5B8DEF";
  const lineDash = status === "blocked"
    ? "6 6"
    : status === "approved" || status === "active" || status === "complete"
    ? undefined
    : "4 6";

  return (
    <>
      {need && helper && (
        <Polyline
          positions={[
            [need.lat, need.lng],
            ...(handoff ? [[handoff.lat, handoff.lng] as [number, number]] : []),
            [helper.lat, helper.lng],
          ]}
          pathOptions={{
            color: lineColor,
            opacity: status === "blocked" ? 0.85 : 0.6,
            weight: status === "blocked" ? 2.5 : 2,
            dashArray: lineDash,
          }}
        />
      )}
      {need && (
        <CircleMarker
          center={[need.lat, need.lng]}
          radius={isSelected ? 10 : 8}
          pathOptions={{
            color: status === "blocked" ? "#EF4444" : "#EF4444",
            fillColor: status === "blocked" ? "#EF4444" : "#EF4444",
            fillOpacity: 0.85,
            weight: isSelected ? 3 : 2,
          }}
          eventHandlers={{ click: onSelect }}
        >
          <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
            <span className="text-[11px] font-mono uppercase tracking-[0.14em]">
              {match.needTitle.slice(0, 36)}
            </span>
          </Tooltip>
          <Popup className="cm-popup">
            <MatchPopup match={match} onOpen={onOpen} />
          </Popup>
        </CircleMarker>
      )}
      {helper && (
        <CircleMarker
          center={[helper.lat, helper.lng]}
          radius={isSelected ? 9 : 7}
          pathOptions={{
            color: "#10B981",
            fillColor: "#10B981",
            fillOpacity: 0.78,
            weight: isSelected ? 3 : 2,
          }}
          eventHandlers={{ click: onSelect }}
        >
          <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
            <span className="text-[11px] font-mono uppercase tracking-[0.14em]">
              Helper · {match.helper.name}
            </span>
          </Tooltip>
        </CircleMarker>
      )}
      {handoff && (
        <CircleMarker
          center={[handoff.lat, handoff.lng]}
          radius={isSelected ? 7 : 5}
          pathOptions={{
            color: "#5B8DEF",
            fillColor: "#5B8DEF",
            fillOpacity: 0.6,
            weight: 2,
            dashArray: "2 3",
          }}
        >
          <Tooltip direction="top" offset={[0, -6]} opacity={0.95}>
            <span className="text-[11px] font-mono uppercase tracking-[0.14em]">
              Public handoff · {match.recommendedHandoff.location.split("(")[0].trim()}
            </span>
          </Tooltip>
        </CircleMarker>
      )}
    </>
  );
}

function DisasterPulse({ d }: { d: DisasterEvent }) {
  const tone = severityTone(d.severity);
  const color =
    tone === "block" ? "#EF4444" : tone === "warn" ? "#F59E0B" : "#9CA3AF";
  return (
    <>
      <CircleMarker
        center={[d.lat, d.lng]}
        radius={tone === "block" ? 14 : 10}
        pathOptions={{
          color,
          fillColor: color,
          fillOpacity: 0.18,
          weight: 1.5,
        }}
      />
      <CircleMarker
        center={[d.lat, d.lng]}
        radius={4}
        pathOptions={{ color, fillColor: color, fillOpacity: 0.95, weight: 1 }}
      >
        <Tooltip direction="top" offset={[0, -6]} opacity={0.95}>
          <span className="text-[11px] font-mono uppercase tracking-[0.14em]">
            {d.type === "earthquake" ? "USGS" : "NWS"} · {d.severity}
          </span>
        </Tooltip>
        <Popup className="cm-popup">
          <div className="font-sans text-[12.5px] leading-[1.5] max-w-[280px]">
            <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-zinc-500">
              {d.type === "earthquake" ? "USGS · seismic" : "NWS · weather"} · {d.severity}
            </div>
            <div className="mt-1 font-medium">{d.title}</div>
            <div className="mt-1 text-zinc-500 text-[11px]">
              {new Date(d.time).toLocaleString()}
            </div>
          </div>
        </Popup>
      </CircleMarker>
    </>
  );
}

function MatchPopup({ match, onOpen }: { match: Match; onOpen: () => void }) {
  return (
    <div className="font-sans text-[12.5px] leading-[1.5] max-w-[260px]">
      <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-zinc-500">
        {match.urgency.toUpperCase()} · {match.needCategory}
      </div>
      <div className="mt-1 font-medium">{match.needTitle}</div>
      <div className="mt-1 text-zinc-500 text-[11px]">
        Helper · {match.helper.name}
      </div>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center gap-1 rounded-full px-2.5 h-7 text-[11px] font-medium bg-black text-white"
        >
          Review match
        </button>
      </div>
    </div>
  );
}

function FitToBounds({
  matches,
  disasters,
}: {
  matches: Match[];
  disasters: DisasterEvent[];
}) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (fitted.current) return;
    const points: [number, number][] = [];
    for (const m of matches) {
      if (m.needCoord) points.push([m.needCoord.lat, m.needCoord.lng]);
      if (m.helperCoord) points.push([m.helperCoord.lat, m.helperCoord.lng]);
    }
    // Only include disasters that are nearby — global earthquakes would
    // throw the bounds out and zoom the map to world-scale.
    for (const d of disasters) {
      const dist = haversine(d.lat, d.lng, DEMO_GEO.default.lat, DEMO_GEO.default.lng);
      if (dist < 50) points.push([d.lat, d.lng]);
    }
    if (points.length >= 2) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds.pad(0.3), { animate: false });
    }
    fitted.current = true;
  }, [map, matches, disasters]);

  return null;
}

function severityTone(severity: string): "block" | "warn" | "ok" {
  const s = severity.toLowerCase();
  if (s === "extreme" || s === "major") return "block";
  if (s === "severe" || s === "strong" || s === "moderate") return "warn";
  return "ok";
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 h-5 rounded-full bg-black/55 backdrop-blur-md text-white/80 border border-white/10">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot }} />
      {label}
    </span>
  );
}
