import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Cached {
  ts: number;
  label: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __crisismeshGeoCache: Map<string, Cached> | undefined;
}

function cache(): Map<string, Cached> {
  if (!global.__crisismeshGeoCache) global.__crisismeshGeoCache = new Map();
  return global.__crisismeshGeoCache;
}

const TTL_MS = 24 * 60 * 60 * 1000;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "lat/lng required." }, { status: 400 });
  }

  const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  const hit = cache().get(key);
  if (hit && Date.now() - hit.ts < TTL_MS) {
    return NextResponse.json({ label: hit.label, cached: true });
  }

  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10&addressdetails=1`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "CrisisMesh/1.0 (demo)",
        },
      }
    );
    if (!r.ok) return NextResponse.json({ label: `${lat.toFixed(2)}, ${lng.toFixed(2)}` });
    const j = (await r.json()) as { address?: Record<string, string>; display_name?: string };
    const a = j.address ?? {};
    const city = a.city || a.town || a.village || a.suburb || a.county;
    const region = a.state || a.region;
    const country = a.country_code ? a.country_code.toUpperCase() : a.country;
    const parts = [city, region, country].filter(Boolean);
    const label = parts.length ? parts.join(", ") : j.display_name ?? `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
    cache().set(key, { ts: Date.now(), label });
    return NextResponse.json({ label });
  } catch {
    return NextResponse.json({ label: `${lat.toFixed(2)}, ${lng.toFixed(2)}` });
  }
}
