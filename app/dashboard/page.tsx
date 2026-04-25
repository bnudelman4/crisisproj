"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  BellDot,
  CheckCircle2,
  ChevronDown,
  CircleUserRound,
  HandHeart,
  ListOrdered,
  LogOut,
  MapPinned,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NeedType, ResourceType } from "@/lib/types";
import { NEED_ICON, urgencyColors } from "@/lib/icons";

const CrisisMap = dynamic(() => import("@/components/map/CrisisMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[560px] flex items-center justify-center text-ink-on-inverse-muted">
      Loading map...
    </div>
  ),
});

const REFRESH_MS = 15_000;
type Tab = "map" | "feed" | "compose" | "alerts" | "you";

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
function coerceNeedType(v: string): NeedType {
  return (NEED_TYPES as string[]).includes(v) ? (v as NeedType) : "other";
}
const RESOURCE_TYPES: ResourceType[] = ["car", "food", "money", "time", "skill"];
function coerceResourceType(v: string): ResourceType {
  return (RESOURCE_TYPES as string[]).includes(v) ? (v as ResourceType) : "skill";
}
function clampU(u: number): 1 | 2 | 3 | 4 | 5 {
  return Math.max(1, Math.min(5, Math.round(u))) as 1 | 2 | 3 | 4 | 5;
}

export default function DashboardPage() {
  const router = useRouter();
  const [payload, setPayload] = useState<MapPayload | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [locationLabel, setLocationLabel] = useState<string>("");
  const [tab, setTab] = useState<Tab>("feed");

  async function fetchData(): Promise<MapPayload | null> {
    try {
      const res = await fetch("/api/map", { cache: "no-store" });
      if (!res.ok) return null;
      const json = (await res.json()) as MapPayload;
      setPayload(json);
      return json;
    } catch {
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
    router.replace("/login");
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
      <main className="min-h-[100svh] flex items-center justify-center bg-canvas">
        <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-tertiary">
          {seeding ? "Seeding demo data..." : "Loading dashboard..."}
        </div>
      </main>
    );
  }

  const matchedRequestIds = new Set<number>([
    ...payload.matches.filter((m) => m.status !== "proposed").map((m) => m.requestId),
    ...payload.requests.filter((r) => r.status === "matched" || r.status === "completed").map((r) => r.id),
  ]);

  const unreadAlerts = payload.matches.filter(
    (m) => m.status === "helper_accepted" && user && m.requestUserId === user.id
  ).length;

  return (
    <main
      className="relative min-h-[100svh] w-full"
      style={{
        background:
          "radial-gradient(60% 40% at 50% 0%, rgba(91,141,239,0.10) 0%, var(--bg-inverse) 60%)",
        color: "var(--text-on-inverse)",
      }}
    >
      <div className="relative mx-auto max-w-[1280px] px-4 md:px-8 pt-10 pb-16">
        <header className="flex items-center justify-between gap-4 mb-6">
          <div className="min-w-0">
            <span className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-on-inverse-muted">
              Bridge · live coordination
            </span>
            <h1
              className="mt-1 font-display text-ink-on-inverse"
              style={{ fontWeight: 500, fontSize: "clamp(26px, 3vw, 34px)", letterSpacing: "-0.025em", lineHeight: 1.05 }}
            >
              {user ? `Hey ${user.name.split(" ")[0]} — what's happening near you.` : "Coordination, not chaos."}
            </h1>
            <p className="mt-2 text-[13.5px] text-ink-on-inverse-muted">
              {locationLabel || (user ? `${user.lat.toFixed(2)}, ${user.lng.toFixed(2)}` : "Your area")} · auto-refreshes every 15s
            </p>
          </div>
          <button
            onClick={fetchData}
            className="hidden md:inline-flex items-center gap-2 h-8 px-3 rounded-md border border-on-inverse text-ink-on-inverse hover:bg-white/[0.05] text-[12.5px]"
          >
            <RefreshCw size={13} strokeWidth={1.6} /> Refresh
          </button>
        </header>

        <AppShell
          active={tab}
          onNavigate={setTab}
          alertsCount={unreadAlerts}
          user={user}
          onLogout={logout}
        >
          {tab === "map" && <MapTab user={user} onChange={fetchData} />}
          {tab === "feed" && (
            <FeedTab
              payload={payload}
              user={user}
              matchedRequestIds={matchedRequestIds}
              onChange={fetchData}
            />
          )}
          {tab === "compose" && <ComposeTab user={user} />}
          {tab === "alerts" && (
            <AlertsTab payload={payload} user={user} onChange={fetchData} />
          )}
          {tab === "you" && <YouTab payload={payload} user={user} onChange={fetchData} />}
        </AppShell>

        <p className="mt-6 font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-on-inverse-muted text-center">
          Bridge supports human coordination. It does not replace 911 or official emergency response.
        </p>
      </div>

      <button
        type="button"
        onClick={runReset}
        disabled={seeding}
        title="Reset demo data"
        className="fixed bottom-2 right-2 z-50 text-[9px] uppercase tracking-wider text-ink-on-inverse-muted/30 hover:text-ink-on-inverse-muted transition-colors px-1.5 py-0.5 rounded"
      >
        {seeding ? "resetting…" : "reset"}
      </button>
    </main>
  );
}

