export interface DisasterEvent {
  id: string;
  type: "earthquake" | "weather";
  title: string;
  lat: number;
  lng: number;
  severity: string;
  time: string;
}

const USGS_URL =
  "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_7day.geojson";
const NWS_URL =
  "https://api.weather.gov/alerts/active?status=actual&message_type=alert&urgency=Immediate,Expected";

interface CachedFeed {
  fetchedAt: number;
  events: DisasterEvent[];
}

declare global {
  // eslint-disable-next-line no-var
  var __crisismeshFeed: CachedFeed | undefined;
}

const TTL_MS = 60_000;

function severityFromMag(mag: unknown): string {
  const m = Number(mag);
  if (!Number.isFinite(m)) return "unknown";
  if (m >= 7) return "major";
  if (m >= 6) return "strong";
  if (m >= 5) return "moderate";
  if (m >= 4) return "light";
  return "minor";
}

async function fetchUsgs(): Promise<DisasterEvent[]> {
  try {
    const r = await fetch(USGS_URL, { headers: { Accept: "application/geo+json" } });
    if (!r.ok) return [];
    const j = (await r.json()) as { features?: Array<Record<string, unknown>> };
    const features = Array.isArray(j.features) ? j.features : [];
    return features.flatMap((f) => {
      const props = (f.properties ?? {}) as Record<string, unknown>;
      const geom = (f.geometry ?? {}) as Record<string, unknown>;
      const coords = Array.isArray(geom.coordinates) ? (geom.coordinates as number[]) : [];
      const lng = Number(coords[0]);
      const lat = Number(coords[1]);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [];
      const id = typeof f.id === "string" ? f.id : `usgs-${props.code ?? Math.random()}`;
      const title = typeof props.title === "string" ? props.title : "Earthquake";
      const time =
        typeof props.time === "number" ? new Date(props.time).toISOString() : new Date().toISOString();
      return [
        {
          id: `usgs:${id}`,
          type: "earthquake" as const,
          title,
          lat,
          lng,
          severity: severityFromMag(props.mag),
          time,
        },
      ];
    });
  } catch {
    return [];
  }
}

function nwsCenter(geometry: unknown, geocode: unknown): { lat: number; lng: number } | null {
  if (geometry && typeof geometry === "object") {
    const g = geometry as { type?: string; coordinates?: unknown };
    if (g.type === "Polygon" && Array.isArray(g.coordinates) && Array.isArray(g.coordinates[0])) {
      const ring = g.coordinates[0] as number[][];
      let sx = 0, sy = 0, n = 0;
      for (const pt of ring) {
        if (Array.isArray(pt) && pt.length >= 2) {
          sx += Number(pt[0]);
          sy += Number(pt[1]);
          n++;
        }
      }
      if (n > 0) return { lat: sy / n, lng: sx / n };
    }
    if (g.type === "Point" && Array.isArray(g.coordinates) && g.coordinates.length >= 2) {
      return { lat: Number(g.coordinates[1]), lng: Number(g.coordinates[0]) };
    }
  }
  // No precise geometry — geocode is SAME/UGC codes only, no coords.
  void geocode;
  return null;
}

async function fetchNws(): Promise<DisasterEvent[]> {
  try {
    const r = await fetch(NWS_URL, {
      headers: {
        Accept: "application/geo+json",
        "User-Agent": "CrisisMesh (demo, contact: crisismesh@example.com)",
      },
    });
    if (!r.ok) return [];
    const j = (await r.json()) as { features?: Array<Record<string, unknown>> };
    const features = Array.isArray(j.features) ? j.features : [];
    return features.flatMap((f) => {
      const props = (f.properties ?? {}) as Record<string, unknown>;
      const center = nwsCenter(f.geometry, props.geocode);
      if (!center) return [];
      const id = typeof f.id === "string" ? f.id : `nws-${Math.random()}`;
      const title = typeof props.headline === "string" ? props.headline : (props.event as string) ?? "Weather alert";
      const severity = typeof props.severity === "string" ? props.severity.toLowerCase() : "unknown";
      const time = typeof props.sent === "string" ? props.sent : new Date().toISOString();
      return [
        {
          id: `nws:${id}`,
          type: "weather" as const,
          title,
          lat: center.lat,
          lng: center.lng,
          severity,
          time,
        },
      ];
    });
  } catch {
    return [];
  }
}

export async function getActiveDisasters(): Promise<DisasterEvent[]> {
  const now = Date.now();
  if (global.__crisismeshFeed && now - global.__crisismeshFeed.fetchedAt < TTL_MS) {
    return global.__crisismeshFeed.events;
  }
  const [usgs, nws] = await Promise.all([fetchUsgs(), fetchNws()]);
  const events = [...usgs, ...nws];
  global.__crisismeshFeed = { fetchedAt: now, events };
  return events;
}

export function getDisasterById(id: string): DisasterEvent | undefined {
  return global.__crisismeshFeed?.events.find((e) => e.id === id);
}
