import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sendSms, isTwilioConfigured } from "@/lib/sms";
import { recordMatch } from "@/lib/matches";

export const runtime = "nodejs";

interface RequestRow {
  id: number;
  user_id: number;
  type: string;
  description: string;
  phone: string;
}
interface ProviderRow {
  id: number;
  user_id: number;
  type: string;
  description: string;
  phone: string;
}

function toIntId(v: unknown): number | null {
  if (typeof v === "number" && Number.isInteger(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isInteger(n)) return n;
  }
  return null;
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const matchId = typeof body.matchId === "string" ? body.matchId : "";
  const reqIdNum = toIntId(body.requestId);
  const provIdNum = toIntId(body.providerId);

  if (reqIdNum === null || provIdNum === null) {
    const memMatch = recordMatch(0, 0);
    return NextResponse.json({
      success: true,
      mode: "demo",
      note: "Demo match recorded (non-DB IDs). No SMS sent.",
      matchId: memMatch.id,
      sourceMatchId: matchId || null,
    });
  }

  const db = getDb();
  const requestRow = db
    .prepare(
      `SELECT r.id, r.user_id, r.type, r.description, u.phone
       FROM requests r JOIN users u ON u.id = r.user_id
       WHERE r.id = ?`
    )
    .get(reqIdNum) as RequestRow | undefined;
  const providerRow = db
    .prepare(
      `SELECT p.id, p.user_id, p.type, p.description, u.phone
       FROM providers p JOIN users u ON u.id = p.user_id
       WHERE p.id = ?`
    )
    .get(provIdNum) as ProviderRow | undefined;

  if (!requestRow) {
    return NextResponse.json({ success: false, error: "Request not found." }, { status: 404 });
  }
  if (!providerRow) {
    return NextResponse.json({ success: false, error: "Provider not found." }, { status: 404 });
  }

  const providerMessage = `CrisisMesh Match: You've been matched to help ${requestRow.type} near you. Please confirm by replying YES. Details: ${requestRow.description}`;
  const requesterMessage = `CrisisMesh: Help is on the way for your ${requestRow.type} request. Your helper has been notified.`;

  const sms = await Promise.all([
    sendSms(providerRow.phone, providerMessage).catch((e) => ({
      to: providerRow.phone,
      sid: null,
      mode: "error" as const,
      error: e instanceof Error ? e.message : "send failed",
    })),
    sendSms(requestRow.phone, requesterMessage).catch((e) => ({
      to: requestRow.phone,
      sid: null,
      mode: "error" as const,
      error: e instanceof Error ? e.message : "send failed",
    })),
  ]);

  db.prepare("UPDATE requests SET status = 'matched' WHERE id = ?").run(requestRow.id);
  db.prepare("UPDATE providers SET status = 'matched' WHERE id = ?").run(providerRow.id);

  const stored = recordMatch(requestRow.id, providerRow.id);

  return NextResponse.json({
    success: true,
    mode: "live",
    matchId: stored.id,
    twilioConfigured: isTwilioConfigured(),
    sms,
  });
}
