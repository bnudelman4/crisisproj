"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Circle, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { DEMO_CITY } from "@/lib/demo-locations";

interface SessionUserShape {
  id: number;
  name: string;
  lat?: number;
  lng?: number;
}

interface RequestPin {
  id: number;
  userId: number;
  userName: string;
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
  userName: string;
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
  status: "proposed" | "matched";
  action: string;
  confidence: number;
  safetyFlag: boolean;
  safetyNote: string | null;
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

const REFRESH_MS = 15_000;
const DISASTER_RADIUS_M = 50_000;

type LayerToggles = { needs: boolean; providers: boolean; matches: boolean };

export default function CrisisMap({
  user,
  onChange,
}: {
  user?: SessionUserShape | null;
  onChange?: () => void;
} = {}) {
  const [data, setData] = useState<MapPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [layers, setLayers] = useState<LayerToggles>({ needs: true, providers: true, matches: true });
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [acceptedIds, setAcceptedIds] = useState<Set<number>>(new Set());
  const [acceptErr, setAcceptErr] = useState<Record<number, string>>({});

  async function acceptRequest(requestId: number) {
    setAcceptingId(requestId);
    setAcceptErr((s) => {
      const next = { ...s };
      delete next[requestId];
      return next;
    });
    try {
      const res = await fetch("/api/matches/accept-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setAcceptErr((s) => ({ ...s, [requestId]: data?.error || `HTTP ${res.status}` }));
        return;
      }
      setAcceptedIds((s) => new Set(s).add(requestId));
      onChange?.();
    } catch (e) {
      setAcceptErr((s) => ({ ...s, [requestId]: e instanceof Error ? e.message : "network error" }));
    } finally {
      setAcceptingId(null);
    }
  }

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

  const userLatLng: [number, number] | null =
    user && Number.isFinite(user.lat) && Number.isFinite(user.lng)
      ? [user.lat as number, user.lng as number]
      : null;
  const center: [number, number] = userLatLng ?? [DEMO_CITY.lat, DEMO_CITY.lng];

  return (
    <div className="relative">
      <div className="absolute z-[1000] top-3 left-3 flex gap-2 flex-wrap">
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
          pathOptions={{ color: "#22c55e", fillColor: "#22c55e", fillOpacity: 0.05, weight: 1, dashArray: "4 4" }}
        />
        {userLatLng && (
          <CircleMarker
            center={userLatLng}
            radius={6}
            pathOptions={{ color: "#22c55e", fillColor: "#22c55e", fillOpacity: 1, weight: 2 }}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">You · {user?.name}</div>
                <div className="text-xs opacity-70">Your registered location</div>
              </div>
            </Popup>
          </CircleMarker>
        )}

        {data?.disasters.map((d) => (
          <Circle
            key={`zone-${d.id}`}
            center={[d.lat, d.lng]}
            radius={DISASTER_RADIUS_M}
            interactive={false}
            pathOptions={{ color: "#eab308", fillColor: "#eab308", fillOpacity: 0.15, weight: 1 }}
          />
        ))}

        {layers.needs && data?.requests.map((r) => {
          const matched =
            r.status === "matched" ||
            r.status === "completed" ||
            (data?.matches.some((m) => m.requestId === r.id && m.status !== "proposed") ?? false);
          return (
            <CircleMarker
              key={`r-${r.id}`}
              center={[r.lat, r.lng]}
              radius={r.urgency >= 5 ? 11 : r.urgency === 4 ? 9 : 7}
              pathOptions={{
                color: matched ? "#3b82f6" : "#ef4444",
                fillColor: urgencyHex(r.urgency),
                fillOpacity: 0.9,
                weight: 2,
              }}
            >
              <Popup>
                <div className="text-sm" style={{ minWidth: 220 }}>
                  <div className="font-semibold">{r.userName}</div>
                  <div className="text-xs uppercase tracking-wide opacity-70">Need · {r.type}</div>
                  <div className="mt-1">{r.description}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs">
                    <span>Urgency:</span>
                    <span className="px-1.5 py-0.5 rounded text-white" style={{ background: urgencyHex(r.urgency) }}>
                      U{r.urgency}
                    </span>
                    <span className="opacity-70">· {r.status}</span>
                  </div>
                  {!matched && r.status === "open" && (
                    <div className="mt-2">
                      {acceptedIds.has(r.id) ? (
                        <div className="text-xs text-emerald-600 font-semibold">
                          ✓ Accepted · awaiting requester confirm
                        </div>
                      ) : user && user.id !== r.userId ? (
                        <button
                          type="button"
                          onClick={() => acceptRequest(r.id)}
                          disabled={acceptingId === r.id}
                          className="rounded-md bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-2.5 py-1 disabled:opacity-50"
                        >
                          {acceptingId === r.id ? "Accepting..." : "Accept this request"}
                        </button>
                      ) : !user ? (
                        <a href="/login" className="text-xs underline">Log in to accept</a>
                      ) : (
                        <span className="text-xs italic opacity-60">Your request</span>
                      )}
                      {acceptErr[r.id] && (
                        <div className="text-xs text-red-600 mt-1">{acceptErr[r.id]}</div>
                      )}
                    </div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {layers.providers && data?.providers.map((p) => (
          <CircleMarker
            key={`p-${p.id}`}
            center={[p.lat, p.lng]}
            radius={8}
            pathOptions={{ color: "#10b981", fillColor: "#10b981", fillOpacity: 0.85, weight: 2 }}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">{p.userName}</div>
                <div className="text-xs uppercase tracking-wide opacity-70">Provider · {p.type}</div>
                <div className="mt-1">{p.description}</div>
                <div className="mt-1 text-xs opacity-70">{p.status}</div>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {layers.matches && data?.matches.map((m) => (
          <CircleMarker
            key={`m-${m.id}`}
            center={[m.lat, m.lng]}
            radius={m.status === "matched" ? 10 : 9}
            pathOptions={{
              color: m.safetyFlag ? "#ef4444" : "#3b82f6",
              fillColor: "#3b82f6",
              fillOpacity: m.status === "matched" ? 0.95 : 0.75,
              weight: m.safetyFlag ? 3 : 2,
            }}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">
                  {m.status === "matched" ? "Confirmed match" : "Proposed match"}
                </div>
                {m.action && <div className="mt-1">{m.action}</div>}
                <div className="text-xs opacity-70 mt-1">
                  Req #{m.requestId} ↔ Prov #{m.providerId} · {(m.confidence * 100).toFixed(0)}%
                </div>
                {m.safetyFlag && <div className="text-xs text-red-500 mt-1">⚠ Safety review required</div>}
                {m.safetyNote && <div className="text-xs opacity-80 mt-1">{m.safetyNote}</div>}
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
      <LegendDot color="#3b82f6" label="Matches (proposed/confirmed)" />
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

if (typeof window !== "undefined") {
  const proto = L.Icon.Default.prototype as unknown as { _getIconUrl?: () => void };
  if (proto._getIconUrl) delete proto._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}
