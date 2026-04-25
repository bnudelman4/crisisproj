"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { sampleMatches, Match } from "@/lib/safety";
import { feed as initialFeed, FeedItem, alerts as initialAlerts, AppAlert } from "@/lib/feed";
import { adaptResult } from "@/lib/adapters";
import type { AnalyzeResult } from "@/lib/backend/types";
import type { DisasterEvent } from "@/lib/backend/disasters";

/**
 * Live data pulled from the backend's /api/map/data and /api/disasters/active.
 * Held alongside the seeded demo state so the Sam ↔ Leo flow keeps working
 * while the dashboard also reflects whatever is in the SQLite store.
 */
export type LivePin = {
  id: number;
  userId: number;
  type: string;
  description: string;
  status: string;
  urgency?: number;
  lat: number;
  lng: number;
};

export type LiveMatchPin = {
  id: string;
  requestId: number;
  providerId: number;
  status: string;
  lat: number;
  lng: number;
};

export type LiveSnapshot = {
  requests: LivePin[];
  providers: LivePin[];
  matches: LiveMatchPin[];
  disasters: DisasterEvent[];
  fetchedAt: number;
  status: "idle" | "loading" | "ready" | "error";
  error?: string;
};

export type AnalyzeStatus = "idle" | "running" | "done" | "error";

type ProductState = {
  matches: Record<string, Match>;
  feed: FeedItem[];
  alerts: AppAlert[];
  live: LiveSnapshot;
  analyzeStatus: AnalyzeStatus;
  analyzeError: string | null;
  lastAnalyzed: AnalyzeResult | null;
  approveMatch: (id: string, locationId?: string) => void | Promise<void>;
  blockMatch: (id: string, reason?: string) => void;
  requestMoreInfo: (id: string) => void;
  resetDemo: () => void;
  refreshLive: () => Promise<void>;
  analyzeMessages: (raw: string) => Promise<AnalyzeResult | null>;
  registerHelper: (input: {
    name: string;
    phone: string;
    lat: number;
    lng: number;
  }) => Promise<{ ok: boolean; error?: string }>;
};

const Ctx = createContext<ProductState | null>(null);

const REFRESH_MS = 30_000;

