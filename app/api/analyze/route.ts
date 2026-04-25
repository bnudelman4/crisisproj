import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { AnalyzeResult, Match, Need, Resource } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT =
  "You are a crisis coordination AI. Extract every need and resource from the messages. Classify, score urgency 1-5, and create safe matches. Return ONLY valid JSON matching the exact schema provided. No markdown, no explanation, no preamble.";

const SCHEMA_BLOCK = `Schema (return JSON exactly matching this shape):
{
  "needs": [{ "id": string, "person": string, "type": "food"|"ride"|"medicine"|"shelter"|"info"|"other", "description": string, "urgency": 1|2|3|4|5, "location": string|null }],
  "resources": [{ "id": string, "person": string, "type": "car"|"food"|"money"|"time"|"skill", "description": string, "availability": string|null }],
  "matches": [{ "needId": string, "resourceId": string, "confidence": number, "action": string, "safetyFlag": boolean, "safetyNote": string|null }],
  "summary": { "totalNeeds": number, "totalResources": number, "urgentCases": number, "safeMatches": number }
}

STRICT enum rules — ANY violation breaks the dashboard:
- need.type MUST be exactly one of: food, ride, medicine, shelter, info, other.
- resource.type MUST be exactly one of: car, food, money, time, skill.
  Map common cases: generator/charging/electrical → "skill". blankets/diapers/formula/supplies → "food" if consumable else "skill". translation/medical-knowledge/EMT/electrician → "skill". cash/donation → "money". physical-presence/labor/wellness-checks → "time". vehicle of any kind → "car".
- urgency MUST be integer 1-5 (no strings).
- For wellness-check or distress posts with no clear need type, use "other" with urgency 4.

Urgency scoring:
- medicine OR medical emergency = 5
- shelter = 4
- food = 3
- ride = 2
- info = 1

Set safetyFlag=true on any match where the requester sounds in distress, vague,
unidentifiable, possibly a minor alone, or where dispatching a stranger could
endanger either party. Always include safetyNote when safetyFlag=true.
Use stable ids like "n1","n2","r1","r2".`;

const NEED_TYPES = ["food", "ride", "medicine", "shelter", "info", "other"] as const;
const RESOURCE_TYPES = ["car", "food", "money", "time", "skill"] as const;

function coerceNeedType(v: unknown): Need["type"] {
  return (NEED_TYPES as readonly string[]).includes(v as string) ? (v as Need["type"]) : "other";
}
function coerceResourceType(v: unknown): Resource["type"] {
  return (RESOURCE_TYPES as readonly string[]).includes(v as string) ? (v as Resource["type"]) : "skill";
}

function validate(parsed: unknown): AnalyzeResult {
  if (!parsed || typeof parsed !== "object") throw new Error("Response is not an object.");
  const p = parsed as Record<string, unknown>;
  if (!Array.isArray(p.needs)) throw new Error("needs is not an array.");
  if (!Array.isArray(p.resources)) throw new Error("resources is not an array.");
  if (!Array.isArray(p.matches)) throw new Error("matches is not an array.");
  if (!p.summary || typeof p.summary !== "object") throw new Error("summary missing.");

  const needs: Need[] = p.needs.map((n, i) => {
    const o = n as Record<string, unknown>;
    if (typeof o.id !== "string") throw new Error(`needs[${i}].id missing.`);
    if (typeof o.person !== "string") throw new Error(`needs[${i}].person missing.`);
    if (typeof o.description !== "string") throw new Error(`needs[${i}].description missing.`);
    const urgencyNum = Number(o.urgency);
    const urgency = Math.max(1, Math.min(5, Math.round(Number.isFinite(urgencyNum) ? urgencyNum : 1))) as Need["urgency"];
    return {
      id: o.id,
      person: o.person,
      type: coerceNeedType(o.type),
      description: o.description,
      urgency,
      location: typeof o.location === "string" ? o.location : null,
    };
  });

  const resources: Resource[] = p.resources.map((r, i) => {
    const o = r as Record<string, unknown>;
    if (typeof o.id !== "string") throw new Error(`resources[${i}].id missing.`);
    if (typeof o.person !== "string") throw new Error(`resources[${i}].person missing.`);
    if (typeof o.description !== "string") throw new Error(`resources[${i}].description missing.`);
    return {
      id: o.id,
      person: o.person,
      type: coerceResourceType(o.type),
      description: o.description,
      availability: typeof o.availability === "string" ? o.availability : null,
    };
  });

  const matches: Match[] = p.matches.map((m, i) => {
    const o = m as Record<string, unknown>;
    if (typeof o.needId !== "string") throw new Error(`matches[${i}].needId missing.`);
    if (typeof o.resourceId !== "string") throw new Error(`matches[${i}].resourceId missing.`);
    const confidence = Number(o.confidence);
    if (!Number.isFinite(confidence)) throw new Error(`matches[${i}].confidence invalid.`);
    if (typeof o.action !== "string") throw new Error(`matches[${i}].action missing.`);
    return {
      needId: o.needId,
      resourceId: o.resourceId,
      confidence: Math.max(0, Math.min(1, confidence)),
      action: o.action,
      safetyFlag: Boolean(o.safetyFlag),
      safetyNote: typeof o.safetyNote === "string" ? o.safetyNote : null,
    };
  });

  const s = p.summary as Record<string, unknown>;
  return {
    needs,
    resources,
    matches,
    summary: {
      totalNeeds: Number(s.totalNeeds) || needs.length,
      totalResources: Number(s.totalResources) || resources.length,
      urgentCases: Number(s.urgentCases) || needs.filter((n) => n.urgency >= 4).length,
      safeMatches: Number(s.safeMatches) || matches.filter((m) => !m.safetyFlag).length,
    },
  };
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

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not set. Add it to .env.local." },
      { status: 500 }
    );
  }

  let messages: string;
  try {
    const body = await req.json();
    messages = String(body?.messages ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!messages) {
    return NextResponse.json({ error: "No messages provided." }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  let raw: string;
  try {
    const response = await client.messages.create({
      model: "claude-opus-4-20250514",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `${SCHEMA_BLOCK}\n\nRaw messages to analyze:\n---\n${messages}\n---\n\nReturn only the JSON object.`,
        },
      ],
    });
    const block = response.content.find((c) => c.type === "text");
    if (!block || block.type !== "text") throw new Error("No text content from model.");
    raw = block.text;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Anthropic API error.";
    return NextResponse.json({ error: `Claude API error: ${message}` }, { status: 502 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJson(raw));
  } catch (e) {
    return NextResponse.json(
      {
        error: "Model returned malformed JSON.",
        details: e instanceof Error ? e.message : String(e),
        raw: raw.slice(0, 500),
      },
      { status: 422 }
    );
  }

  let result: AnalyzeResult;
  try {
    result = validate(parsed);
  } catch (e) {
    return NextResponse.json(
      {
        error: "Model JSON did not match schema.",
        details: e instanceof Error ? e.message : String(e),
      },
      { status: 422 }
    );
  }

  return NextResponse.json(result);
}
