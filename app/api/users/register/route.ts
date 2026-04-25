import { NextResponse } from "next/server";
import { getDb, type UserRow } from "@/lib/db";
import { isE164, normalizePhone } from "@/lib/phone";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const rawPhone = typeof body.phone === "string" ? body.phone : "";
  const lat = Number(body.lat);
  const lng = Number(body.lng);

  if (!name) return NextResponse.json({ error: "name is required." }, { status: 400 });
  if (!rawPhone) return NextResponse.json({ error: "phone is required." }, { status: 400 });
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return NextResponse.json({ error: "lat must be a number between -90 and 90." }, { status: 400 });
  }
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    return NextResponse.json({ error: "lng must be a number between -180 and 180." }, { status: 400 });
  }

  const phone = normalizePhone(rawPhone);
  if (!isE164(phone)) {
    return NextResponse.json(
      { error: "phone must be in E.164 format (e.g. +14155551234)." },
      { status: 400 }
    );
  }

  const db = getDb();
  const createdAt = new Date().toISOString();

  try {
    const result = db
      .prepare(
        "INSERT INTO users (name, phone, lat, lng, created_at) VALUES (?, ?, ?, ?, ?)"
      )
      .run(name, phone, lat, lng, createdAt);
    const user = db
      .prepare("SELECT id, name, phone, lat, lng, created_at FROM users WHERE id = ?")
      .get(result.lastInsertRowid) as UserRow;
    return NextResponse.json({ user }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Insert failed.";
    if (msg.includes("UNIQUE")) {
      const existing = db
        .prepare("SELECT id, name, phone, lat, lng, created_at FROM users WHERE phone = ?")
        .get(phone) as UserRow | undefined;
      return NextResponse.json(
        { error: "Phone already registered.", user: existing ?? null },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
