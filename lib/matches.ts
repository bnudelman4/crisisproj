export type MatchStatus = "proposed" | "helper_accepted" | "approved" | "completed";

export interface MatchRecord {
  id: string;
  requestId: number;
  providerId: number | null;
  helperUserId: number;
  helperName: string;
  requestUserId: number;
  requesterName: string;
  status: MatchStatus;
  action: string;
  confidence: number;
  safetyFlag: boolean;
  safetyNote: string | null;
  createdAt: string;
  helperAcceptedAt: string | null;
  requesterApprovedAt: string | null;
  helperMarkedComplete: boolean;
  requesterMarkedComplete: boolean;
  completedAt: string | null;
}

declare global {
  // eslint-disable-next-line no-var
  var __crisismeshMatches: Map<string, MatchRecord> | undefined;
}

function store(): Map<string, MatchRecord> {
  if (!global.__crisismeshMatches) {
    global.__crisismeshMatches = new Map();
  }
  return global.__crisismeshMatches;
}

function pairId(requestId: number, providerId: number | null, helperUserId: number): string {
  return providerId !== null
    ? `m-r${requestId}-p${providerId}`
    : `m-r${requestId}-u${helperUserId}`;
}

export function proposeMatch(input: {
  requestId: number;
  providerId: number;
  helperUserId: number;
  helperName: string;
  requestUserId: number;
  requesterName: string;
  action: string;
  confidence: number;
  safetyFlag: boolean;
  safetyNote: string | null;
}): MatchRecord {
  const id = pairId(input.requestId, input.providerId, input.helperUserId);
  const existing = store().get(id);
  if (existing) return existing;
  const record: MatchRecord = {
    id,
    requestId: input.requestId,
    providerId: input.providerId,
    helperUserId: input.helperUserId,
    helperName: input.helperName,
    requestUserId: input.requestUserId,
    requesterName: input.requesterName,
    status: "proposed",
    action: input.action,
    confidence: input.confidence,
    safetyFlag: input.safetyFlag,
    safetyNote: input.safetyNote,
    createdAt: new Date().toISOString(),
    helperAcceptedAt: null,
    requesterApprovedAt: null,
    helperMarkedComplete: false,
    requesterMarkedComplete: false,
    completedAt: null,
  };
  store().set(id, record);
  return record;
}

export function manuallyAcceptRequest(input: {
  requestId: number;
  helperUserId: number;
  helperName: string;
  requestUserId: number;
  requesterName: string;
  action: string;
}): MatchRecord {
  const id = pairId(input.requestId, null, input.helperUserId);
  const existing = store().get(id);
  if (existing) return existing;
  const now = new Date().toISOString();
  const record: MatchRecord = {
    id,
    requestId: input.requestId,
    providerId: null,
    helperUserId: input.helperUserId,
    helperName: input.helperName,
    requestUserId: input.requestUserId,
    requesterName: input.requesterName,
    status: "helper_accepted",
    action: input.action,
    confidence: 1,
    safetyFlag: false,
    safetyNote: null,
    createdAt: now,
    helperAcceptedAt: now,
    requesterApprovedAt: null,
    helperMarkedComplete: false,
    requesterMarkedComplete: false,
    completedAt: null,
  };
  store().set(id, record);
  return record;
}

export function markComplete(matchId: string, role: "helper" | "requester"): MatchRecord | null {
  const m = store().get(matchId);
  if (!m) return null;
  if (m.status !== "approved" && m.status !== "completed") return m;
  if (role === "helper") m.helperMarkedComplete = true;
  else m.requesterMarkedComplete = true;
  if (m.helperMarkedComplete && m.requesterMarkedComplete) {
    m.status = "completed";
    m.completedAt = m.completedAt ?? new Date().toISOString();
  }
  return m;
}

export function helperAcceptMatch(matchId: string, helper: { userId: number; name: string }): MatchRecord | null {
  const m = store().get(matchId);
  if (!m) return null;
  m.helperUserId = helper.userId;
  m.helperName = helper.name;
  m.status = "helper_accepted";
  m.helperAcceptedAt = new Date().toISOString();
  return m;
}

export function requesterConfirmMatch(matchId: string): MatchRecord | null {
  const m = store().get(matchId);
  if (!m) return null;
  m.status = "approved";
  m.requesterApprovedAt = new Date().toISOString();
  return m;
}

export function listMatches(): MatchRecord[] {
  return [...store().values()];
}

export function findMatch(id: string): MatchRecord | undefined {
  return store().get(id);
}

export function clearMatches() {
  store().clear();
}
