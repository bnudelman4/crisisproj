import { NextResponse } from "next/server";
import twilio from "twilio";
import Anthropic from "@anthropic-ai/sdk";
import { getDb, type UserRow } from "@/lib/db";
import { isTwilioConfigured } from "@/lib/sms";

export const runtime = "nodejs";

const SYSTEM_PROMPT =
  "You are a crisis intake classifier. Given a text message reply, classify it as either a need or an offer to help. Return ONLY JSON: { type: 'need'|'provider', category: 'food|ride|medicine|shelter|money|time|skill|info|other', description: string, urgency: 1-5 }. No markdown.";

const TWIML_OK =
  '<?xml version="1.0" encoding="UTF-8"?><Response><Message>Thanks — CrisisMesh recorded your reply. A coordinator will follow up.</Message></Response>';
const TWIML_ERR =
  '<?xml version="1.0" encoding="UTF-8"?><Response><Message>CrisisMesh could not process your reply. Please try again.</Message></Response>';

const NEED_CATS = ["food", "ride", "medicine", "shelter", "info", "other"];
const PROVIDER_CATS = ["car", "food", "money", "time", "skill"];

function twiml(xml: string, status = 200) {
  return new NextResponse(xml, {
    status,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

function extractJson(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced) return fenced[1].trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) return trimmed.slice(start, end + 1);
  return trimmed;
}

function mapCategory(type: "need" | "provider", category: string): string {
  const lower = category.toLowerCase();
  if (type === "need") return NEED_CATS.includes(lower) ? lower : "other";
  return PROVIDER_CATS.includes(lower) ? lower : "skill";
}

async function classify(message: string): Promise<{
  type: "need" | "provider";
  category: string;
  description: string;
  urgency: number;
} | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  const client = new Anthropic({ apiKey });
  try {
    const response = await client.messages.create({
      model: "claude-opus-4-20250514",
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: message }],
    });
    const block = response.content.find((c) => c.type === "text");
    if (!block || block.type !== "text") return null;
    const parsed = JSON.parse(extractJson(block.text)) as Record<string, unknown>;
    const type = parsed.type === "provider" ? "provider" : "need";
    const category = mapCategory(type, String(parsed.category ?? ""));
    const description = String(parsed.description ?? message);
    const urgencyNum = Number(parsed.urgency);
    const urgency = Math.max(
      1,
      Math.min(5, Math.round(Number.isFinite(urgencyNum) ? urgencyNum : 1))
    );
    return { type, category, description, urgency };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const rawBody = await req.text();

  if (isTwilioConfigured()) {
    const signature = req.headers.get("x-twilio-signature") ?? "";
    const url = new URL(req.url);
    const proto = req.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? url.host;
    const fullUrl = `${proto}://${host}${url.pathname}${url.search}`;
    const params: Record<string, string> = {};
    for (const [k, v] of new URLSearchParams(rawBody)) params[k] = v;
    const ok = twilio.validateRequest(
      process.env.TWILIO_AUTH_TOKEN!,
      signature,
      fullUrl,
      params
    );
    if (!ok) {
      return twiml(TWIML_ERR, 403);
    }
  }

  const params = new URLSearchParams(rawBody);
  const fromRaw = (params.get("From") ?? "").trim();
  const from = fromRaw.replace(/^whatsapp:/i, "");
  const text = (params.get("Body") ?? "").trim();
  if (!from || !text) return twiml(TWIML_ERR, 400);

  const db = getDb();
  const user = db
    .prepare("SELECT id, name, phone, lat, lng, created_at FROM users WHERE phone = ?")
    .get(from) as UserRow | undefined;

  if (!user) {
    console.log(`[CrisisMesh SMS:inbound] unknown sender ${from}: ${text}`);
    return twiml(TWIML_OK);
  }

  const classified = await classify(text);
  if (!classified) {
    console.log(`[CrisisMesh SMS:inbound] classify failed for ${from}: ${text}`);
    return twiml(TWIML_ERR, 200);
  }

  const createdAt = new Date().toISOString();
  if (classified.type === "need") {
    db.prepare(
      "INSERT INTO requests (user_id, type, description, urgency, status, disaster_event_id, created_at) VALUES (?, ?, ?, ?, 'open', NULL, ?)"
    ).run(user.id, classified.category, classified.description, classified.urgency, createdAt);
  } else {
    db.prepare(
      "INSERT INTO providers (user_id, type, description, availability, status, disaster_event_id, created_at) VALUES (?, ?, ?, NULL, 'available', NULL, ?)"
    ).run(user.id, classified.category, classified.description, createdAt);
  }

  console.log(
    `[CrisisMesh SMS:inbound] ${from} → ${classified.type}/${classified.category} (urgency ${classified.urgency})`
  );
  return twiml(TWIML_OK);
}
