/**
 * Meetup Safety system — mock state only.
 *
 * Models the rules, score factors, and sample matches that power the
 * landing page demo and the in-app product surface. None of this hits
 * a real backend; everything is pre-populated.
 */

export type SafetyFlagId =
  | "one-on-one"
  | "private-address"
  | "medical-handoff"
  | "ride-request"
  | "vulnerable-requester"
  | "unknown-helper"
  | "unknown-requester"
  | "nighttime"
  | "isolated-location"
  | "high-value-item";

export type SafetyFlag = {
  id: SafetyFlagId;
  label: string;
  risk: string;
  action: string;
  weight: number;
};

export const safetyFlags: Record<SafetyFlagId, SafetyFlag> = {
  "one-on-one": {
    id: "one-on-one",
    label: "One-on-one meetup",
    risk: "Two strangers meeting alone.",
    action:
      "Recommend public place, share trip / contact details, or use coordinator-supervised handoff.",
    weight: -20,
  },
  "private-address": {
    id: "private-address",
    label: "Private address involved",
    risk: "Exact home / dorm address should not be revealed too early.",
    action:
      "Hide exact address until helper accepts and coordinator approves.",
    weight: -15,
  },
  "medical-handoff": {
    id: "medical-handoff",
    label: "Medical item handoff",
    risk: "Sensitive health information and urgent need.",
    action:
      "Confirm requester identity, item details, and a safer handoff location.",
    weight: -15,
  },
  "ride-request": {
    id: "ride-request",
    label: "Ride request",
    risk: "Getting in a stranger's car.",
    action:
      "Require extra confirmation, public pickup, optional buddy, and trip sharing.",
    weight: -25,
  },
  "vulnerable-requester": {
    id: "vulnerable-requester",
    label: "Vulnerable requester",
    risk: "Elderly, minor, disabled, sick, or someone alone.",
    action:
      "Use phone check first or coordinator-supervised response.",
    weight: -15,
  },
  "unknown-helper": {
    id: "unknown-helper",
    label: "Unverified helper",
    risk: "Helper identity / capability not confirmed.",
    action: "Show 'unverified helper' warning, recommend coordinator approval.",
    weight: -10,
  },
  "unknown-requester": {
    id: "unknown-requester",
    label: "Unverified requester",
    risk: "Potential fake request or unsafe meeting.",
    action: "Ask for confirmation before sharing helper details.",
    weight: -10,
  },
  "nighttime": {
    id: "nighttime",
    label: "Nighttime meetup",
    risk: "Higher personal safety risk.",
    action: "Suggest public handoff, buddy system, or coordinator-supervised delivery.",
    weight: -10,
  },
  "isolated-location": {
    id: "isolated-location",
    label: "Isolated location",
    risk: "Low visibility or unsafe area.",
    action: "Recommend changing meetup point to a public location.",
    weight: -10,
  },
  "high-value-item": {
    id: "high-value-item",
    label: "High-value item handoff",
    risk: "Money, medication, electronics, or scarce supplies.",
    action: "Confirm details, use public handoff, avoid exposing personal address.",
    weight: -10,
  },
};

export type SafetyPositive = {
  id: string;
  label: string;
  weight: number;
};

export const safetyPositives: SafetyPositive[] = [
  { id: "public-location", label: "Public location suggested", weight: 20 },
  { id: "exact-confirmed", label: "Exact location confirmed by both", weight: 20 },
  { id: "helper-accepted", label: "Helper accepted handoff terms", weight: 15 },
  { id: "contact-protected", label: "Contact info protected", weight: 15 },
  { id: "buddy-shared", label: "Buddy / contact sharing on", weight: 10 },
  { id: "coord-supervised", label: "Coordinator-supervised handoff", weight: 10 },
];

export type SafetyBand = {
  min: number;
  max: number;
  label: string;
  tone: "ok" | "warn" | "high" | "block";
  description: string;
};

export const safetyBands: SafetyBand[] = [
  { min: 80, max: 100, label: "Safer to review", tone: "ok", description: "Plan looks safe. Coordinator approval still required." },
  { min: 60, max: 79, label: "Needs precautions", tone: "warn", description: "Add safer-handoff steps before approving." },
  { min: 40, max: 59, label: "High caution", tone: "high", description: "Significant risks. Strong precautions required." },
  { min: 0, max: 39, label: "Block until safer plan", tone: "block", description: "Do not approve. Require a safer plan first." },
];

export function bandFor(score: number): SafetyBand {
  return (
    safetyBands.find((b) => score >= b.min && score <= b.max) ?? safetyBands[3]
  );
}

export type HandoffOption =
  | "public-meet"
  | "buddy"
  | "coord-contact"
  | "address-hidden"
  | "share-eta"
  | "no-cash"
  | "mark-complete";

export type LatLng = { lat: number; lng: number };

