import type Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { basename, dirname, join } from "node:path";

/** Migrations present in the folder but not yet recorded in the database. */
export function countPendingMigrations(sqlite: Database.Database, folder: string): number {
  const journal = JSON.parse(readFileSync(join(folder, "meta", "_journal.json"), "utf8")) as {
    entries: unknown[];
  };
  const hasTable = sqlite
    .prepare("select 1 from sqlite_master where type = 'table' and name = '__drizzle_migrations'")
    .get();
  const applied = hasTable
    ? (sqlite.prepare("select count(*) as n from __drizzle_migrations").get() as { n: number }).n
    : 0;
  return Math.max(0, journal.entries.length - applied);
}

/**
 * Applies pending migrations. When an existing database is about to change,
 * a copy is kept next to it first (`<name>.pre-migrate.db`, overwritten each
 * time) so a bad migration never costs the data. Returns the copy's path.
 */
export function runMigrations(
  sqlite: Database.Database,
  folder = "drizzle",
): { applied: number; backup: string | null } {
  const pending = countPendingMigrations(sqlite, folder);
  if (pending === 0) return { applied: 0, backup: null };

  let backup: string | null = null;
  const hasData = sqlite.prepare("select 1 from sqlite_master where type = 'table' limit 1").get();
  if (hasData && sqlite.name !== ":memory:" && existsSync(sqlite.name)) {
    backup = join(dirname(sqlite.name), `${basename(sqlite.name, ".db")}.pre-migrate.db`);
    rmSync(backup, { force: true });
    sqlite.prepare("vacuum into ?").run(backup); // consistent copy, WAL included
  }

  migrate(drizzle(sqlite), { migrationsFolder: folder });
  return { applied: pending, backup };
}
