import { cookies } from "next/headers";
import crypto from "node:crypto";
import { getDb, type UserRow } from "./db";

const COOKIE_NAME = "crisismesh_user";
const SECRET = process.env.SESSION_SECRET || "crisismesh-dev-secret-change-me";

export function hashPassword(plain: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(plain, salt, 64).toString("hex");
  return `${salt}.${hash}`;
}

export function verifyPassword(plain: string, stored: string | null | undefined): boolean {
  if (!stored) return false;
  const [salt, hash] = stored.split(".");
  if (!salt || !hash) return false;
  let expected: Buffer;
  let got: Buffer;
  try {
    expected = Buffer.from(hash, "hex");
    got = crypto.scryptSync(plain, salt, 64);
  } catch {
    return false;
  }
  if (expected.length !== got.length) return false;
  return crypto.timingSafeEqual(expected, got);
}

function sign(value: string): string {
  return crypto.createHmac("sha256", SECRET).update(value).digest("hex");
}

function makeCookieValue(userId: number): string {
  const v = String(userId);
  return `${v}.${sign(v)}`;
}

function parseCookieValue(raw: string): number | null {
  const [v, sig] = raw.split(".");
  if (!v || !sig) return null;
  if (sign(v) !== sig) return null;
  const n = Number(v);
  return Number.isInteger(n) ? n : null;
}

export function setSession(userId: number) {
  cookies().set(COOKIE_NAME, makeCookieValue(userId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSession() {
  cookies().delete(COOKIE_NAME);
}

export function getSessionUser(): UserRow | null {
  const raw = cookies().get(COOKIE_NAME)?.value;
  if (!raw) return null;
  const id = parseCookieValue(raw);
  if (id === null) return null;
  const db = getDb();
  const u = db
    .prepare("SELECT id, name, phone, lat, lng, created_at FROM users WHERE id = ?")
    .get(id) as UserRow | undefined;
  return u ?? null;
}
