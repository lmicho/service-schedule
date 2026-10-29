import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import * as schema from "./schema";

const dbPath = process.env.DATABASE_PATH ?? "data/service-schedule.db";
mkdirSync(dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
// Classic rollback journal, not WAL: a single-user local app gains nothing from
// WAL, and its -wal/-shm side files were seen vanishing under a running dev
// server, silently losing writes. Converting an existing WAL database needs
// this to be the only connection, so if another one still has it open the
// switch simply happens at the next start.
try {
  sqlite.pragma("journal_mode = DELETE");
} catch {
  // database busy: retried on the next start
}
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
