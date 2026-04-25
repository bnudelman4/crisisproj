/**
 * Adapter — converts the upstream backend's AnalyzeResult schema into the
 * Match / FeedItem shape our UI consumes.
 *
 * The backend returns:
 *   { needs[], resources[], matches[{ needId, resourceId, confidence,
 *     action, safetyFlag, safetyNote }], summary }
 *
 * Our UI expects Match { id, status, needTitle, helper, matchScore,
 * flags[], positives[], recommendedHandoff, handoffOptions, urgency, ... }.
 *
 * The mapping is deliberately conservative: backend's single safetyFlag
 * boolean becomes one input to our typed flag set. Other flags are
 * inferred from the need/resource type and language cues.
 */

import type {
  AnalyzeResult,
  Match as BackendMatch,
  Need,
  Resource,
} from "@/lib/backend/types";
import type {
  HandoffOption,
  Match,
  SafetyFlagId,
} from "@/lib/safety";
import type { FeedItem, FeedKind, FeedSource } from "@/lib/feed";

const URGENCY_LABEL: Record<number, "critical" | "high" | "standard"> = {
  5: "critical",
  4: "critical",
  3: "high",
  2: "standard",
  1: "standard",
};

function urgencyOf(u: number): "critical" | "high" | "standard" {
  return URGENCY_LABEL[Math.max(1, Math.min(5, Math.round(u)))] ?? "standard";
}

const NEED_CATEGORY: Record<Need["type"], Match["needCategory"]> = {
  medicine: "medical",
  ride: "ride",
  shelter: "shelter",
  food: "supplies",
  info: "welfare",
  other: "welfare",
};

function inferFlags(need: Need, _resource: Resource, m: BackendMatch): SafetyFlagId[] {
  const flags = new Set<SafetyFlagId>();
  if (m.safetyFlag) flags.add("unknown-requester");

  if (need.type === "medicine") flags.add("medical-handoff");
  if (need.type === "ride") {
    flags.add("ride-request");
    flags.add("one-on-one");
  }
  if (need.type === "shelter") flags.add("vulnerable-requester");

  const text = `${need.description} ${need.location ?? ""}`.toLowerCase();
  if (/\b(home|dorm|apt|apartment|address|street|avenue|st\.|ave\.)\b/.test(text)) {
    flags.add("private-address");
  }
  if (/\b(grandma|grandmother|grandpa|elderly|elder|alone|child|kid)\b/.test(text)) {
    flags.add("vulnerable-requester");
  }
  if (/\b(night|midnight|2am|3am|4am|am)\b/.test(text)) {
    flags.add("nighttime");
  }
  if (/\b(generator|cash|insulin|medication|electronics)\b/.test(text)) {
    flags.add("high-value-item");
  }

  // Default — any in-person handoff between strangers is one-on-one until
  // the coordinator opts a buddy in.
  if (flags.size === 0 || (flags.has("medical-handoff") && !flags.has("one-on-one"))) {
    flags.add("one-on-one");
  }

  return Array.from(flags);
}

function defaultHandoffOptions(flags: SafetyFlagId[]): HandoffOption[] {
  const opts = new Set<HandoffOption>(["public-meet", "address-hidden", "mark-complete"]);
  if (flags.includes("ride-request")) {
    opts.add("buddy");
    opts.add("share-eta");
  }
  if (flags.includes("medical-handoff") || flags.includes("vulnerable-requester")) {
    opts.add("coord-contact");
    opts.add("share-eta");
  }
  if (flags.includes("high-value-item")) {
    opts.add("no-cash");
  }
  return Array.from(opts);
}

function recommendedHandoff(flags: SafetyFlagId[], need: Need): {
  location: string;
  rationale: string;
} {
  if (flags.includes("ride-request")) {
    return {
      location: "Public pickup point — confirm exact location before approval",
      rationale:
        "Ride requests require an exact pickup point and emergency-status confirmation before any helper is matched.",
    };
  }
  if (flags.includes("medical-handoff")) {
    return {
      location: "Public lobby near the requester's zone",
      rationale:
        "Medical handoffs run through a public, visible location. Exact dorm or home addresses stay hidden until the helper accepts.",
    };
  }
  if (flags.includes("vulnerable-requester")) {
    return {
      location: "Coordinator phone-check first, then a buddy walk-up",
      rationale:
        "Vulnerable-person flag — try phone or coordinator contact before any in-person visit.",
    };
  }
  return {
    location: `Public location near ${need.location ?? "the requester's zone"}`,
    rationale:
      "Default policy: public handoff, exact address hidden until both sides accept.",
  };
}

