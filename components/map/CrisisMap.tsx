"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Circle, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { DEMO_CITY, spreadAroundCity } from "@/lib/demo-locations";
import type { AnalyzeResult } from "@/lib/types";

interface RequestPin {
  id: number;
  userId: number;
  type: string;
  urgency: number;
  status: string;
  description: string;
  lat: number;
  lng: number;
}
interface ProviderPin {
  id: number;
  userId: number;
  type: string;
  status: string;
  description: string;
  lat: number;
  lng: number;
}
interface MatchPin {
  id: string;
  requestId: number;
  providerId: number;
  status: string;
  lat: number;
  lng: number;
}
interface DisasterPin {
  id: string;
  type: string;
  title: string;
  lat: number;
  lng: number;
  severity: string;
  time: string;
}

interface MapPayload {
  requests: RequestPin[];
  providers: ProviderPin[];
  matches: MatchPin[];
  disasters: DisasterPin[];
}

const REFRESH_MS = 30_000;
const DISASTER_RADIUS_M = 50_000;

type LayerToggles = { needs: boolean; providers: boolean; matches: boolean };

export default function CrisisMap({ overlay }: { overlay?: AnalyzeResult | null }) {
  const [data, setData] = useState<MapPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [layers, setLayers] = useState<LayerToggles>({ needs: true, providers: true, matches: true });

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch("/api/map/data", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as MapPayload;
        if (active) {
          setData(json);
          setError(null);
        }
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "fetch failed");
      }
    }
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const center: [number, number] = [DEMO_CITY.lat, DEMO_CITY.lng];

  const overlayNeeds = useMemo(() => {
    if (!overlay) return [];
    const matchedNeedIds = new Set(overlay.matches.map((m) => m.needId));
    return overlay.needs.map((n) => {
      const loc = spreadAroundCity(`need-${n.id}`);
      return {
        id: n.id,
        person: n.person,
        type: n.type,
        urgency: n.urgency,
        description: n.description,
        location: n.location,
        matched: matchedNeedIds.has(n.id),
        lat: loc.lat,
        lng: loc.lng,
      };
    });
  }, [overlay]);

  const overlayResources = useMemo(() => {
    if (!overlay) return [];
    return overlay.resources.map((r) => {
      const loc = spreadAroundCity(`resource-${r.id}`);
      return {
        id: r.id,
        person: r.person,
        type: r.type,
        description: r.description,
        availability: r.availability,
        lat: loc.lat,
        lng: loc.lng,
      };
    });
  }, [overlay]);

  const overlayMatches = useMemo(() => {
    if (!overlay) return [];
    const needLoc = new Map(overlayNeeds.map((n) => [n.id, n]));
    return overlay.matches.flatMap((m, i) => {
      const n = needLoc.get(m.needId);
      if (!n) return [];
      return [
        {
          id: `om-${i}`,
          needId: m.needId,
          resourceId: m.resourceId,
          action: m.action,
          confidence: m.confidence,
          safetyFlag: m.safetyFlag,
          lat: n.lat,
          lng: n.lng,
        },
      ];
    });
  }, [overlay, overlayNeeds]);

  return (
    <div className="relative">
      <div className="absolute z-[1000] top-3 left-3 flex gap-2">
        <ToggleButton on={layers.needs} onClick={() => setLayers((s) => ({ ...s, needs: !s.needs }))} color="#ef4444">
          Needs
        </ToggleButton>
        <ToggleButton on={layers.providers} onClick={() => setLayers((s) => ({ ...s, providers: !s.providers }))} color="#10b981">
          Providers
        </ToggleButton>
        <ToggleButton on={layers.matches} onClick={() => setLayers((s) => ({ ...s, matches: !s.matches }))} color="#3b82f6">
          Matches
        </ToggleButton>
      </div>

      {error && (
        <div className="absolute z-[1000] top-3 right-3 bg-destructive/90 text-destructive-foreground text-xs px-3 py-1.5 rounded">
          map error: {error}
        </div>
      )}

      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom
        style={{ height: "560px", width: "100%", borderRadius: 12, overflow: "hidden" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Circle
          center={center}
          radius={DEMO_CITY.radiusKm * 1000}
          interactive={false}
          pathOptions={{ color: "#eab308", fillColor: "#eab308", fillOpacity: 0.08, weight: 1, dashArray: "4 4" }}
        />

        {data?.disasters.map((d) => (
          <Circle
            key={`zone-${d.id}`}
            center={[d.lat, d.lng]}
            radius={DISASTER_RADIUS_M}
            interactive={false}
            pathOptions={{ color: "#eab308", fillColor: "#eab308", fillOpacity: 0.15, weight: 1 }}
          />
        ))}

        {layers.needs && data?.requests.map((r) => (
          <CircleMarker
            key={`r-${r.id}`}
            center={[r.lat, r.lng]}
            radius={8}
            pathOptions={{ color: "#ef4444", fillColor: "#ef4444", fillOpacity: 0.85, weight: 2 }}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">User #{r.userId}</div>
                <div className="text-xs uppercase tracking-wide opacity-70">Need · {r.type}</div>
                <div className="mt-1">{r.description}</div>
                <div className="mt-1 flex items-center gap-2 text-xs">
                  <span>Urgency:</span>
                  <span
                    className="px-1.5 py-0.5 rounded text-white"
                    style={{ background: urgencyHex(r.urgency) }}
                  >
                    U{r.urgency}
                  </span>
                  <span className="opacity-70">· {r.status}</span>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {layers.needs && overlayNeeds.map((n) => (
          <CircleMarker
            key={`on-${n.id}`}
            center={[n.lat, n.lng]}
            radius={n.urgency >= 5 ? 11 : n.urgency === 4 ? 9 : 7}
            pathOptions={{
              color: n.matched ? "#3b82f6" : "#ef4444",
              fillColor: urgencyHex(n.urgency),
              fillOpacity: 0.9,
              weight: 2,
            }}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">{n.person}</div>
                <div className="text-xs uppercase tracking-wide opacity-70">Need · {n.type}</div>
                <div className="mt-1">{n.description}</div>
                <div className="mt-1 flex items-center gap-2 text-xs">
                  <span>Urgency:</span>
                  <span className="px-1.5 py-0.5 rounded text-white" style={{ background: urgencyHex(n.urgency) }}>
                    U{n.urgency}
                  </span>
                  <span className="opacity-70">· {n.matched ? "matched" : "unmatched"}</span>
                </div>
                {n.location && <div className="text-xs opacity-70 mt-1">📍 {n.location}</div>}
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {layers.providers && data?.providers.map((p) => (
          <CircleMarker
            key={`p-${p.id}`}
            center={[p.lat, p.lng]}
            radius={8}
            pathOptions={{ color: "#10b981", fillColor: "#10b981", fillOpacity: 0.85, weight: 2 }}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">User #{p.userId}</div>
                <div className="text-xs uppercase tracking-wide opacity-70">Provider · {p.type}</div>
                <div className="mt-1">{p.description}</div>
                <div className="mt-1 text-xs opacity-70">{p.status}</div>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {layers.providers && overlayResources.map((r) => (
          <CircleMarker
            key={`or-${r.id}`}
            center={[r.lat, r.lng]}
            radius={7}
            pathOptions={{ color: "#10b981", fillColor: "#10b981", fillOpacity: 0.85, weight: 2 }}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">{r.person}</div>
                <div className="text-xs uppercase tracking-wide opacity-70">Provider · {r.type}</div>
                <div className="mt-1">{r.description}</div>
                {r.availability && <div className="text-xs opacity-70 mt-1">⏱ {r.availability}</div>}
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {layers.matches && overlayMatches.map((m) => (
          <CircleMarker
            key={`om-${m.id}`}
            center={[m.lat, m.lng]}
            radius={9}
            pathOptions={{
              color: m.safetyFlag ? "#ef4444" : "#3b82f6",
              fillColor: "#3b82f6",
              fillOpacity: 0.85,
              weight: m.safetyFlag ? 3 : 2,
            }}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">Proposed match</div>
                <div className="mt-1">{m.action}</div>
                <div className="text-xs opacity-70 mt-1">Confidence: {(m.confidence * 100).toFixed(0)}%</div>
                {m.safetyFlag && <div className="text-xs text-red-500 mt-1">⚠ Safety review required</div>}
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {layers.matches && data?.matches.map((m) => (
          <CircleMarker
            key={`m-${m.id}`}
            center={[m.lat, m.lng]}
            radius={9}
            pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.9, weight: 2 }}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">Match</div>
                <div className="text-xs opacity-70">
                  Request #{m.requestId} ↔ Provider #{m.providerId}
                </div>
                <div className="text-xs mt-1">Status: {m.status}</div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      <Legend />
    </div>
  );
}

function ToggleButton({
  on,
  onClick,
  color,
  children,
}: {
  on: boolean;
  onClick: () => void;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-xs font-semibold border shadow-sm transition-colors ${
        on ? "bg-card text-foreground" : "bg-card/40 text-muted-foreground"
      }`}
      style={{ borderColor: color }}
    >
      <span className="inline-block w-2 h-2 rounded-full mr-2 align-middle" style={{ background: color }} />
      {children}
      <span className="ml-2 opacity-60">{on ? "ON" : "OFF"}</span>
    </button>
  );
}

function Legend() {
  return (
    <div className="absolute z-[1000] bottom-3 left-3 bg-card/95 backdrop-blur border border-border rounded-md px-3 py-2 text-xs space-y-1 shadow">
      <div className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground mb-1">Legend</div>
      <LegendDot color="#ef4444" label="Needs (open requests)" />
      <LegendDot color="#10b981" label="Providers (available)" />
      <LegendDot color="#3b82f6" label="Confirmed matches" />
      <div className="flex items-center gap-2">
        <span className="inline-block w-3 h-3 rounded-full" style={{ background: "#eab308", opacity: 0.4 }} />
        <span>Disaster zone (50km)</span>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: color }} />
      <span>{label}</span>
    </div>
  );
}

function urgencyHex(u: number): string {
  if (u >= 5) return "#ef4444";
  if (u === 4) return "#f97316";
  if (u === 3) return "#eab308";
  return "#10b981";
}

// Fix default Leaflet icon path (in case it's needed elsewhere — CircleMarker doesn't use icons but Marker would)
if (typeof window !== "undefined") {
  const proto = L.Icon.Default.prototype as unknown as { _getIconUrl?: () => void };
  if (proto._getIconUrl) delete proto._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

