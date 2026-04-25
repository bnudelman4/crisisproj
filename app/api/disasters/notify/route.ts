import { NextResponse } from "next/server";
import { getDb, type UserRow } from "@/lib/backend/db";
import { haversineKm } from "@/lib/backend/geo";
import { sendSms, isTwilioConfigured } from "@/lib/backend/sms";

export const runtime = "nodejs";

const DEFAULT_RADIUS_KM = 50;
const DEFAULT_BODY =
  "Bridge Alert: A crisis event has been detected near you. Reply with what you need or what you can provide.";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const disasterId = typeof body.disasterId === "string" ? body.disasterId : "";
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  const radiusKm = Number.isFinite(Number(body.radiusKm))
    ? Number(body.radiusKm)
    : DEFAULT_RADIUS_KM;

  if (!disasterId) return NextResponse.json({ error: "disasterId required." }, { status: 400 });
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "lat and lng required." }, { status: 400 });
  }

  const db = getDb();
  const users = db
    .prepare("SELECT id, name, phone, lat, lng, created_at FROM users")
    .all() as UserRow[];

  const inRange = users.filter(
    (u) => haversineKm({ lat, lng }, { lat: u.lat, lng: u.lng }) <= radiusKm
  );

  const message = process.env.CRISIS_MESH_OUTBOUND_MESSAGE?.trim() || DEFAULT_BODY;

  const results = await Promise.all(
    inRange.map(async (u) => {
      try {
        const r = await sendSms(u.phone, message);
        return { phone: u.phone, ok: true, mode: r.mode, sid: r.sid };
      } catch (e) {
        return {
          phone: u.phone,
          ok: false,
          error: e instanceof Error ? e.message : "send failed",
        };
      }
    })
  );

  return NextResponse.json({
    disasterId,
    radiusKm,
    notified: results.filter((r) => r.ok).length,
    users: inRange.map((u) => u.phone),
    results,
    twilioConfigured: isTwilioConfigured(),
  });
}