function emptyLive(): LiveSnapshot {
  return {
    requests: [],
    providers: [],
    matches: [],
    disasters: [],
    fetchedAt: 0,
    status: "idle",
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [matches, setMatches] = useState<Record<string, Match>>(() =>
    Object.fromEntries(sampleMatches.map((m) => [m.id, m]))
  );
  const [feed, setFeed] = useState<FeedItem[]>(initialFeed);
  const [alerts, setAlerts] = useState<AppAlert[]>(initialAlerts);
  const [live, setLive] = useState<LiveSnapshot>(emptyLive);
  const [analyzeStatus, setAnalyzeStatus] = useState<AnalyzeStatus>("idle");
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [lastAnalyzed, setLastAnalyzed] = useState<AnalyzeResult | null>(null);

  const refreshLive = useCallback(async () => {
    setLive((prev) => ({ ...prev, status: prev.fetchedAt ? prev.status : "loading" }));
    try {
      const [mapRes, disasterRes] = await Promise.all([
        fetch("/api/map/data", { cache: "no-store" }),
        fetch("/api/disasters/active", { cache: "no-store" }),
      ]);
      if (!mapRes.ok) throw new Error(`map data ${mapRes.status}`);
      const mapJson = (await mapRes.json()) as {
        requests: LivePin[];
        providers: LivePin[];
        matches: LiveMatchPin[];
      };
      const disasterJson = disasterRes.ok
        ? ((await disasterRes.json()) as { events: DisasterEvent[] })
        : { events: [] };
      setLive({
        requests: mapJson.requests ?? [],
        providers: mapJson.providers ?? [],
        matches: mapJson.matches ?? [],
        disasters: disasterJson.events ?? [],
        fetchedAt: Date.now(),
        status: "ready",
      });
    } catch (e) {
      setLive((prev) => ({
        ...prev,
        status: "error",
        error: e instanceof Error ? e.message : "Network error",
      }));
    }
  }, []);

  useEffect(() => {
    void refreshLive();
    const id = window.setInterval(() => void refreshLive(), REFRESH_MS);
    return () => window.clearInterval(id);
  }, [refreshLive]);

  const approveMatch = async (id: string, locationId?: string) => {
    setMatches((prev) => {
      const m = prev[id];
      if (!m) return prev;
      return {
        ...prev,
        [id]: {
          ...m,
          status: "approved",
          positives: Array.from(new Set([...m.positives, "public-location", "helper-accepted", "exact-confirmed"])),
        },
      };
    });
    setAlerts((prev) => [
      {
        id: `a-${Date.now()}`,
        kind: "match",
        tone: "ok",
        title: `Safety plan approved · ${id.replace("match-", "").replace("-", " ↔ ")}`,
        body: "AI message draft prepared. Privacy guard active. Helper notified through coordinator.",
        postedAt: "Just now",
        matchId: id,
      },
      ...prev,
    ]);
    setFeed((prev) => [
      {
        id: `feed-${Date.now()}`,
        kind: "match",
        source: "App",
        zone: "Coordinator desk",
        zoneCode: "CD",
        postedAt: "Just now",
        author: { name: "Coordinator desk", initials: "CD" },
        title: `Safety plan approved · match ${id.replace("match-", "")}`,
        body: "Public handoff confirmed. AI draft sent. Exact details remain hidden until both sides accept.",
        urgency: "standard",
        matchId: id,
        privateAddressHidden: true,
        reactions: { care: 0, help: 0 },
      },
      ...prev,
    ]);

    try {
      void locationId;
      await fetch("/api/matches/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: id,
          requestId: id,
          providerId: id,
        }),
      });
    } catch {
      // network failure is non-fatal in demo mode — UI already flipped
    }
  };

  const blockMatch = (id: string, reason?: string) => {
    setMatches((prev) => {
      const m = prev[id];
      if (!m) return prev;
      return {
        ...prev,
        [id]: {
          ...m,
          status: "blocked",
          blockedReason: reason ?? m.blockedReason ?? "Blocked by coordinator until safer plan is in place.",
        },
      };
    });
  };

  const requestMoreInfo = (id: string) => {
    setAlerts((prev) => [
      {
        id: `a-${Date.now()}`,
        kind: "safety",
        tone: "warn",
        title: `Coordinator requested more info · ${id.replace("match-", "").replace("-", " ↔ ")}`,
        body: "Helper and requester pinged for confirmation. Match held until details are received.",
        postedAt: "Just now",
        matchId: id,
      },
      ...prev,
    ]);
  };

  const resetDemo = () => {
    setMatches(Object.fromEntries(sampleMatches.map((m) => [m.id, m])));
    setFeed(initialFeed);
    setAlerts(initialAlerts);
    setLastAnalyzed(null);
    setAnalyzeStatus("idle");
    setAnalyzeError(null);
  };

  const analyzeMessages = useCallback<ProductState["analyzeMessages"]>(async (raw) => {
    const text = raw.trim();
    if (!text) {
      setAnalyzeError("Paste at least one message first.");
      return null;
    }
    setAnalyzeStatus("running");
    setAnalyzeError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: text }),
      });
      const data = (await res.json()) as Partial<AnalyzeResult> & { error?: string };
      if (!res.ok || !data || !Array.isArray((data as AnalyzeResult).needs)) {
        throw new Error(data?.error || `Analyze failed (HTTP ${res.status})`);
      }
      const result = data as AnalyzeResult;
      const adapted = adaptResult(result);
      setMatches((prev) => {
        const next = { ...prev };
        for (const m of adapted.matches) next[m.id] = m;
        return next;
      });
      setFeed((prev) => [...adapted.feed, ...prev]);
      setAlerts((prev) => [
        {
          id: `a-${Date.now()}`,
          kind: "broadcast",
          tone: "ok",
          title: `Claude analyzed ${result.summary.totalNeeds} needs · ${result.summary.totalResources} helpers`,
          body: `${result.matches.length} match candidates · ${result.summary.urgentCases} urgent · ${result.summary.safeMatches} safe-by-default`,
          postedAt: "Just now",
        },
        ...prev,
      ]);
      setLastAnalyzed(result);
      setAnalyzeStatus("done");
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Analyze failed";
      setAnalyzeError(msg);
      setAnalyzeStatus("error");
      return null;
    }
  }, []);

  const registerHelper = useCallback<ProductState["registerHelper"]>(async (input) => {
    try {
      const res = await fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok && res.status !== 409) {
        return { ok: false, error: data.error || `HTTP ${res.status}` };
      }
      void refreshLive();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Network error" };
    }
  }, [refreshLive]);

  const value = useMemo<ProductState>(
    () => ({
      matches,
      feed,
      alerts,
      live,
      analyzeStatus,
      analyzeError,
      lastAnalyzed,
      approveMatch,
      blockMatch,
      requestMoreInfo,
      resetDemo,
      refreshLive,
      analyzeMessages,
      registerHelper,
    }),
    [matches, feed, alerts, live, analyzeStatus, analyzeError, lastAnalyzed, refreshLive, analyzeMessages, registerHelper]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
