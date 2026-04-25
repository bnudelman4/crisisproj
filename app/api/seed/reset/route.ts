import { NextResponse } from "next/server";
import { seedDatabase } from "@/lib/seed";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST() {
  try {
    const report = await seedDatabase(true);
    return NextResponse.json({ ok: true, ...report });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Reset failed.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