export type Match = {
  id: string;
  bestMatch?: boolean;
  status:
    | "suggested"
    | "review"
    | "approved"
    | "messaging"
    | "active"
    | "complete"
    | "blocked";
  needTitle: string;
  needSummary: string;
  needCategory: "medical" | "ride" | "supplies" | "welfare" | "shelter";
  /** Approximate publishable coordinates for the request. Exact locations
   *  remain hidden until the coordinator approves the safer handoff plan. */
  needCoord?: LatLng;
  helperCoord?: LatLng;
  handoffCoord?: LatLng;
  requester: {
    name: string;
    initials: string;
    contact: string;
    zone: string;
    privateAddress?: string;
    notes?: string;
    tags: string[];
  };
  helper: {
    name: string;
    initials: string;
    role: string;
    distance: string;
    availability: string;
    pastAssists: number;
    verification: "demo" | "simulated" | "unverified";
    contact: string;
  };
  matchScore: number;
  flags: SafetyFlagId[];
  positives: string[]; // ids from safetyPositives
  recommendedHandoff: {
    location: string;
    rationale: string;
  };
  handoffOptions: HandoffOption[];
  blockedReason?: string;
  postedAt: string;
  urgency: "critical" | "high" | "standard";
};

export const handoffOptionLabels: Record<HandoffOption, string> = {
  "public-meet": "Meet in public",
  "buddy": "Bring a buddy",
  "coord-contact": "Use coordinator as contact",
  "address-hidden": "Hide exact address until accepted",
  "share-eta": "Share ETA with coordinator",
  "no-cash": "No cash exchange",
  "mark-complete": "Mark complete after handoff",
};

export const meetupLocationOptions = [
  { id: "north-lobby", label: "North Campus public lobby", note: "Recommended · public, visible" },
  { id: "library", label: "Central Campus library entrance", note: "Public · staffed" },
  { id: "uris", label: "Uris Hall warm lobby", note: "Public · indoors" },
  { id: "collegetown-cafe", label: "Collegetown public cafe", note: "Public · open until 9pm" },
  { id: "coord-pickup", label: "Coordinator pickup point", note: "Supervised · safest" },
  { id: "custom", label: "Custom location", note: "Type your own" },
];

export function compositeScore(match: Pick<Match, "flags" | "positives">): number {
  const base = 80;
  const positiveSum = match.positives
    .map((id) => safetyPositives.find((p) => p.id === id)?.weight ?? 0)
    .reduce((a, b) => a + b, 0);
  const flagSum = match.flags
    .map((id) => safetyFlags[id]?.weight ?? 0)
    .reduce((a, b) => a + b, 0);
  return Math.max(0, Math.min(100, base + positiveSum + flagSum));
}

// ──────────────────────────────────────────────────────────
// Sample matches used across landing + product
// ──────────────────────────────────────────────────────────

/**
 * Approximate Cornell-area coordinates for the demo. These are not exact
 * personal addresses — the safety system intentionally publishes only zone
 * centroids. Coordinator approval is what unlocks exact handoff details.
 */
export const DEMO_GEO = {
  northCampus: { lat: 42.4574, lng: -76.4805 } satisfies LatLng,
  rpcc: { lat: 42.4585, lng: -76.4793 } satisfies LatLng, // Robert Purcell community center
  centralCampus: { lat: 42.4474, lng: -76.4854 } satisfies LatLng,
  collegetown: { lat: 42.4419, lng: -76.4847 } satisfies LatLng,
  belleSherman: { lat: 42.4423, lng: -76.4694 } satisfies LatLng,
  fallCreek: { lat: 42.4508, lng: -76.4925 } satisfies LatLng,
  default: { lat: 42.4534, lng: -76.4735 } satisfies LatLng,
};