function AppShell({
  children,
  active,
  onNavigate,
  alertsCount,
  user,
  onLogout,
}: {
  children: React.ReactNode;
  active: Tab;
  onNavigate: (t: Tab) => void;
  alertsCount: number;
  user: SessionUser | null;
  onLogout: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const initials = user?.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "??";
  const displayName = user?.name ?? "Anonymous";
  const tabs: Array<{ id: Tab; label: string; icon: typeof MapPinned }> = [
    { id: "map", label: "Map", icon: MapPinned },
    { id: "feed", label: "Feed", icon: ListOrdered },
    { id: "compose", label: "Compose", icon: Plus },
    { id: "alerts", label: "Alerts", icon: BellDot },
    { id: "you", label: "You", icon: CircleUserRound },
  ];

  return (
    <div
      className="rounded-3xl overflow-hidden border bg-inverse-card shadow-[0_30px_120px_-30px_rgba(0,0,0,0.55)]"
      style={{ borderColor: "var(--border-strong)" }}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-on-inverse">
        <div className="flex items-center gap-3 min-w-0">
          <div className="inline-flex items-center gap-2.5">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-on-inverse">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-emphasis animate-pulse" />
            </span>
            <span className="font-display text-[16px] tracking-display text-ink-on-inverse" style={{ fontWeight: 500 }}>
              Bridge
            </span>
          </div>
          <span aria-hidden className="h-4 w-px bg-white/10" />
          <span className="font-mono text-[10.5px] tracking-[0.18em] uppercase truncate text-ink-on-inverse-muted">
            Live mutual aid · room
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-2.5 h-7 rounded-md border border-on-inverse">
            <Search size={12} strokeWidth={1.6} className="text-ink-on-inverse-muted" />
            <span className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-ink-on-inverse-muted">
              Search needs, offers, helpers
            </span>
            <kbd className="font-mono text-[10px] ml-2 border border-white/10 px-1 rounded text-ink-on-inverse-muted">⌘K</kbd>
          </div>
          <span className="hidden md:inline-flex items-center gap-2 font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-on-inverse-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-emphasis animate-pulse" />
            Member · {displayName}
          </span>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 h-7 pl-1 pr-2 rounded-full bg-white/[0.05] hover:bg-white/[0.09] text-ink-on-inverse"
            >
              <span className="h-5 w-5 rounded-full inline-flex items-center justify-center font-mono text-[10px] bg-white/10">
                {initials}
              </span>
              <ChevronDown size={12} strokeWidth={1.6} />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute right-0 mt-2 w-56 rounded-xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)] z-50 overflow-hidden bg-inverse-elevated border border-on-inverse text-ink-on-inverse"
                >
                  <div className="px-3 py-2.5 border-b border-on-inverse">
                    <div className="text-[12.5px] font-medium truncate">{displayName}</div>
                    <div className="text-[11px] truncate text-ink-on-inverse-muted">{user?.phone}</div>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[12.5px] hover:bg-white/[0.05]"
                  >
                    <UserIcon size={13} strokeWidth={1.6} /> My profile
                  </Link>
                  <button
                    onClick={() => { setMenuOpen(false); onLogout(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[12.5px] hover:bg-white/[0.05] border-t border-on-inverse text-ink-on-inverse-muted hover:text-ink-on-inverse"
                  >
                    <LogOut size={13} strokeWidth={1.6} /> Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr]">
        <nav className="border-r border-on-inverse p-2 md:p-3 flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible">
          {tabs.map((t) => {
            const Icon = t.icon;
            const activeTab = active === t.id;
            const isCompose = t.id === "compose";
            const isAlerts = t.id === "alerts";
            return (
              <button
                key={t.id}
                onClick={() => onNavigate(t.id)}
                className={cn(
                  "group inline-flex md:flex items-center gap-2.5 rounded-lg px-2.5 h-9 text-[12.5px] font-medium transition-colors whitespace-nowrap",
                  activeTab
                    ? "bg-white/[0.06] text-ink-on-inverse"
                    : "text-ink-on-inverse-muted hover:text-ink-on-inverse hover:bg-white/[0.04]"
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-6 w-6 items-center justify-center rounded-md",
                    isCompose ? (activeTab ? "bg-elevated text-ink" : "bg-white/[0.08] text-ink-on-inverse") : ""
                  )}
                >
                  <Icon size={14} strokeWidth={1.6} />
                </span>
                <span>{t.label}</span>
                {isAlerts && alertsCount > 0 && (
                  <span
                    className="ml-auto inline-flex items-center justify-center h-4 min-w-[18px] px-1 rounded-full font-mono text-[10px]"
                    style={{ background: "var(--signal-critical)", color: "white" }}
                  >
                    {alertsCount}
                  </span>
                )}
              </button>
            );
          })}
          <div className="hidden md:block mt-auto pt-3 px-2.5 font-mono text-[10px] tracking-[0.18em] uppercase text-ink-on-inverse-muted">
            Demo · simulation
          </div>
        </nav>

        <div className="min-w-0 p-4 md:p-6 bg-inverse">{children}</div>
      </div>
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-on-inverse-muted">
      {children}
    </span>
  );
}

function MapTab({
  user,
  onChange,
}: {
  user: SessionUser | null;
  onChange: () => void;
}) {
  return (
    <div>
      <Eyebrow>Live Map</Eyebrow>
      <h2 className="mt-1 font-display text-ink-on-inverse text-[22px]" style={{ fontWeight: 500 }}>
        Needs, offers, and matches around you.
      </h2>
      <p className="mt-1 text-[13px] text-ink-on-inverse-muted">
        Click any pin for details. Open requests can be accepted directly.
      </p>
      <div className="mt-4 rounded-2xl overflow-hidden border border-on-inverse">
        <CrisisMap user={user} onChange={onChange} />
      </div>
    </div>
  );
}

function FeedTab({
  payload,
  user,
  matchedRequestIds,
  onChange,
}: {
  payload: MapPayload;
  user: SessionUser | null;
  matchedRequestIds: Set<number>;
  onChange: () => void;
}) {
  const others = payload.requests
    .filter((r) => !user || r.userId !== user.id)
    .sort((a, b) => b.urgency - a.urgency);
  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>Open requests near you · accept any</Eyebrow>
        <h2 className="mt-1 font-display text-ink-on-inverse text-[22px]" style={{ fontWeight: 500 }}>
          {others.length} need{others.length === 1 ? "" : "s"} from neighbors.
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {others.map((r, i) => (
          <NeedCardDark
            key={r.id}
            request={r}
            index={i}
            user={user}
            matched={matchedRequestIds.has(r.id)}
            onChange={onChange}
          />
        ))}
        {others.length === 0 && (
          <div className="rounded-xl border border-on-inverse bg-inverse-card p-4 text-[13px] text-ink-on-inverse-muted">
            Nothing open right now.
          </div>
        )}
      </div>

      <div>
        <Eyebrow>Available helpers nearby</Eyebrow>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          {payload.providers.map((p) => (
            <ProviderCardDark key={p.id} provider={p} />
          ))}
          {payload.providers.length === 0 && (
            <div className="rounded-xl border border-on-inverse bg-inverse-card p-4 text-[13px] text-ink-on-inverse-muted">
              No helpers registered.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ComposeTab({ user }: { user: SessionUser | null }) {
  return (
    <div className="max-w-2xl">
      <Eyebrow>Compose · post a need or offer</Eyebrow>
      <h2 className="mt-1 font-display text-ink-on-inverse text-[22px]" style={{ fontWeight: 500 }}>
        Post a need or offer help.
      </h2>
      <p className="mt-1 text-[13px] text-ink-on-inverse-muted">
        Quickest way: text the WhatsApp bot. We&apos;ll classify and post for you.
      </p>
      <div className="mt-5 rounded-xl border border-on-inverse bg-inverse-card p-4">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.08] text-ink-on-inverse shrink-0">
            <Send size={16} strokeWidth={1.6} />
          </span>
          <div>
            <div className="text-[14px] font-medium text-ink-on-inverse">WhatsApp the sandbox</div>
            <div className="mt-1 text-[12.5px] text-ink-on-inverse-muted">
              Send any message describing your need or what you can offer to{" "}
              <span className="font-mono text-ink-on-inverse">+1 415 523 8886</span>. Logged in as{" "}
              <span className="text-ink-on-inverse">{user?.phone ?? "—"}</span>, your reply auto-posts.
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 rounded-xl border border-on-inverse bg-inverse-card p-4 text-[12.5px] text-ink-on-inverse-muted">
        Web compose form coming soon.
      </div>
    </div>
  );
}

function AlertsTab({
  payload,
  user,
  onChange,
}: {
  payload: MapPayload;
  user: SessionUser | null;
  onChange: () => void;
}) {
  const incoming = payload.matches.filter(
    (m) => user && m.requestUserId === user.id && m.status === "helper_accepted"
  );
  const flagged = payload.matches.filter((m) => m.safetyFlag && m.status !== "completed");
  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>Awaiting your confirmation</Eyebrow>
        <h2 className="mt-1 font-display text-ink-on-inverse text-[22px]" style={{ fontWeight: 500 }}>
          {incoming.length} match{incoming.length === 1 ? "" : "es"} waiting on you.
        </h2>
      </div>
      <div className="space-y-3">
        {incoming.map((m) => (
          <ConfirmCard key={m.id} match={m} onChange={onChange} />
        ))}
        {incoming.length === 0 && (
          <div className="rounded-xl border border-on-inverse bg-inverse-card p-4 text-[13px] text-ink-on-inverse-muted">
            All clear. No pending confirmations.
          </div>
        )}
      </div>

      {flagged.length > 0 && (
        <div>
          <Eyebrow>Safety flags</Eyebrow>
          <div className="mt-3 space-y-3">
            {flagged.map((m) => (
              <div key={m.id} className="rounded-xl border-2 border-red-500/60 bg-red-500/5 p-4">
                <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.18em] text-red-400">
                  <ShieldAlert size={12} strokeWidth={1.7} />
                  Safety review required
                </div>
                <div className="mt-2 text-[13.5px] text-ink-on-inverse">{m.action}</div>
                {m.safetyNote && <div className="mt-1 text-[12px] text-red-200/80">{m.safetyNote}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function YouTab({
  payload,
  user,
  onChange,
}: {
  payload: MapPayload;
  user: SessionUser | null;
  onChange: () => void;
}) {
  if (!user) return null;
  const myRequests = payload.requests.filter((r) => r.userId === user.id);
  const helpingMatches = payload.matches.filter((m) => m.helperUserId === user.id);
  const completedRequests = myRequests.filter((r) =>
    payload.matches.some((m) => m.requestId === r.id && m.status === "completed")
  );
  const activeRequests = myRequests.filter((r) => !completedRequests.includes(r));
  const helpingActive = helpingMatches.filter((m) => m.status !== "completed");
  const helpingCompleted = helpingMatches.filter((m) => m.status === "completed");

  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>You · {user.name} · {user.phone}</Eyebrow>
        <h2 className="mt-1 font-display text-ink-on-inverse text-[22px]" style={{ fontWeight: 500 }}>
          Your requests and the help you&apos;re providing.
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Panel title="My requests">
          {activeRequests.map((r) => {
            const m = payload.matches.find((mm) => mm.requestId === r.id);
            return <MyRequestRow key={r.id} request={r} match={m} onChange={onChange} />;
          })}
          {completedRequests.map((r) => {
            const m = payload.matches.find((mm) => mm.requestId === r.id);
            return <MyRequestRow key={r.id} request={r} match={m} onChange={onChange} completed />;
          })}
          {myRequests.length === 0 && <Empty text="No requests submitted." />}
        </Panel>
        <Panel title="I'm helping">
          {helpingActive.map((m) => (
            <HelpingRow key={m.id} match={m} onChange={onChange} />
          ))}
          {helpingCompleted.map((m) => (
            <HelpingRow key={m.id} match={m} onChange={onChange} completed />
          ))}
          {helpingMatches.length === 0 && <Empty text="Not helping anyone yet." />}
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-on-inverse bg-inverse-card p-4">
      <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-on-inverse-muted mb-3">
        {title}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return <div className="text-[12.5px] italic text-ink-on-inverse-muted">{text}</div>;
}

function urgencyTone(u: number) {
  if (u >= 5) return { dot: "#EF4444", chip: "bg-red-500 text-white" };
  if (u === 4) return { dot: "#F97316", chip: "bg-orange-500 text-white" };
  if (u === 3) return { dot: "#EAB308", chip: "bg-yellow-500 text-black" };
  return { dot: "#10B981", chip: "bg-emerald-500 text-white" };
}

function NeedCardDark({
  request,
  index,
  user,
  matched,
  onChange,
}: {
  request: MapRequest;
  index: number;
  user: SessionUser | null;
  matched: boolean;
  onChange: () => void;
}) {
  const urgency = clampU(request.urgency);
  const tone = urgencyTone(urgency);
  const Icon = NEED_ICON[coerceNeedType(request.type)];
  const [busy, setBusy] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [err, setErr] = useState<string | null>(null);

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
      onChange();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="rounded-xl border border-on-inverse bg-inverse-card p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.06]">
            <Icon size={13} strokeWidth={1.7} className="text-ink-on-inverse" />
          </span>
          <div className="min-w-0">
            <div className="text-[13.5px] font-medium text-ink-on-inverse truncate">{request.userName}</div>
            <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink-on-inverse-muted">
              {request.type}
            </div>
          </div>
        </div>
        <span className={cn("inline-flex items-center justify-center px-2 h-5 rounded font-mono text-[10px]", tone.chip)}>
          U{urgency}
        </span>
      </div>
      <p className="mt-3 text-[13px] leading-[1.55] text-ink-on-inverse">{request.description}</p>
      <div className="mt-3 flex items-center justify-between text-[11px] text-ink-on-inverse-muted">
        <span>status · {request.status}</span>
        {matched ? (
          <span className="inline-flex items-center gap-1 text-emerald-400">
            <CheckCircle2 size={11} strokeWidth={1.7} /> matched
          </span>
        ) : (
          <span className="text-orange-400">unmatched</span>
        )}
      </div>
      <div className="mt-3">
        {accepted ? (
          <span className="inline-flex items-center gap-1 text-[12px] text-emerald-400">
            <CheckCircle2 size={12} strokeWidth={1.7} /> Accepted · awaiting requester
          </span>
        ) : !user ? (
          <Link href="/login" className="text-[12px] underline text-ink-on-inverse-muted">
            Log in to accept
          </Link>
        ) : user.id === request.userId ? (
          <span className="text-[11px] italic text-ink-on-inverse-muted">Your request</span>
        ) : matched ? null : (
          <button
            onClick={accept}
            disabled={busy}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-white text-black text-[12.5px] font-medium hover:bg-white/90 disabled:opacity-60"
          >
            <HandHeart size={13} strokeWidth={1.7} />
            {busy ? "Accepting..." : "Accept"}
          </button>
        )}
        {err && <div className="mt-2 text-[11px] text-red-400">{err}</div>}
      </div>
    </motion.div>
  );
}

function ProviderCardDark({ provider }: { provider: MapProvider }) {
  const t = coerceResourceType(provider.type);
  void t;
  return (
    <div className="rounded-xl border border-on-inverse bg-inverse-card p-4">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        <div className="min-w-0">
          <div className="text-[13.5px] font-medium text-ink-on-inverse truncate">{provider.userName}</div>
          <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink-on-inverse-muted">
            offering · {provider.type}
          </div>
        </div>
      </div>
      <p className="mt-3 text-[13px] leading-[1.55] text-ink-on-inverse">{provider.description}</p>
      <div className="mt-2 text-[11px] text-ink-on-inverse-muted">{provider.status}</div>
    </div>
  );
}

function ConfirmCard({ match, onChange }: { match: MapMatch; onChange: () => void }) {
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
    <div className="rounded-xl border border-on-inverse bg-inverse-card p-4">
      <div className="flex items-center gap-2 font-mono text-[10.5px] tracking-[0.18em] uppercase text-amber-300">
        <ShieldCheck size={12} strokeWidth={1.7} />
        Helper accepted · awaiting your confirm
      </div>
      <div className="mt-2 text-[14px] font-medium text-ink-on-inverse">{match.helperName}</div>
      <div className="mt-1 text-[13px] text-ink-on-inverse-muted">{match.action}</div>
      <button
        onClick={confirm}
        disabled={busy}
        className="mt-3 inline-flex items-center h-8 px-3 rounded-md bg-white text-black text-[12.5px] font-medium hover:bg-white/90 disabled:opacity-60"
      >
        {busy ? "Confirming..." : "Confirm helper"}
      </button>
      {err && <div className="mt-2 text-[11px] text-red-400">{err}</div>}
    </div>
  );
}

function statusLabel(m: MapMatch | undefined, role: "helper" | "requester"): React.ReactNode {
  if (!m) return <span className="text-orange-400">unmatched</span>;
  if (m.status === "completed") return <span className="text-ink-on-inverse-muted">completed</span>;
  if (m.status === "approved") {
    const myMark = role === "helper" ? m.helperMarkedComplete : m.requesterMarkedComplete;
    const otherMark = role === "helper" ? m.requesterMarkedComplete : m.helperMarkedComplete;
    if (myMark && !otherMark) return <span className="text-amber-400">waiting on other party</span>;
    if (!myMark && otherMark) return <span className="text-amber-400">other marked · confirm</span>;
    return <span className="text-emerald-400">approved · go help</span>;
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
  onChange,
  completed,
}: {
  request: MapRequest;
  match?: MapMatch;
  onChange: () => void;
  completed?: boolean;
}) {
  const colors = urgencyColors(clampU(request.urgency));
  void colors;
  return (
    <div className={cn("rounded-lg border border-on-inverse p-3", completed && "opacity-50")}>
      <div className="flex items-center justify-between">
        <div className="text-[12.5px] font-medium text-ink-on-inverse">{request.type} · U{request.urgency}</div>
        <div className="font-mono text-[10px] tracking-[0.16em] uppercase">
          {match ? statusLabel(match, "requester") : <span className="text-orange-400">unmatched</span>}
        </div>
      </div>
      <p className="mt-1 text-[12.5px] text-ink-on-inverse-muted line-clamp-2">{request.description}</p>
      {match && match.status === "approved" && !completed && (
        <CompleteButtonDark match={match} role="requester" onChange={onChange} />
      )}
    </div>
  );
}

function HelpingRow({
  match,
  onChange,
  completed,
}: {
  match: MapMatch;
  onChange: () => void;
  completed?: boolean;
}) {
  return (
    <div className={cn("rounded-lg border border-on-inverse p-3", completed && "opacity-50")}>
      <div className="flex items-center justify-between">
        <div className="text-[12.5px] font-medium text-ink-on-inverse">{match.requesterName}</div>
        <div className="font-mono text-[10px] tracking-[0.16em] uppercase">{statusLabel(match, "helper")}</div>
      </div>
      <p className="mt-1 text-[12.5px] text-ink-on-inverse-muted line-clamp-2">{match.action}</p>
      {match.status === "approved" && !completed && (
        <CompleteButtonDark match={match} role="helper" onChange={onChange} />
      )}
    </div>
  );
}

function CompleteButtonDark({
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
      <div className="mt-2 text-[10.5px] text-emerald-400">
        ✓ Marked complete{otherMark ? "" : " · waiting on other party"}
      </div>
    );
  }
  return (
    <div className="mt-2">
      <button
        onClick={mark}
        disabled={busy}
        className="h-7 px-3 rounded-md bg-white text-black text-[11.5px] font-medium hover:bg-white/90 disabled:opacity-60"
      >
        {busy ? "Marking..." : otherMark ? "Confirm complete · finish" : "Mark complete"}
      </button>
      {err && <div className="mt-1 text-[10.5px] text-red-400">{err}</div>}
    </div>
  );
}

void AlertTriangle;
