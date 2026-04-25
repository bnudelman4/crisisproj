import { NextResponse } from "next/server";
import { getDb } from "@/lib/backend/db";
import { getActiveDisasters } from "@/lib/backend/disasters";
import { spreadAroundCity } from "@/lib/backend/demo-locations";
import { listMatches } from "@/lib/backend/matches";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RequestRow {
  id: number;
  user_id: number;
  type: string;
  description: string;
  urgency: number;
  status: string;
}
interface ProviderRow {
  id: number;
  user_id: number;
  type: string;
  description: string;
  status: string;
}

export async function GET() {
  const db = getDb();

  const requestRows = db
    .prepare(
      "SELECT id, user_id, type, description, urgency, status FROM requests"
    )
    .all() as RequestRow[];
  const providerRows = db
    .prepare(
      "SELECT id, user_id, type, description, status FROM providers"
    )
    .all() as ProviderRow[];

  const requests = requestRows.map((r) => {
    const { lat, lng } = spreadAroundCity(`req-${r.id}`);
    return {
      id: r.id,
      userId: r.user_id,
      type: r.type,
      urgency: r.urgency,
      status: r.status,
      description: r.description,
      lat,
      lng,
    };
  });

  const providers = providerRows.map((p) => {
    const { lat, lng } = spreadAroundCity(`prov-${p.id}`);
    return {
      id: p.id,
      userId: p.user_id,
      type: p.type,
      status: p.status,
      description: p.description,
      lat,
      lng,
    };
  });

  // Match pins live at the midpoint between request and provider — for
  // the demo this is a deterministic point near the city center.
  const matches = listMatches().map((m) => {
    const { lat, lng } = spreadAroundCity(`match-${m.id}`);
    return {
      id: m.id,
      requestId: m.requestId,
      providerId: m.providerId,
      status: m.status,
      lat,
      lng,
    };
  });

  const disasters = await getActiveDisasters();

  return NextResponse.json({ requests, providers, matches, disasters });
}
