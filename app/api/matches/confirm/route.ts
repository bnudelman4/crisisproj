import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sendSms, isTwilioConfigured } from "@/lib/sms";
import { findMatch, requesterConfirmMatch } from "@/lib/matches";
import { getSessionUser } from "@/lib/auth";
import { resolveDemoPhone } from "@/lib/demo-routing";

export const runtime = "nodejs";

interface UserRow {
  id: number;
  name: string;
  phone: string;
}

interface RequestRow {
  id: number;
  user_id: number;
  type: string;
  description: string;
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const requester = getSessionUser();
  if (!requester) {
    return NextResponse.json(
      { success: false, error: "Login required to confirm matches." },
      { status: 401 }
    );
  }

  const matchId = typeof body.matchId === "string" ? body.matchId : "";
  const match = matchId ? findMatch(matchId) : undefined;
  if (!match) {
    return NextResponse.json({ success: false, error: "Match not found." }, { status: 404 });
  }
  if (match.status !== "helper_accepted") {
    return NextResponse.json(
      { success: false, error: `Match not awaiting confirmation (status=${match.status}).` },
      { status: 409 }
    );
  }
  if (match.requestUserId !== requester.id) {
    return NextResponse.json(
      { success: false, error: "Only the requester can confirm this match." },
      { status: 403 }
    );
  }

  const db = getDb();
  const helperRow = db
    .prepare("SELECT id, name, phone FROM users WHERE id = ?")
    .get(match.helperUserId) as UserRow | undefined;
  const requestRow = db
    .prepare("SELECT id, user_id, type, description FROM requests WHERE id = ?")
    .get(match.requestId) as RequestRow | undefined;

  if (!helperRow) {
    return NextResponse.json({ success: false, error: "Helper user missing." }, { status: 404 });
  }
  if (!requestRow) {
    return NextResponse.json({ success: false, error: "Request row missing." }, { status: 404 });
  }

  const updated = requesterConfirmMatch(match.id);
  if (!updated) {
    return NextResponse.json({ success: false, error: "Match update failed." }, { status: 500 });
  }

  db.prepare("UPDATE requests SET status = 'matched' WHERE id = ?").run(requestRow.id);
  if (match.providerId !== null) {
    db.prepare("UPDATE providers SET status = 'matched' WHERE id = ?").run(match.providerId);
  }

  const helperMessage = `CrisisMesh: ${requester.name} approved your help for their ${requestRow.type} request. You can begin now. Action: "${match.action}"`;
  const dest = resolveDemoPhone("helper", helperRow.phone);
  const sms = await sendSms(dest, helperMessage).catch((e) => ({
    to: dest,
    sid: null,
    mode: "error" as const,
    error: e instanceof Error ? e.message : "send failed",
    channel: "sms" as const,
  }));

  return NextResponse.json({
    success: true,
    matchId: updated.id,
    status: updated.status,
    twilioConfigured: isTwilioConfigured(),
    sms,
  });
}