export const sampleMatches: Match[] = [
  {
    id: "match-sam-leo",
    bestMatch: true,
    status: "review",
    needTitle: "Insulin delivered to North Campus",
    needSummary:
      "Refrigerated medication, urgent. Power has been out 3 hours.",
    needCategory: "medical",
    urgency: "critical",
    postedAt: "2 min ago",
    needCoord: DEMO_GEO.northCampus,
    helperCoord: DEMO_GEO.collegetown,
    handoffCoord: DEMO_GEO.rpcc,
    requester: {
      name: "Sam K.",
      initials: "SK",
      contact: "+1 (607) 555-0142",
      zone: "North Campus",
      privateAddress: "Mews Hall · Room 312",
      notes: "Vulnerable-person flag · diabetic · power outage",
      tags: ["vulnerable", "medical"],
    },
    helper: {
      name: "Leo M.",
      initials: "LM",
      role: "Driver · supply runs",
      distance: "1.4 mi",
      availability: "2–5 PM",
      pastAssists: 2,
      verification: "demo",
      contact: "GroupMe · Mutual Aid",
    },
    matchScore: 94,
    flags: ["medical-handoff", "private-address", "one-on-one"],
    positives: ["public-location", "contact-protected", "helper-accepted"],
    recommendedHandoff: {
      location: "North Campus public lobby (Robert Purcell)",
      rationale:
        "Avoids sharing Sam's exact dorm address before confirmation. Public, visible, easy to find.",
    },
    handoffOptions: [
      "public-meet",
      "address-hidden",
      "coord-contact",
      "share-eta",
      "mark-complete",
    ],
  },
  {
    id: "match-nora-ride",
    status: "blocked",
    needTitle: "Ride to urgent care",
    needSummary:
      "Need a ride to off-campus urgent care. Possibly time-sensitive.",
    needCategory: "ride",
    urgency: "high",
    postedAt: "11 min ago",
    needCoord: DEMO_GEO.collegetown,
    helperCoord: DEMO_GEO.centralCampus,
    requester: {
      name: "Nora T.",
      initials: "NT",
      contact: "+1 (607) 555-0188",
      zone: "Collegetown",
      privateAddress: undefined,
      notes: "Pickup location not provided",
      tags: ["medical-context", "ride"],
    },
    helper: {
      name: "Marcus T.",
      initials: "MT",
      role: "Driver · medic-certified",
      distance: "2.1 mi",
      availability: "Available now",
      pastAssists: 5,
      verification: "demo",
      contact: "Discord · #aid-offers",
    },
    matchScore: 71,
    flags: [
      "ride-request",
      "medical-handoff",
      "one-on-one",
      "isolated-location",
    ],
    positives: ["helper-accepted"],
    recommendedHandoff: {
      location: "Pickup location required before approval",
      rationale:
        "Cannot approve a ride without an exact pickup point and confirmation that emergency services are not needed.",
    },
    handoffOptions: ["public-meet", "buddy", "coord-contact", "share-eta"],
    blockedReason:
      "Blocked until exact pickup location and emergency status are confirmed.",
  },
  {
    id: "match-belle-welfare",
    status: "review",
    needTitle: "Welfare check · Belle Sherman",
    needSummary:
      "Anonymous reporter cannot reach grandmother by phone. Lives alone.",
    needCategory: "welfare",
    urgency: "high",
    postedAt: "7 min ago",
    needCoord: DEMO_GEO.belleSherman,
    helperCoord: DEMO_GEO.collegetown,
    requester: {
      name: "Anonymous",
      initials: "AN",
      contact: "QR Form · /r/cornell",
      zone: "Belle Sherman",
      notes: "Vulnerable elder · no recent contact · phone goes to voicemail",
      tags: ["vulnerable", "welfare"],
    },
    helper: {
      name: "Hana W.",
      initials: "HW",
      role: "Walk-up · ASL, escort",
      distance: "0.5 mi",
      availability: "Available now",
      pastAssists: 4,
      verification: "demo",
      contact: "GroupMe · Mutual Aid",
    },
    matchScore: 66,
    flags: [
      "vulnerable-requester",
      "private-address",
      "unknown-requester",
    ],
    positives: ["coord-supervised", "contact-protected"],
    recommendedHandoff: {
      location: "Coordinator phone-check first, then door knock with buddy",
      rationale:
        "Vulnerable elder. Try phone contact through coordinator before any in-person visit.",
    },
    handoffOptions: ["coord-contact", "buddy", "share-eta"],
  },
  {
    id: "match-priya-water",
    status: "approved",
    needTitle: "Bottled water + granola bars",
    needSummary: "Excess supplies available, looking for North Campus drop-off.",
    needCategory: "supplies",
    urgency: "standard",
    postedAt: "9 min ago",
    needCoord: DEMO_GEO.rpcc,
    helperCoord: DEMO_GEO.fallCreek,
    handoffCoord: DEMO_GEO.rpcc,
    requester: {
      name: "Priya R.",
      initials: "PR",
      contact: "Discord · #aid-offers",
      zone: "Discord (offer)",
      notes: "Helper-side post — looking for a need to fulfill",
      tags: ["offer"],
    },
    helper: {
      name: "RPCC desk",
      initials: "RP",
      role: "North Campus public lobby",
      distance: "0.8 mi",
      availability: "Open 24h",
      pastAssists: 18,
      verification: "demo",
      contact: "Coordinator-managed",
    },
    matchScore: 91,
    flags: [],
    positives: [
      "public-location",
      "exact-confirmed",
      "helper-accepted",
      "contact-protected",
      "coord-supervised",
    ],
    recommendedHandoff: {
      location: "Robert Purcell Community Center · front desk",
      rationale: "Public, staffed 24h. No private addresses involved.",
    },
    handoffOptions: ["public-meet", "mark-complete"],
  },
];

export function findMatch(id: string) {
  return sampleMatches.find((m) => m.id === id);
}
