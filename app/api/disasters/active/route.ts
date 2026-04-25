import { NextResponse } from "next/server";
import { getActiveDisasters } from "@/lib/disasters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const events = await getActiveDisasters();
  return NextResponse.json({ events, count: events.length });
}
