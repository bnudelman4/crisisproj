import { NextResponse } from "next/server";
import { getDb, type UserRow } from "@/lib/db";
import { getSessionUser, hashPassword, verifyPassword } from "@/lib/auth";

export const runtime = "nodejs";

interface UserRowWithHash extends UserRow {
  password_hash: string | null;
}

export async function POST(req: Request) {
  const me = getSessionUser();
  if (!me) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const db = getDb();
  const full = db
    .prepare("SELECT id, name, phone, lat, lng, created_at, password_hash FROM users WHERE id = ?")
    .get(me.id) as UserRowWithHash | undefined;
  if (!full) {
    return NextResponse.json({ error: "User missing." }, { status: 404 });
  }

  const newName = typeof body.name === "string" ? body.name.trim() : null;
  const newLatRaw = body.lat;
  const newLngRaw = body.lng;
  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

  const wantsPasswordChange = newPassword.length > 0;
  const wantsAnyChange =
    newName !== null || newLatRaw !== undefined || newLngRaw !== undefined || wantsPasswordChange;
  if (!wantsAnyChange) {
    return NextResponse.json({ error: "No fields to update." }, { status: 400 });
  }

  if (full.password_hash) {
    if (!verifyPassword(currentPassword, full.password_hash)) {
      return NextResponse.json({ error: "Current password incorrect." }, { status: 401 });
    }
  }

  const updates: string[] = [];
  const values: unknown[] = [];

  if (newName !== null) {
    if (newName.length === 0) {
      return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
    }
    updates.push("name = ?");
    values.push(newName);
  }

  if (newLatRaw !== undefined) {
    const lat = Number(newLatRaw);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      return NextResponse.json({ error: "lat invalid." }, { status: 400 });
    }
    updates.push("lat = ?");
    values.push(lat);
  }

  if (newLngRaw !== undefined) {
    const lng = Number(newLngRaw);
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      return NextResponse.json({ error: "lng invalid." }, { status: 400 });
    }
    updates.push("lng = ?");
    values.push(lng);
  }

  if (wantsPasswordChange) {
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters." }, { status: 400 });
    }
    updates.push("password_hash = ?");
    values.push(hashPassword(newPassword));
  }

  values.push(me.id);
  db.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`).run(...values);

  const updated = db
    .prepare("SELECT id, name, phone, lat, lng, created_at FROM users WHERE id = ?")
    .get(me.id) as UserRow;
  return NextResponse.json({ user: updated });
}
