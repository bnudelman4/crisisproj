export interface MatchRecord {
  id: string;
  requestId: number;
  providerId: number;
  status: "matched";
  approvedAt: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __bridgeMatches: Map<string, MatchRecord> | undefined;
}

function store(): Map<string, MatchRecord> {
  if (!global.__bridgeMatches) {
    global.__bridgeMatches = new Map();
  }
  return global.__bridgeMatches;
}

export function recordMatch(requestId: number, providerId: number): MatchRecord {
  const id = `m-${requestId}-${providerId}-${Date.now()}`;
  const record: MatchRecord = {
    id,
    requestId,
    providerId,
    status: "matched",
    approvedAt: new Date().toISOString(),
  };
  store().set(id, record);
  return record;
}

export function listMatches(): MatchRecord[] {
  return [...store().values()];
}

export function findMatch(id: string): MatchRecord | undefined {
  return store().get(id);
}
