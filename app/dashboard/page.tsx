"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  HandHeart,
  Loader2,
  LogIn,
  LogOut,
  Radio,
  RefreshCw,
  ShieldAlert,
  Users,
  HeartPulse,
  Handshake,
  Map as MapIcon,
  UserCircle2,
  ClipboardList,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NeedType, ResourceType } from "@/lib/types";
import { NEED_ICON, RESOURCE_ICON, urgencyColors } from "@/lib/icons";

const CrisisMap = dynamic(() => import("@/components/map/CrisisMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[560px] flex items-center justify-center text-muted-foreground border border-border rounded-lg">
      Loading map...
    </div>
  ),
});

const REFRESH_MS = 15_000;

interface MapRequest {
  id: number;
  userId: number;
  userName: string;
  type: string;
  urgency: number;
  status: string;
  description: string;
}
interface MapProvider {
  id: number;
  userId: number;
  userName: string;
  type: string;
  status: string;
  description: string;
}
interface MapMatch {
  id: string;
  requestId: number;
  providerId: number | null;
  helperUserId: number;
  helperName: string;
  requestUserId: number;
  requesterName: string;
  status: "proposed" | "helper_accepted" | "approved" | "completed";
  action: string;
  confidence: number;
  safetyFlag: boolean;
  safetyNote: string | null;
  helperMarkedComplete: boolean;
  requesterMarkedComplete: boolean;
  completedAt: string | null;
}
interface MapPayload {
  requests: MapRequest[];
  providers: MapProvider[];
  matches: MapMatch[];
  disasters: unknown[];
}
interface SessionUser {
  id: number;
  name: string;
  phone: string;
  lat: number;
  lng: number;
}

const NEED_TYPES: NeedType[] = ["food", "ride", "medicine", "shelter", "info", "other"];
const RESOURCE_TYPES: ResourceType[] = ["car", "food", "money", "time", "skill"];

function coerceNeedType(v: string): NeedType {
  return (NEED_TYPES as string[]).includes(v) ? (v as NeedType) : "other";
}
function coerceResourceType(v: string): ResourceType {
  return (RESOURCE_TYPES as string[]).includes(v) ? (v as ResourceType) : "skill";
}
function clampUrgency(u: number): 1 | 2 | 3 | 4 | 5 {
  return Math.max(1, Math.min(5, Math.round(u))) as 1 | 2 | 3 | 4 | 5;
}

