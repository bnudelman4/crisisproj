/**
 * Feed and alert mocks for the /app product surface.
 * Mock state only — no backend.
 */

export type FeedKind =
  | "need"
  | "offer"
  | "broadcast"
  | "match"
  | "completed"
  | "alert";

export type FeedSource = "SMS" | "GroupMe" | "Discord" | "QR" | "Manual" | "App";

export type FeedItem = {
  id: string;
  kind: FeedKind;
  source: FeedSource;
  zone: string;
  zoneCode: string;
  postedAt: string;
  author: { name: string; initials: string };
  title: string;
  body: string;
  urgency?: "critical" | "high" | "standard";
  matchId?: string;
  privateAddressHidden?: boolean;
  reactions?: { care: number; help: number; pinned?: boolean };
};

export const zones = [
  { code: "NC", label: "North Campus" },
  { code: "CC", label: "Central Campus" },
  { code: "WC", label: "West Campus" },
  { code: "CT", label: "Collegetown" },
  { code: "BS", label: "Belle Sherman" },
  { code: "FH", label: "Fall Creek" },
];

export const feed: FeedItem[] = [
  {
    id: "f-1",
    kind: "need",
    source: "SMS",
    zone: "North Campus",
    zoneCode: "NC",
    postedAt: "2m",
    author: { name: "Sam K.", initials: "SK" },
    title: "Insulin · refrigerated · time-sensitive",
    body: "Need insulin delivered to North Campus. Power has been out 3 hours. Address protected — exact location hidden until coordinator approves.",
    urgency: "critical",
    matchId: "match-sam-leo",
    privateAddressHidden: true,
    reactions: { care: 12, help: 4, pinned: true },
  },
  {
    id: "f-2",
    kind: "need",
    source: "SMS",
    zone: "Collegetown",
    zoneCode: "CT",
    postedAt: "11m",
    author: { name: "Nora T.", initials: "NT" },
    title: "Ride to urgent care · pickup location TBD",
    body: "Looking for a ride to off-campus urgent care. No pickup point provided yet. Match is blocked until details are confirmed.",
    urgency: "high",
    matchId: "match-nora-ride",
    privateAddressHidden: true,
    reactions: { care: 7, help: 2 },
  },
  {
    id: "f-3",
    kind: "offer",
    source: "Discord",
    zone: "North Campus",
    zoneCode: "NC",
    postedAt: "9m",
    author: { name: "Priya R.", initials: "PR" },
    title: "Bottled water + granola bars · can drop anywhere N. Campus",
    body: "I have excess supplies. Happy to drop at any public North Campus address. RPCC desk handoff is fine.",
    urgency: "standard",
    matchId: "match-priya-water",
    reactions: { care: 4, help: 9 },
  },
  {
    id: "f-4",
    kind: "broadcast",
    source: "App",
    zone: "Citywide",
    zoneCode: "CW",
    postedAt: "14m",
    author: { name: "Coordinator desk", initials: "CD" },
    title: "Traffic light out · College Ave & Buffalo",
    body: "Treat as 4-way stop. Coordinator-confirmed. Please share with neighbors who drive through this intersection.",
    urgency: "standard",
    reactions: { care: 22, help: 0 },
  },
  {
    id: "f-5",
    kind: "need",
    source: "QR",
    zone: "Belle Sherman",
    zoneCode: "BS",
    postedAt: "7m",
    author: { name: "Anonymous", initials: "AN" },
    title: "Welfare check · grandmother lives alone",
    body: "Cannot reach by phone. Address protected. Coordinator phone-check first; if no answer, walk-up with a buddy. Vulnerable-person flag active.",
    urgency: "high",
    matchId: "match-belle-welfare",
    privateAddressHidden: true,
    reactions: { care: 18, help: 3 },
  },
  {
    id: "f-6",
    kind: "offer",
    source: "GroupMe",
    zone: "Collegetown",
    zoneCode: "CT",
    postedAt: "4m",
    author: { name: "Leo M.", initials: "LM" },
    title: "Have a car · 2–5 PM · supply runs and rides",
    body: "Based in Collegetown. Public handoffs only. Available for medical-related runs through Bridge.",
    urgency: "standard",
    reactions: { care: 6, help: 11 },
  },
  {
    id: "f-7",
    kind: "completed",
    source: "App",
    zone: "North Campus",
    zoneCode: "NC",
    postedAt: "32m",
    author: { name: "Coordinator desk", initials: "CD" },
    title: "Phone charger handoff complete · Hasbrouck",
    body: "Handoff completed at RPCC public lobby. CPAP user is back online. Coordinator signed off · M. Rivas.",
    reactions: { care: 28, help: 0 },
  },
  {
    id: "f-8",
    kind: "alert",
    source: "App",
    zone: "Citywide",
    zoneCode: "CW",
    postedAt: "1h",
    author: { name: "Coordinator desk", initials: "CD" },
    title: "Warming spot open · RPCC main lobby",
    body: "RPCC main lobby is now a warming spot. Open to anyone affected by the outage. Heat, water, charging.",
    urgency: "standard",
    reactions: { care: 41, help: 0, pinned: true },
  },
];

