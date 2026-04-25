import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "crisismesh.db");

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

declare global {
  // eslint-disable-next-line no-var
  var __crisismeshDb: Database.Database | undefined;
}

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    name TEXT,
    phone TEXT UNIQUE,
    lat REAL,
    lng REAL,
    created_at TEXT
  );
  CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    type TEXT,
    description TEXT,
    urgency INTEGER,
    status TEXT DEFAULT 'open',
    disaster_event_id TEXT,
    created_at TEXT
  );
  CREATE TABLE IF NOT EXISTS providers (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    type TEXT,
    description TEXT,
    availability TEXT,
    status TEXT DEFAULT 'available',
    disaster_event_id TEXT,
    created_at TEXT
  );
`;

function init(db: Database.Database) {
  db.pragma("journal_mode = WAL");
  db.exec(SCHEMA_SQL);
}

export function getDb(): Database.Database {
  if (!global.__crisismeshDb) {
    const db = new Database(DB_PATH);
    init(db);
    global.__crisismeshDb = db;
  }
  return global.__crisismeshDb;
}

export interface UserRow {
  id: number;
  name: string;
  phone: string;
  lat: number;
  lng: number;
  created_at: string;
}