export default function DashboardPage() {
  const router = useRouter();
  const [payload, setPayload] = useState<MapPayload | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [locationLabel, setLocationLabel] = useState<string>("");

  async function fetchData(): Promise<MapPayload | null> {
    try {
      const res = await fetch("/api/map/data", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as MapPayload;
      setPayload(json);
      setError(null);
      setLastUpdated(new Date());
      return json;
    } catch (e) {
      setError(e instanceof Error ? e.message : "fetch failed");
      return null;
    }
  }

  async function fetchLocationLabel(lat: number, lng: number) {
    try {
      const res = await fetch(`/api/location/reverse?lat=${lat}&lng=${lng}`, { cache: "no-store" });
      const data = await res.json();
      if (data.label) setLocationLabel(data.label);
    } catch {
      setLocationLabel(`${lat.toFixed(2)}, ${lng.toFixed(2)}`);
    }
  }

  async function fetchMe() {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();
      setUser(data?.user ?? null);
      if (data?.user?.lat !== undefined && data?.user?.lng !== undefined) {
        fetchLocationLabel(data.user.lat, data.user.lng);
      }
    } catch {
      setUser(null);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.refresh();
  }

  async function runSeed() {
    setSeeding(true);
    try {
      await fetch("/api/seed", { method: "POST" });
      await fetchData();
    } finally {
      setSeeding(false);
    }
  }

  async function runReset() {
    setSeeding(true);
    try {
      await fetch("/api/seed/reset", { method: "POST" });
      await fetchData();
    } finally {
      setSeeding(false);
    }
  }

  useEffect(() => {
    let active = true;
    (async () => {
      await fetchMe();
      const first = await fetchData();
      if (!active) return;
      setLoading(false);
      if (first && first.requests.length === 0 && first.providers.length === 0) {
        await runSeed();
      }
    })();
    const id = setInterval(fetchData, REFRESH_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading || !payload) {
    return (
      <main className="min-h-screen flex items-center justify-center text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        {seeding ? "Seeding demo data..." : "Loading dashboard..."}
      </main>
    );
  }

  const requestById = new Map(payload.requests.map((r) => [r.id, r]));
  const providerById = new Map(payload.providers.map((p) => [p.id, p]));

  const matchedRequestIds = new Set<number>([
    ...payload.matches.filter((m) => m.status !== "proposed").map((m) => m.requestId),
    ...payload.requests.filter((r) => r.status === "matched" || r.status === "completed").map((r) => r.id),
  ]);

  const queueRequests = [...payload.requests]
    .filter((r) => !user || r.userId !== user.id)
    .sort((a, b) => b.urgency - a.urgency);
  const sortedRequests = queueRequests;

  const summary = {
    totalNeeds: payload.requests.length,
    totalResources: payload.providers.length,
    urgentCases: payload.requests.filter((r) => r.urgency >= 4).length,
    safeMatches: payload.matches.filter((m) => !m.safetyFlag).length,
  };

  return (
    <main className="min-h-screen pb-16">
      <Ticker summary={summary} lastUpdated={lastUpdated} error={error} user={user} onLogout={logout} />

      <div className="container max-w-7xl py-8">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Radio className="h-4 w-4 animate-pulse" />
              <span className="text-xs uppercase tracking-[0.2em] font-semibold">Live Command Center</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">CrisisMesh</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {locationLabel || (user ? `${user.lat.toFixed(2)}, ${user.lng.toFixed(2)}` : "Your area")} · auto-refreshes every 15s · WhatsApp replies feed in live
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          </div>
        </div>

        <SummaryBar summary={summary} />

        <UnmatchedAlert requests={sortedRequests} matchedRequestIds={matchedRequestIds} />

        {user && (
          <MyActivity
            user={user}
            requests={payload.requests}
            matches={payload.matches}
            onChange={fetchData}
          />
        )}

        <section className="mt-6">
          <div className="flex items-center gap-2 mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <MapIcon className="h-4 w-4" /> Live Map · {locationLabel || "Your area"}
          </div>
          <CrisisMap user={user} onChange={fetchData} />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <section>
            <SectionTitle icon={<HeartPulse className="h-4 w-4" />} label="Urgency Queue" count={sortedRequests.length} />
            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
              {sortedRequests.length === 0 && <EmptyHint text="No needs detected." />}
              {sortedRequests.map((r, i) => (
                <NeedCard
                  key={r.id}
                  request={r}
                  index={i}
                  matched={matchedRequestIds.has(r.id)}
                  user={user}
                  onAccepted={fetchData}
                />
              ))}
            </div>
          </section>

          <section>
            <SectionTitle icon={<Handshake className="h-4 w-4" />} label="Match Board" count={payload.matches.length} />
            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
              {payload.matches.length === 0 && (
                <EmptyHint text="No matches proposed yet." />
              )}
              {payload.matches.map((m, i) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  index={i}
                  request={requestById.get(m.requestId)}
                  provider={m.providerId !== null ? providerById.get(m.providerId) : undefined}
                  user={user}
                  onChange={fetchData}
                />
              ))}
            </div>
          </section>
        </div>

        <section className="mt-6">
          <SectionTitle icon={<Users className="h-4 w-4" />} label="Available Resources" count={payload.providers.length} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {payload.providers.length === 0 && <EmptyHint text="No resources detected." />}
            {payload.providers.map((p, i) => (
              <ResourceCard key={p.id} provider={p} index={i} />
            ))}
          </div>
        </section>
      </div>
      <button
        type="button"
        onClick={runReset}
        disabled={seeding}
        title="Reset demo data"
        className="fixed bottom-2 right-2 z-50 text-[9px] uppercase tracking-wider text-muted-foreground/30 hover:text-muted-foreground transition-colors px-1.5 py-0.5 rounded"
      >
        {seeding ? "resetting…" : "reset"}
      </button>
    </main>
  );
}

function Ticker({
  summary,
  lastUpdated,
  error,
  user,
  onLogout,
}: {
  summary: { totalNeeds: number; totalResources: number; urgentCases: number; safeMatches: number };
  lastUpdated: Date | null;
  error: string | null;
  user: SessionUser | null;
  onLogout: () => void;
}) {
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
        {lastUpdated && (
          <span className="ml-auto text-xs text-muted-foreground">
            updated {lastUpdated.toLocaleTimeString()}
          </span>
        )}
        {error && <span className="text-xs text-destructive">err: {error}</span>}
        <span className="flex items-center gap-2 pl-2 border-l border-border">
          {user ? (
            <>
              <UserCircle2 className="h-4 w-4 text-emerald-400" />
              <Link href="/profile" className="text-xs underline underline-offset-2 hover:text-foreground">
                {user.name} · {user.phone}
              </Link>
              <button
                onClick={onLogout}
                className="text-xs underline underline-offset-2 hover:text-foreground gap-1 inline-flex items-center"
              >
                <LogOut className="h-3 w-3" /> log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-xs underline inline-flex items-center gap-1">
                <LogIn className="h-3 w-3" /> log in
              </Link>
              <Link href="/register" className="text-xs underline">
                register
              </Link>
            </>
          )}
        </span>
      </div>
    </div>
  );
}

function SummaryBar({ summary }: { summary: { totalNeeds: number; totalResources: number; urgentCases: number; safeMatches: number } }) {
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

function UnmatchedAlert({ requests, matchedRequestIds }: { requests: MapRequest[]; matchedRequestIds: Set<number> }) {
  const unmatchedUrgent = requests.filter((r) => !matchedRequestIds.has(r.id) && r.urgency >= 4);
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
            .map((r) => `${r.userName} (U${r.urgency} ${r.type})`)
            .join(" · ")}
          {unmatchedUrgent.length > 3 && ` · +${unmatchedUrgent.length - 3} more`}
        </div>
      </div>
    </motion.div>
  );
}