export function adaptMatch(
  m: BackendMatch,
  need: Need,
  resource: Resource
): Match {
  const flags = inferFlags(need, resource, m);
  const blocked = m.safetyFlag && (flags.includes("ride-request") && flags.includes("medical-handoff"));
  return {
    id: `match-${m.needId}-${m.resourceId}`,
    bestMatch: m.confidence >= 0.85,
    status: blocked ? "blocked" : "review",
    needTitle: need.description.split(/[.!?]/)[0]?.slice(0, 80) || need.description.slice(0, 80),
    needSummary: need.description,
    needCategory: NEED_CATEGORY[need.type] ?? "welfare",
    urgency: urgencyOf(need.urgency),
    postedAt: "just now",
    requester: {
      name: need.person,
      initials: initialsOf(need.person),
      contact: "Coordinator-managed",
      zone: need.location ?? "Zone unknown",
      privateAddress: flags.includes("private-address") ? need.location ?? undefined : undefined,
      notes: m.safetyNote ?? undefined,
      tags: flags,
    },
    helper: {
      name: resource.person,
      initials: initialsOf(resource.person),
      role: resource.description.split(/[.!?]/)[0]?.slice(0, 60) || resource.description,
      distance: "—",
      availability: resource.availability ?? "Available",
      pastAssists: 0,
      verification: "demo",
      contact: "Coordinator-managed",
    },
    matchScore: Math.round(m.confidence * 100),
    flags,
    positives: blocked ? [] : ["public-location", "contact-protected"],
    recommendedHandoff: recommendedHandoff(flags, need),
    handoffOptions: defaultHandoffOptions(flags),
    blockedReason: blocked
      ? "Blocked until exact pickup location and emergency status are confirmed."
      : undefined,
  };
}

export function adaptResult(result: AnalyzeResult): {
  matches: Match[];
  feed: FeedItem[];
} {
  const needById = new Map<string, Need>(result.needs.map((n) => [n.id, n]));
  const resourceById = new Map<string, Resource>(result.resources.map((r) => [r.id, r]));

  const matches: Match[] = [];
  for (const m of result.matches) {
    const n = needById.get(m.needId);
    const r = resourceById.get(m.resourceId);
    if (!n || !r) continue;
    matches.push(adaptMatch(m, n, r));
  }

  const feed: FeedItem[] = [
    ...result.needs.map((n) => needToFeed(n)),
    ...result.resources.map((r) => resourceToFeed(r)),
  ];

  return { matches, feed };
}

const SOURCE_HINTS: Array<{ pattern: RegExp; source: FeedSource }> = [
  { pattern: /\bgroupme\b/i, source: "GroupMe" },
  { pattern: /\bdiscord\b/i, source: "Discord" },
  { pattern: /\bslack\b/i, source: "App" },
  { pattern: /\btwitter\b|@/, source: "App" },
  { pattern: /\bsms\b|^\+\d/, source: "SMS" },
  { pattern: /\bform\b|qr/i, source: "QR" },
];

function detectSource(text: string): FeedSource {
  for (const h of SOURCE_HINTS) {
    if (h.pattern.test(text)) return h.source;
  }
  return "App";
}

function needToFeed(need: Need): FeedItem {
  return {
    id: `feed-need-${need.id}`,
    kind: "need",
    source: detectSource(need.description),
    zone: need.location ?? "Zone unknown",
    zoneCode: zoneCode(need.location ?? ""),
    postedAt: "just now",
    author: { name: need.person, initials: initialsOf(need.person) },
    title: need.description.split(/[.!?]/)[0]?.slice(0, 80) || need.description.slice(0, 80),
    body: need.description,
    urgency: urgencyOf(need.urgency),
    privateAddressHidden: true,
    matchId: undefined,
    reactions: { care: 0, help: 0 },
  };
}

function resourceToFeed(resource: Resource): FeedItem {
  return {
    id: `feed-offer-${resource.id}`,
    kind: "offer",
    source: detectSource(resource.description),
    zone: "Zone shared by helper",
    zoneCode: "CW",
    postedAt: "just now",
    author: { name: resource.person, initials: initialsOf(resource.person) },
    title: resource.description.split(/[.!?]/)[0]?.slice(0, 80) || resource.description.slice(0, 80),
    body: resource.description,
    reactions: { care: 0, help: 0 },
  };
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

function zoneCode(zone: string): string {
  const trim = zone.trim();
  if (!trim) return "CW";
  const parts = trim.split(/\s+/);
  return (parts[0]?.[0] ?? "C") + (parts[1]?.[0] ?? "W");
}
