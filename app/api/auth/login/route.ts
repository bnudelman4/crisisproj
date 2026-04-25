import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { setSession, verifyPassword } from "@/lib/auth";
import { isE164, normalizePhone } from "@/lib/phone";

export const runtime = "nodejs";

interface UserRowWithHash {
  id: number;
  name: string;
  phone: string;
  lat: number;
  lng: number;
  created_at: string;
  password_hash: string | null;
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const phone = normalizePhone(String(body.phone || ""));
  const password = typeof body.password === "string" ? body.password : "";
  if (!isE164(phone)) {
    return NextResponse.json({ error: "Invalid phone format." }, { status: 400 });
  }
  const db = getDb();
  const user = db
    .prepare(
      "SELECT id, name, phone, lat, lng, created_at, password_hash FROM users WHERE phone = ?"
    )
    .get(phone) as UserRowWithHash | undefined;
  if (!user) {
    return NextResponse.json(
      { error: "User not registered.", needsRegister: true, phone },
      { status: 404 }
    );
  }
  if (!user.password_hash) {
    return NextResponse.json(
      {
        error: "This account has no password on file. Re-register with a password.",
        needsRegister: true,
        phone,
      },
      { status: 403 }
    );
  }
  if (!password) {
    return NextResponse.json({ error: "Password required." }, { status: 400 });
  }
  if (!verifyPassword(password, user.password_hash)) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }
  setSession(user.id);
  const { password_hash: _omit, ...safe } = user;
  void _omit;
  return NextResponse.json({ user: safe });
}