function MyActivity({
  user,
  requests,
  matches,
  onChange,
}: {
  user: SessionUser;
  requests: MapRequest[];
  matches: MapMatch[];
  onChange: () => void;
}) {
  const myRequests = requests.filter((r) => r.userId === user.id);
  const helpingMatches = matches.filter((m) => m.helperUserId === user.id);
  const incomingMatches = matches.filter(
    (m) => m.requestUserId === user.id && m.status === "helper_accepted"
  );

  const isActive = (m: MapMatch) => m.status !== "completed";
  const myActiveRequests = myRequests.filter(
    (r) => !matches.some((m) => m.requestId === r.id && m.status === "completed")
  );
  const myCompletedRequests = myRequests.filter((r) =>
    matches.some((m) => m.requestId === r.id && m.status === "completed")
  );
  const helpingActive = helpingMatches.filter(isActive);
  const helpingCompleted = helpingMatches.filter((m) => m.status === "completed");

  if (
    myRequests.length === 0 &&
    helpingMatches.length === 0 &&
    incomingMatches.length === 0
  ) {
    return (
      <div className="mt-4 rounded-lg border border-border bg-card/40 px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
        <ClipboardList className="h-4 w-4" />
        Logged in as {user.name}. No requests or matches yet — text the WhatsApp bot or accept an open need below.
      </div>
    );
  }

  return (
    <section className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
      <ActivityColumn
        title="My requests"
        empty="No requests submitted."
        items={[
          ...myActiveRequests.map((r) => {
            const m = matches.find((mm) => mm.requestId === r.id);
            return (
              <MyRequestRow key={`mr-${r.id}`} request={r} match={m} onChange={onChange} userId={user.id} />
            );
          }),
          ...myCompletedRequests.map((r) => {
            const m = matches.find((mm) => mm.requestId === r.id);
            return (
              <MyRequestRow key={`mr-${r.id}`} request={r} match={m} onChange={onChange} userId={user.id} completed />
            );
          }),
        ]}
      />
      <ActivityColumn
        title="I'm helping"
        empty="Not helping anyone yet."
        items={[
          ...helpingActive.map((m) => (
            <HelpingRow key={`hm-${m.id}`} match={m} userId={user.id} onChange={onChange} />
          )),
          ...helpingCompleted.map((m) => (
            <HelpingRow key={`hm-${m.id}`} match={m} userId={user.id} onChange={onChange} completed />
          )),
        ]}
      />
      <ActivityColumn
        title="Confirm a helper"
        empty="No helpers awaiting your confirmation."
        items={incomingMatches.map((m) => (
          <ConfirmRow key={`cf-${m.id}`} match={m} onChange={onChange} />
        ))}
      />
    </section>
  );
}

