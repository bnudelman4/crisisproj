import { getDb, type UserRow } from "@/lib/db";
import { analyzeMessages } from "@/lib/analyze";
import { DEMO_MESSAGES } from "@/lib/demo-messages";
import { spreadAround } from "@/lib/demo-locations";
import { proposeMatch, listMatches, clearMatches } from "@/lib/matches";
import { DEMO_REQUESTER_PHONE, DEMO_HELPER_PHONE } from "@/lib/demo-routing";

export interface SeedReport {
  needs: number;
  resources: number;
  matches: number;
  requesterUserId: number;
  helperUserId: number;
  centerLat: number;
  centerLng: number;
}

class SeedError extends Error {}

function findUser(phone: string): UserRow | undefined {
  const db = getDb();
  return db
    .prepare("SELECT id, name, phone, lat, lng, created_at FROM users WHERE phone = ?")
    .get(phone) as UserRow | undefined;
}

function purgeLegacySyntheticUsers() {
  const db = getDb();
  db.prepare(
    "DELETE FROM requests WHERE user_id IN (SELECT id FROM users WHERE phone LIKE '+1555000%' OR phone LIKE '+1555100%' OR phone LIKE '+155555550%' OR phone LIKE '+155555551%')"
  ).run();
  db.prepare(
    "DELETE FROM providers WHERE user_id IN (SELECT id FROM users WHERE phone LIKE '+1555000%' OR phone LIKE '+1555100%' OR phone LIKE '+155555550%' OR phone LIKE '+155555551%')"
  ).run();
  db.prepare(
    "DELETE FROM users WHERE phone LIKE '+1555000%' OR phone LIKE '+1555100%' OR phone = '+15555550000' OR phone LIKE '+155555550%' OR phone LIKE '+155555551%'"
  ).run();
}

function fakeOwnerPhone(index: number): string {
  return `+1555555${String(index + 1).padStart(4, "0")}`;
}

export async function seedDatabase(force = false): Promise<SeedReport> {
  const db = getDb();
  purgeLegacySyntheticUsers();

  const requester = findUser(DEMO_REQUESTER_PHONE);
  const helper = findUser(DEMO_HELPER_PHONE);

  if (!requester) {
    throw new SeedError(
      `Demo requester ${DEMO_REQUESTER_PHONE} is not registered. Register that account first (with a password and location), then reset.`
    );
  }
  if (!helper) {
    throw new SeedError(
      `Demo helper ${DEMO_HELPER_PHONE} is not registered. Register that account first (with a password and location), then reset.`
    );
  }

  const seededReqCount = (db.prepare("SELECT COUNT(*) as c FROM requests WHERE seeded = 1").get() as { c: number }).c;
  const matchesPresent = listMatches().length > 0;

  if (!force && seededReqCount > 0 && matchesPresent) {
    const r = (db.prepare("SELECT COUNT(*) as c FROM requests WHERE seeded = 1").get() as { c: number }).c;
    const p = (db.prepare("SELECT COUNT(*) as c FROM providers WHERE seeded = 1").get() as { c: number }).c;
    return {
      needs: r,
      resources: p,
      matches: listMatches().length,
      requesterUserId: requester.id,
      helperUserId: helper.id,
      centerLat: requester.lat,
      centerLng: requester.lng,
    };
  }

  db.prepare("DELETE FROM requests WHERE seeded = 1").run();
  db.prepare("DELETE FROM providers WHERE seeded = 1").run();

  const result = await analyzeMessages(DEMO_MESSAGES);
  const createdAt = new Date().toISOString();

  const insertOwner = db.prepare(
    "INSERT OR IGNORE INTO users (name, phone, lat, lng, created_at) VALUES (?, ?, ?, ?, ?)"
  );
  const findOwner = db.prepare("SELECT id FROM users WHERE phone = ?");
  const insertRequest = db.prepare(
    "INSERT INTO requests (user_id, type, description, urgency, status, display_name, lat, lng, seeded, disaster_event_id, created_at) VALUES (?, ?, ?, ?, 'open', ?, ?, ?, 1, NULL, ?)"
  );
  const insertProvider = db.prepare(
    "INSERT INTO providers (user_id, type, description, availability, status, display_name, lat, lng, seeded, disaster_event_id, created_at) VALUES (?, ?, ?, ?, 'available', ?, ?, ?, 1, NULL, ?)"
  );

  const needIdToDb = new Map<string, { reqId: number; ownerId: number; displayName: string }>();
  const resourceIdToDb = new Map<string, { provId: number; displayName: string }>();

  const tx = db.transaction(() => {
    result.needs.forEach((n, i) => {
      const loc = spreadAround(`need-${n.id}`, requester.lat, requester.lng);
      const phone = fakeOwnerPhone(i);
      insertOwner.run(n.person, phone, loc.lat, loc.lng, createdAt);
      const ownerRow = findOwner.get(phone) as { id: number };
      const r = insertRequest.run(
        ownerRow.id,
        n.type,
        n.description,
        n.urgency,
        n.person,
        loc.lat,
        loc.lng,
        createdAt
      );
      needIdToDb.set(n.id, {
        reqId: Number(r.lastInsertRowid),
        ownerId: ownerRow.id,
        displayName: n.person,
      });
    });
    result.resources.forEach((r) => {
      const loc = spreadAround(`resource-${r.id}`, requester.lat, requester.lng);
      const p = insertProvider.run(
        helper.id,
        r.type,
        r.description,
        r.availability,
        r.person,
        loc.lat,
        loc.lng,
        createdAt
      );
      resourceIdToDb.set(r.id, { provId: Number(p.lastInsertRowid), displayName: r.person });
    });
  });
  tx();

  clearMatches();
  let matchCount = 0;
  for (const m of result.matches) {
    const need = needIdToDb.get(m.needId);
    const res = resourceIdToDb.get(m.resourceId);
    if (!need || !res) continue;
    proposeMatch({
      requestId: need.reqId,
      providerId: res.provId,
      helperUserId: helper.id,
      helperName: res.displayName,
      requestUserId: need.ownerId,
      requesterName: need.displayName,
      action: m.action,
      confidence: m.confidence,
      safetyFlag: m.safetyFlag,
      safetyNote: m.safetyNote,
    });
    matchCount++;
  }

  return {
    needs: result.needs.length,
    resources: result.resources.length,
    matches: matchCount,
    requesterUserId: requester.id,
    helperUserId: helper.id,
    centerLat: requester.lat,
    centerLng: requester.lng,
  };
}

export const seedDatabaseIfEmpty = seedDatabase;
