import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { jitter } from "@/lib/jitter";
import { listMatches } from "@/lib/matches";
import { getActiveDisasters } from "@/lib/disasters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RequestRow {
  id: number;
  user_id: number;
  type: string;
  description: string;
  urgency: number;
  status: string;
  user_name: string | null;
  lat: number | null;
  lng: number | null;
}
interface ProviderRow {
  id: number;
  user_id: number;
  type: string;
  description: string;
  status: string;
  user_name: string | null;
  lat: number | null;
  lng: number | null;
}

export async function GET() {
  const db = getDb();

  const reqRows = db
    .prepare(
      `SELECT r.id, r.user_id, r.type, r.description, r.urgency, r.status,
              COALESCE(r.display_name, u.name) AS user_name,
              COALESCE(r.lat, u.lat) AS lat,
              COALESCE(r.lng, u.lng) AS lng
       FROM requests r LEFT JOIN users u ON u.id = r.user_id`
    )
    .all() as RequestRow[];

  const provRows = db
    .prepare(
      `SELECT p.id, p.user_id, p.type, p.description, p.status,
              COALESCE(p.display_name, u.name) AS user_name,
              COALESCE(p.lat, u.lat) AS lat,
              COALESCE(p.lng, u.lng) AS lng
       FROM providers p LEFT JOIN users u ON u.id = p.user_id`
    )
    .all() as ProviderRow[];

  const requests = reqRows
    .filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng))
    .map((r) => {
      const j = jitter(r.lat as number, r.lng as number);
      return {
        id: r.id,
        userId: r.user_id,
        userName: r.user_name ?? `User ${r.user_id}`,
        type: r.type,
        urgency: r.urgency,
        status: r.status,
        description: r.description,
        lat: j.lat,
        lng: j.lng,
      };
    });

  const providers = provRows
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
    .map((p) => {
      const j = jitter(p.lat as number, p.lng as number);
      return {
        id: p.id,
        userId: p.user_id,
        userName: p.user_name ?? `User ${p.user_id}`,
        type: p.type,
        status: p.status,
        description: p.description,
        lat: j.lat,
        lng: j.lng,
      };
    });

  const reqById = new Map(reqRows.map((r) => [r.id, r]));
  const provById = new Map(provRows.map((p) => [p.id, p]));

  const matches = listMatches().flatMap((m) => {
    const r = reqById.get(m.requestId);
    const p = m.providerId !== null ? provById.get(m.providerId) : undefined;
    const lat = (r?.lat ?? p?.lat ?? 0) as number;
    const lng = (r?.lng ?? p?.lng ?? 0) as number;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [];
    const j = jitter(lat, lng);
    return [
      {
        id: m.id,
        requestId: m.requestId,
        providerId: m.providerId,
        helperUserId: m.helperUserId,
        helperName: m.helperName,
        requestUserId: m.requestUserId,
        requesterName: m.requesterName,
        status: m.status,
        action: m.action,
        confidence: m.confidence,
        safetyFlag: m.safetyFlag,
        safetyNote: m.safetyNote,
        helperAcceptedAt: m.helperAcceptedAt,
        requesterApprovedAt: m.requesterApprovedAt,
        helperMarkedComplete: m.helperMarkedComplete,
        requesterMarkedComplete: m.requesterMarkedComplete,
        completedAt: m.completedAt,
        lat: j.lat,
        lng: j.lng,
      },
    ];
  });

  const disasters = await getActiveDisasters();

  return NextResponse.json({ requests, providers, matches, disasters });
}