function statusLabel(m: MapMatch | undefined, role: "helper" | "requester"): React.ReactNode {
  if (!m) return <span className="text-orange-400">unmatched</span>;
  if (m.status === "completed") return <span className="text-muted-foreground">completed</span>;
  if (m.status === "approved") {
    const myMark = role === "helper" ? m.helperMarkedComplete : m.requesterMarkedComplete;
    const otherMark = role === "helper" ? m.requesterMarkedComplete : m.helperMarkedComplete;
    if (myMark && !otherMark) return <span className="text-amber-400">waiting on other party to mark complete</span>;
    if (!myMark && otherMark) return <span className="text-amber-400">other party marked complete · confirm to finish</span>;
    return <span className="text-emerald-400">approved · go help now</span>;
  }
  if (m.status === "helper_accepted") {
    return role === "requester"
      ? <span className="text-amber-400">awaiting your confirm</span>
      : <span className="text-amber-400">waiting on requester</span>;
  }
  return <span className="text-sky-400">proposed</span>;
}

function MyRequestRow({
  request,
  match,
  userId,
  onChange,
  completed,
}: {
  request: MapRequest;
  match?: MapMatch;
  userId: number;
  onChange: () => void;
  completed?: boolean;
}) {
  void userId;
  return (
    <div className={cn("text-xs space-y-1", completed && "opacity-50")}>
      <div className="font-medium text-foreground">
        {request.type} · U{request.urgency}
      </div>
      <div className="text-muted-foreground line-clamp-2">{request.description}</div>
      <div className="text-[10px] uppercase tracking-wider">
        {match ? <>{statusLabel(match, "requester")}{match.helperName ? ` · ${match.helperName}` : ""}</> : <span className="text-orange-400">unmatched</span>}
      </div>
      {match && match.status === "approved" && !completed && (
        <CompleteButton match={match} role="requester" onChange={onChange} />
      )}
    </div>
  );
}

function HelpingRow({
  match,
  userId,
  onChange,
  completed,
}: {
  match: MapMatch;
  userId: number;
  onChange: () => void;
  completed?: boolean;
}) {
  void userId;
  return (
    <div className={cn("text-xs space-y-1", completed && "opacity-50")}>
      <div className="font-medium text-foreground">{match.requesterName}</div>
      <div className="text-muted-foreground line-clamp-2">{match.action}</div>
      <div className="text-[10px] uppercase tracking-wider">{statusLabel(match, "helper")}</div>
      {match.status === "approved" && !completed && (
        <CompleteButton match={match} role="helper" onChange={onChange} />
      )}
    </div>
  );
}

