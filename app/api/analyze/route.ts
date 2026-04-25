import { NextResponse } from "next/server";
import { analyzeMessages } from "@/lib/analyze";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
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

  try {
    const result = await analyzeMessages(messages);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Analysis failed.";
    if (msg.startsWith("Response is not") || msg.includes(".") || msg.includes("Schema")) {
      return NextResponse.json(
        { error: "Model JSON did not match schema or was malformed.", details: msg },
        { status: 422 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
