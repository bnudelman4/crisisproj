import { NextResponse } from "next/server";
import { seedDatabaseIfEmpty } from "@/lib/seed";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST() {
  try {
    const report = await seedDatabaseIfEmpty();
    return NextResponse.json({ ok: true, ...report });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Seed failed.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