function CompleteButton({
  match,
  role,
  onChange,
}: {
  match: MapMatch;
  role: "helper" | "requester";
  onChange: () => void;
}) {
  const myMark = role === "helper" ? match.helperMarkedComplete : match.requesterMarkedComplete;
  const otherMark = role === "helper" ? match.requesterMarkedComplete : match.helperMarkedComplete;
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function mark() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/matches/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: match.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErr(data?.error || `HTTP ${res.status}`);
        return;
      }
      onChange();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "network error");
    } finally {
      setBusy(false);
    }
  }

  if (myMark) {
    return (
      <div className="text-[10px] text-emerald-400">
        ✓ You marked complete{otherMark ? "" : " · waiting on other party"}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <Button size="sm" className="h-7 mt-1" onClick={mark} disabled={busy}>
        {busy ? "Marking..." : otherMark ? "Confirm complete · finish" : "Mark help complete"}
      </Button>
      {err && <div className="text-destructive text-[10px]">{err}</div>}
    </div>
  );
}

function ActivityColumn({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: React.ReactNode[];
}) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
          {title}
        </div>
        {items.length === 0 ? (
          <div className="text-xs text-muted-foreground italic">{empty}</div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">{items}</div>
        )}
      </CardContent>
    </Card>
  );
}

function ConfirmRow({ match, onChange }: { match: MapMatch; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/matches/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: match.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErr(data?.error || `HTTP ${res.status}`);
        return;
      }
      onChange();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="text-xs space-y-1">
      <div className="font-medium text-foreground">{match.helperName}</div>
      <div className="text-muted-foreground line-clamp-2">{match.action}</div>
      <Button size="sm" className="h-7 mt-1" onClick={confirm} disabled={busy}>
        {busy ? "Confirming..." : "Confirm helper · send SMS"}
      </Button>
      {err && <div className="text-destructive text-[10px]">{err}</div>}
    </div>
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

function NeedCard({
  request,
  index,
  matched,
  user,
  onAccepted,
}: {
  request: MapRequest;
  index: number;
  matched: boolean;
  user: SessionUser | null;
  onAccepted: () => void;
}) {
  const urgency = clampUrgency(request.urgency);
  const colors = urgencyColors(urgency);
  const Icon = NEED_ICON[coerceNeedType(request.type)];
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const isOwn = user?.id === request.userId;

  async function accept() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/matches/accept-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: request.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErr(data?.error || `HTTP ${res.status}`);
        return;
      }
      setAccepted(true);
      onAccepted();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "network error");
    } finally {
      setBusy(false);
    }
  }

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
              <span className="font-semibold">{request.userName}</span>
              <Badge variant="outline" className="text-[10px] uppercase">{request.type}</Badge>
            </div>
            <span className={cn("text-xs font-bold rounded px-2 py-0.5", colors.chip)}>U{urgency}</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed">{request.description}</p>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>status: {request.status}</span>
            {matched ? (
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="h-3 w-3" /> matched
              </span>
            ) : (
              <span className="text-orange-400">unmatched</span>
            )}
          </div>
          {!matched && !isOwn && (
            <div className="mt-3">
              {accepted ? (
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Accepted · awaiting requester confirm
                </span>
              ) : user ? (
                <Button size="sm" className="h-8 gap-1" onClick={accept} disabled={busy}>
                  <HandHeart className="h-3.5 w-3.5" />
                  {busy ? "Accepting..." : "Accept this request"}
                </Button>
              ) : (
                <Link href="/login" className="text-xs underline">
                  Log in to accept
                </Link>
              )}
              {err && <div className="text-xs text-destructive mt-1">{err}</div>}
            </div>
          )}
          {isOwn && (
            <div className="mt-2 text-[11px] italic text-muted-foreground">Your request</div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ResourceCard({ provider, index }: { provider: MapProvider; index: number }) {
  const Icon = RESOURCE_ICON[coerceResourceType(provider.type)];
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
            <span className="font-semibold">{provider.userName}</span>
            <Badge variant="outline" className="text-[10px] uppercase">{provider.type}</Badge>
          </div>
          <p className="mt-2 text-sm leading-relaxed">{provider.description}</p>
          <div className="mt-2 text-xs text-muted-foreground">status: {provider.status}</div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function MatchCard({
  match,
  index,
  request,
  provider,
  user,
  onChange,
}: {
  match: MapMatch;
  index: number;
  request: MapRequest | undefined;
  provider: MapProvider | undefined;
  user: SessionUser | null;
  onChange: () => void;
}) {
  const flagged = match.safetyFlag;
  const [busy, setBusy] = useState<"none" | "approving" | "confirming" | "skipped">("none");
  const [err, setErr] = useState<string | null>(null);

  const isRequester = user?.id === match.requestUserId;
  const canApprove = match.status === "proposed" && !!user;
  const canConfirm = match.status === "helper_accepted" && isRequester;

  async function call(path: string, kind: "approving" | "confirming") {
    setBusy(kind);
    setErr(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: match.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErr(data?.error || `HTTP ${res.status}`);
        setBusy("none");
        return;
      }
      onChange();
      setBusy("none");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "network error");
      setBusy("none");
    }
  }

  if (busy === "skipped") return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Card className={cn(flagged ? "border-2 border-red-500/80 bg-red-500/5" : "border-border")}>
        <CardContent className="p-4">
          {flagged && (
            <div className="flex items-center gap-2 mb-2 text-red-400 text-xs font-semibold uppercase tracking-wider">
              <ShieldAlert className="h-4 w-4" />
              Safety review required
            </div>
          )}
          <div className="flex items-center justify-between gap-2 mb-1">
            <Badge variant="outline" className="text-[10px] uppercase">
              {match.status === "approved"
                ? "approved · go help"
                : match.status === "helper_accepted"
                  ? "awaiting requester"
                  : "proposed"}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              conf {(match.confidence * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-sm font-medium leading-relaxed">{match.action}</p>
          <div className="mt-2 text-xs text-muted-foreground space-y-1">
            <div>
              <span className="text-foreground/80">Helper:</span> {match.helperName}
              {" → "}
              <span className="text-foreground/80">Recipient:</span> {match.requesterName}
            </div>
            {request && <div className="opacity-80">Request: {request.description}</div>}
            {provider && <div className="opacity-80">Offering: {provider.description}</div>}
          </div>
          {flagged && match.safetyNote && (
            <div className="mt-2 rounded border border-red-500/40 bg-red-500/10 p-2 text-xs text-red-200">
              <strong>Note:</strong> {match.safetyNote}
            </div>
          )}
          <div className="mt-3 flex items-center gap-2">
            {match.status === "approved" ? (
              <span className="text-xs flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="h-3 w-3" /> Approved · helper notified
              </span>
            ) : match.status === "helper_accepted" ? (
              canConfirm ? (
                <Button
                  size="sm"
                  className="h-8"
                  onClick={() => call("/api/matches/confirm", "confirming")}
                  disabled={busy !== "none"}
                >
                  {busy === "confirming" ? "Confirming..." : "Confirm helper"}
                </Button>
              ) : (
                <span className="text-xs text-amber-400">
                  Waiting on {match.requesterName} to confirm.
                </span>
              )
            ) : canApprove ? (
              <>
                <Button
                  size="sm"
                  className="h-8"
                  onClick={() => call("/api/matches/approve", "approving")}
                  disabled={busy !== "none"}
                >
                  {busy === "approving" ? "Accepting..." : "Accept (I'm the helper)"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8"
                  onClick={() => setBusy("skipped")}
                  disabled={busy !== "none"}
                >
                  Skip
                </Button>
              </>
            ) : (
              <Link href="/login" className="text-xs underline">
                Log in to accept
              </Link>
            )}
          </div>
          {err && <div className="mt-2 text-xs text-destructive">Error: {err}</div>}
          <div className="mt-3 text-[11px] text-muted-foreground italic">
            Suggestion only — both parties confirm before help begins.
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
