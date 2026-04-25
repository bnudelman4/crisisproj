"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Radio,
  ShieldAlert,
  Users,
  HeartPulse,
  Handshake,
  Map as MapIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AnalyzeResult, Need, Resource } from "@/lib/types";
import { NEED_ICON, RESOURCE_ICON, urgencyColors } from "@/lib/icons";

const CrisisMap = dynamic(() => import("@/components/map/CrisisMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[560px] flex items-center justify-center text-muted-foreground border border-border rounded-lg">
      Loading map...
    </div>
  ),
});

export default function DashboardPage() {
  const [data, setData] = useState<AnalyzeResult | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("crisismesh:result");
    if (!raw) {
      setMissing(true);
      return;
    }
    try {
      setData(JSON.parse(raw) as AnalyzeResult);
    } catch {
      setMissing(true);
    }
  }, []);

  if (missing) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-400" />
              No analysis loaded
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Run an analysis from the landing page first.
            </p>
            <Link href="/">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Back to home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading...
      </main>
    );
  }

  const { needs, resources, matches, summary } = data;
  const sortedNeeds = [...needs].sort((a, b) => b.urgency - a.urgency);
  const matchedNeedIds = new Set(matches.map((m) => m.needId));
  const needById: Record<string, Need> = Object.fromEntries(needs.map((n) => [n.id, n]));
  const resourceById: Record<string, Resource> = Object.fromEntries(resources.map((r) => [r.id, r]));

  return (
    <main className="min-h-screen pb-16">
      <Ticker summary={summary} />

      <div className="container max-w-7xl py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Radio className="h-4 w-4 animate-pulse" />
              <span className="text-xs uppercase tracking-[0.2em] font-semibold">Live Command Center</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">CrisisMesh Dashboard</h1>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> New analysis
            </Button>
          </Link>
        </div>

        <SummaryBar summary={summary} />

        <UnmatchedAlert needs={sortedNeeds} matchedNeedIds={matchedNeedIds} />

        <section className="mt-6">
          <div className="flex items-center gap-2 mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <MapIcon className="h-4 w-4" /> Live Map · Manhattan, NYC
          </div>
          <CrisisMap overlay={data} />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <section>
            <SectionTitle icon={<HeartPulse className="h-4 w-4" />} label="Urgency Queue" count={sortedNeeds.length} />
            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
              {sortedNeeds.length === 0 && <EmptyHint text="No needs detected." />}
              {sortedNeeds.map((n, i) => (
                <NeedCard key={n.id} need={n} index={i} matched={matchedNeedIds.has(n.id)} />
              ))}
            </div>
          </section>

          <section>
            <SectionTitle icon={<Handshake className="h-4 w-4" />} label="Match Board" count={matches.length} />
            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
              {matches.length === 0 && (
                <EmptyHint text="No matches proposed yet. Resources may not align with current needs — review queues manually." />
              )}
              {matches.map((m, i) => (
                <MatchCard
                  key={`${m.needId}-${m.resourceId}-${i}`}
                  need={needById[m.needId]}
                  resource={resourceById[m.resourceId]}
                  match={m}
                  index={i}
                  matchKey={`${m.needId}-${m.resourceId}-${i}`}
                  needId={m.needId}
                  resourceId={m.resourceId}
                />
              ))}
            </div>
          </section>
        </div>

        <section className="mt-6">
          <SectionTitle icon={<Users className="h-4 w-4" />} label="Available Resources" count={resources.length} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {resources.length === 0 && <EmptyHint text="No resources detected." />}
            {resources.map((r, i) => (
              <ResourceCard key={r.id} resource={r} index={i} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Ticker({ summary }: { summary: AnalyzeResult["summary"] }) {
  const items = [
    { label: "Needs", value: summary.totalNeeds },
    { label: "Helpers", value: summary.totalResources },
    { label: "Urgent", value: summary.urgentCases },
    { label: "Safe matches", value: summary.safeMatches },
  ];
  return (
    <div className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-10">
      <div className="container max-w-7xl py-2 flex items-center gap-6 overflow-x-auto text-sm">
        <span className="flex items-center gap-2 text-primary font-semibold">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" /> LIVE
        </span>
        {items.map((it) => (
          <span key={it.label} className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-muted-foreground">{it.label}</span>
            <span className="font-mono font-semibold">{it.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function SummaryBar({ summary }: { summary: AnalyzeResult["summary"] }) {
  const cells = [
    { label: "needs", value: summary.totalNeeds, tone: "text-foreground" },
    { label: "helpers", value: summary.totalResources, tone: "text-emerald-400" },
    { label: "urgent", value: summary.urgentCases, tone: "text-red-400" },
    { label: "safe matches", value: summary.safeMatches, tone: "text-sky-400" },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cells.map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.4 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className={cn("text-3xl font-bold tabular-nums", c.tone)}>{c.value}</div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mt-1">{c.label}</div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

function UnmatchedAlert({
  needs,
  matchedNeedIds,
}: {
  needs: Need[];
  matchedNeedIds: Set<string>;
}) {
  const unmatchedUrgent = needs.filter((n) => !matchedNeedIds.has(n.id) && n.urgency >= 4);
  if (unmatchedUrgent.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-4 flex items-start gap-3 rounded-lg border-2 border-red-500/70 bg-red-500/10 px-4 py-3"
    >
      <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
      <div className="text-sm">
        <div className="font-semibold text-red-300">
          {unmatchedUrgent.length} urgent need{unmatchedUrgent.length === 1 ? "" : "s"} unmatched
        </div>
        <div className="text-xs text-red-200/80 mt-0.5">
          {unmatchedUrgent
            .slice(0, 3)
            .map((n) => `${n.person} (U${n.urgency} ${n.type})`)
            .join(" · ")}
          {unmatchedUrgent.length > 3 && ` · +${unmatchedUrgent.length - 3} more`}
        </div>
      </div>
    </motion.div>
  );
}

function SectionTitle({ icon, label, count }: { icon: React.ReactNode; label: string; count: number }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <span className="text-xs font-mono text-muted-foreground">{count}</span>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <Card>
      <CardContent className="p-4 text-sm text-muted-foreground">{text}</CardContent>
    </Card>
  );
}

function NeedCard({ need, index, matched }: { need: Need; index: number; matched: boolean }) {
  const colors = urgencyColors(need.urgency);
  const Icon = NEED_ICON[need.type];
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <Card className={cn("border", colors.border, colors.bg)}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <Icon className={cn("h-4 w-4", colors.text)} />
              <span className="font-semibold">{need.person}</span>
              <Badge variant="outline" className="text-[10px] uppercase">{need.type}</Badge>
            </div>
            <span className={cn("text-xs font-bold rounded px-2 py-0.5", colors.chip)}>U{need.urgency}</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed">{need.description}</p>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>{need.location ?? "location unknown"}</span>
            {matched ? (
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="h-3 w-3" /> matched
              </span>
            ) : (
              <span className="text-orange-400">unmatched</span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ResourceCard({ resource, index }: { resource: Resource; index: number }) {
  const Icon = RESOURCE_ICON[resource.type];
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-emerald-400" />
            <span className="font-semibold">{resource.person}</span>
            <Badge variant="outline" className="text-[10px] uppercase">{resource.type}</Badge>
          </div>
          <p className="mt-2 text-sm leading-relaxed">{resource.description}</p>
          {resource.availability && (
            <div className="mt-2 text-xs text-muted-foreground">
              Available: {resource.availability}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function MatchCard({
  need,
  resource,
  match,
  index,
  matchKey,
  needId,
  resourceId,
}: {
  need: Need | undefined;
  resource: Resource | undefined;
  match: { confidence: number; action: string; safetyFlag: boolean; safetyNote: string | null };
  index: number;
  matchKey: string;
  needId: string;
  resourceId: string;
}) {
  const flagged = match.safetyFlag;
  const [decision, setDecision] = useState<"pending" | "approving" | "approved" | "skipped" | "error">("pending");
  const [errMsg, setErrMsg] = useState<string | null>(null);

  async function approve() {
    setDecision("approving");
    setErrMsg(null);
    try {
      const res = await fetch("/api/matches/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: matchKey, requestId: needId, providerId: resourceId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setDecision("error");
        setErrMsg(data?.error || `HTTP ${res.status}`);
        return;
      }
      setDecision("approved");
    } catch (e) {
      setDecision("error");
      setErrMsg(e instanceof Error ? e.message : "network error");
    }
  }

  if (decision === "skipped") return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Card
        className={cn(
          flagged ? "border-2 border-red-500/80 bg-red-500/5" : "border-border"
        )}
      >
        <CardContent className="p-4">
          {flagged && (
            <div className="flex items-center gap-2 mb-2 text-red-400 text-xs font-semibold uppercase tracking-wider">
              <ShieldAlert className="h-4 w-4" />
              Safety review required
            </div>
          )}
          <p className="text-sm font-medium leading-relaxed">{match.action}</p>
          <div className="mt-2 text-xs text-muted-foreground space-y-1">
            <div>
              <span className="text-foreground/80">Helper:</span> {resource?.person ?? "(unknown)"}
              {" → "}
              <span className="text-foreground/80">Recipient:</span> {need?.person ?? "(unknown)"}
            </div>
            <div>Confidence: {(match.confidence * 100).toFixed(0)}%</div>
          </div>
          {flagged && match.safetyNote && (
            <div className="mt-2 rounded border border-red-500/40 bg-red-500/10 p-2 text-xs text-red-200">
              <strong>Note:</strong> {match.safetyNote}
            </div>
          )}
          <div className="mt-3 flex items-center gap-2">
            {decision === "approved" ? (
              <span className="text-xs flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="h-3 w-3" /> Approved · SMS dispatched
              </span>
            ) : (
              <>
                <Button
                  size="sm"
                  onClick={approve}
                  disabled={decision === "approving"}
                  className="h-8"
                >
                  {decision === "approving" ? "Approving..." : "Approve"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDecision("skipped")}
                  disabled={decision === "approving"}
                  className="h-8"
                >
                  Skip
                </Button>
              </>
            )}
          </div>
          {decision === "error" && errMsg && (
            <div className="mt-2 text-xs text-destructive">Approve failed: {errMsg}</div>
          )}
          <div className="mt-3 text-[11px] text-muted-foreground italic">
            Suggestion only — human dispatcher must confirm before action.
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
