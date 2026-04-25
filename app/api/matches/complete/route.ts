import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { findMatch, markComplete } from "@/lib/matches";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const me = getSessionUser();
  if (!me) {
    return NextResponse.json({ success: false, error: "Login required." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const matchId = typeof body.matchId === "string" ? body.matchId : "";
  const match = matchId ? findMatch(matchId) : undefined;
  if (!match) {
    return NextResponse.json({ success: false, error: "Match not found." }, { status: 404 });
  }
  if (match.status !== "approved" && match.status !== "completed") {
    return NextResponse.json(
      { success: false, error: "Match must be approved before completion." },
      { status: 409 }
    );
  }

  let role: "helper" | "requester";
  if (me.id === match.helperUserId) role = "helper";
  else if (me.id === match.requestUserId) role = "requester";
  else {
    return NextResponse.json(
      { success: false, error: "Only helper or requester can mark this complete." },
      { status: 403 }
    );
  }

  const updated = markComplete(match.id, role);
  if (!updated) {
    return NextResponse.json({ success: false, error: "Match update failed." }, { status: 500 });
  }

  if (updated.status === "completed") {
    const db = getDb();
    db.prepare("UPDATE requests SET status = 'completed' WHERE id = ?").run(updated.requestId);
    if (updated.providerId !== null) {
      db.prepare("UPDATE providers SET status = 'available' WHERE id = ?").run(updated.providerId);
    }
  }

  return NextResponse.json({
    success: true,
    matchId: updated.id,
    status: updated.status,
    helperMarkedComplete: updated.helperMarkedComplete,
    requesterMarkedComplete: updated.requesterMarkedComplete,
  });
}
