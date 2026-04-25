import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sendSms, isTwilioConfigured } from "@/lib/sms";
import { manuallyAcceptRequest } from "@/lib/matches";
import { getSessionUser } from "@/lib/auth";
import { resolveDemoPhone } from "@/lib/demo-routing";

export const runtime = "nodejs";

interface RequestRow {
  id: number;
  user_id: number;
  type: string;
  description: string;
  phone: string;
  name: string;
  status: string;
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const helper = getSessionUser();
  if (!helper) {
    return NextResponse.json(
      { success: false, error: "Login required to accept requests." },
      { status: 401 }
    );
  }

  const requestId = Number(body.requestId);
  if (!Number.isInteger(requestId) || requestId <= 0) {
    return NextResponse.json({ success: false, error: "requestId required." }, { status: 400 });
  }

  const db = getDb();
  const requestRow = db
    .prepare(
      `SELECT r.id, r.user_id, r.type, r.description, r.status, u.phone, u.name
       FROM requests r JOIN users u ON u.id = r.user_id
       WHERE r.id = ?`
    )
    .get(requestId) as RequestRow | undefined;

  if (!requestRow) {
    return NextResponse.json({ success: false, error: "Request not found." }, { status: 404 });
  }
  if (requestRow.user_id === helper.id) {
    return NextResponse.json(
      { success: false, error: "Cannot accept your own request." },
      { status: 400 }
    );
  }

  const action = `${helper.name} accepted request: ${requestRow.description}`;
  const match = manuallyAcceptRequest({
    requestId: requestRow.id,
    helperUserId: helper.id,
    helperName: helper.name,
    requestUserId: requestRow.user_id,
    requesterName: requestRow.name,
    action,
  });

  const requesterMessage = `CrisisMesh: ${helper.name} has accepted your ${requestRow.type} request. Reply CONFIRM HELP to approve them, or visit the dashboard.`;
  const dest = resolveDemoPhone("requester", requestRow.phone);
  const sms = await sendSms(dest, requesterMessage).catch((e) => ({
    to: dest,
    sid: null,
    mode: "error" as const,
    error: e instanceof Error ? e.message : "send failed",
    channel: "sms" as const,
  }));

  return NextResponse.json({
    success: true,
    matchId: match.id,
    status: match.status,
    twilioConfigured: isTwilioConfigured(),
    sms,
    nextStep: "Awaiting requester confirmation.",
  });
}