export type AppAlert = {
  id: string;
  kind: "match" | "safety" | "broadcast" | "complete";
  title: string;
  body: string;
  postedAt: string;
  matchId?: string;
  tone: "ok" | "warn" | "block";
};

export const alerts: AppAlert[] = [
  {
    id: "a-1",
    kind: "match",
    tone: "warn",
    title: "Match found · Sam ↔ Leo",
    body: "Best match suggested. Meetup safety check required before messaging — medical handoff and one-on-one delivery flagged.",
    postedAt: "Just now",
    matchId: "match-sam-leo",
  },
  {
    id: "a-2",
    kind: "safety",
    tone: "block",
    title: "Match blocked · Nora's ride request",
    body: "Cannot approve until exact pickup location and emergency status are confirmed.",
    postedAt: "2 min ago",
    matchId: "match-nora-ride",
  },
  {
    id: "a-3",
    kind: "broadcast",
    tone: "ok",
    title: "Coordinator broadcast · warming spot live",
    body: "RPCC main lobby is now a warming spot. Open 24h.",
    postedAt: "1 hr ago",
  },
  {
    id: "a-4",
    kind: "complete",
    tone: "ok",
    title: "Handoff complete · Priya ↔ RPCC",
    body: "Bottled water and granola bars delivered to the public lobby. Both sides marked complete.",
    postedAt: "32 min ago",
    matchId: "match-priya-water",
  },
];

// Map locations: pre-positioned pins on a stylized SVG canvas (1000×620)
export type MapPin = {
  id: string;
  x: number; // 0-1000
  y: number; // 0-620
  zone: string;
  kind: FeedKind;
  urgency?: "critical" | "high" | "standard";
  feedId: string;
  matchId?: string;
  privateAddressHidden?: boolean;
};

export const mapPins: MapPin[] = [
  { id: "p-1", x: 290, y: 170, zone: "North Campus", kind: "need", urgency: "critical", feedId: "f-1", matchId: "match-sam-leo", privateAddressHidden: true },
  { id: "p-2", x: 540, y: 460, zone: "Collegetown", kind: "need", urgency: "high", feedId: "f-2", matchId: "match-nora-ride", privateAddressHidden: true },
  { id: "p-3", x: 360, y: 220, zone: "North Campus · RPCC", kind: "offer", urgency: "standard", feedId: "f-3", matchId: "match-priya-water" },
  { id: "p-4", x: 470, y: 350, zone: "Central Campus", kind: "broadcast", urgency: "standard", feedId: "f-4" },
  { id: "p-5", x: 740, y: 380, zone: "Belle Sherman", kind: "need", urgency: "high", feedId: "f-5", matchId: "match-belle-welfare", privateAddressHidden: true },
  { id: "p-6", x: 590, y: 480, zone: "Collegetown", kind: "offer", urgency: "standard", feedId: "f-6" },
  { id: "p-7", x: 380, y: 200, zone: "North Campus · public lobby", kind: "completed", feedId: "f-7" },
  { id: "p-8", x: 360, y: 220, zone: "RPCC warming spot", kind: "alert", feedId: "f-8" },
];

export const profileCoordinator = {
  name: "M. Rivas",
  role: "Coordinator · North Campus Mutual Aid",
  joined: "Joined 2024",
  approvalsToday: 14,
  blocksToday: 3,
  flagsResolved: 22,
  preferences: {
    publicHandoff: true,
    hideAddress: true,
    coordApprovalRequired: true,
    buddyForRides: true,
    blockNightOneOnOne: true,
    remoteCheckVulnerable: true,
  },
};
