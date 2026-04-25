"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DEMO_MESSAGES } from "@/lib/demo-messages";
import { AlertTriangle, Loader2, Sparkles, Radio } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messageCount = text.split("\n").filter((l) => l.trim().length > 0).length;

  async function run() {
    setError(null);
    if (!text.trim()) {
      setError("Paste some messages first or load the demo set.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Analysis failed.");
        setLoading(false);
        return;
      }
      sessionStorage.setItem("crisismesh:result", JSON.stringify(data));
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container max-w-3xl py-16">
        <div className="flex items-center gap-2 text-primary mb-3">
          <Radio className="h-5 w-5 animate-pulse" />
          <span className="text-xs uppercase tracking-[0.2em] font-semibold">Crisis Coordination</span>
        </div>
        <h1 className="text-5xl font-bold tracking-tight mb-3">CrisisMesh</h1>
        <p className="text-muted-foreground mb-8 text-lg">
          Paste raw messages from GroupMe, Slack, Discord, texts, or social posts.
          CrisisMesh extracts needs, surfaces resources, and proposes safe matches.
        </p>

        <div className="space-y-3">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="[GroupMe 14:02] Maria: Need insulin at 4th and Oak..."
            className="min-h-[280px] font-mono text-sm"
            disabled={loading}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{messageCount} message{messageCount === 1 ? "" : "s"}</span>
            <button
              type="button"
              onClick={() => setText(DEMO_MESSAGES)}
              className="underline underline-offset-2 hover:text-foreground"
              disabled={loading}
            >
              Load 30-message demo set
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          <Button size="lg" onClick={run} disabled={loading} className="gap-2">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                CrisisMesh is analyzing {messageCount} message{messageCount === 1 ? "" : "s"}...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Run CrisisMesh
              </>
            )}
          </Button>
          <span className="text-xs text-muted-foreground">
            All matches are human-reviewed suggestions. Nothing auto-dispatches.
          </span>
        </div>
      </div>
    </main>
  );
}
