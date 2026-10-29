import Database from "better-sqlite3";
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { countPendingMigrations, runMigrations } from "./run-migrations";

let dir: string;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "migrations-"));
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

const total = readdirSync("drizzle").filter((f) => f.endsWith(".sql")).length;

describe("runMigrations", () => {
  it("migrates a new database without a backup, then does nothing", () => {
    const sqlite = new Database(join(dir, "new.db"));
    expect(countPendingMigrations(sqlite, "drizzle")).toBe(total);

    expect(runMigrations(sqlite)).toEqual({ applied: total, backup: null });
    expect(countPendingMigrations(sqlite, "drizzle")).toBe(0);
    expect(runMigrations(sqlite)).toEqual({ applied: 0, backup: null });
    sqlite.close();
  });

  it("backs up an existing database before applying a pending migration", () => {
    // A copy of the migrations folder without the newest one: the database
    // starts one step behind, like after pulling a branch with a new migration.
    const older = join(dir, "older");
    cpSync("drizzle", older, { recursive: true });
    const journalPath = join(older, "meta", "_journal.json");
    const journal = JSON.parse(readFileSync(journalPath, "utf8"));
    journal.entries.pop();
    writeFileSync(journalPath, JSON.stringify(journal));

    const path = join(dir, "old.db");
    const sqlite = new Database(path);
    runMigrations(sqlite, older);
    sqlite.prepare("insert into vehicles (name, type) values ('Keep me', 'car')").run();
    expect(countPendingMigrations(sqlite, "drizzle")).toBe(1);

    const { applied, backup } = runMigrations(sqlite);
    expect(applied).toBe(1);
    expect(backup).toBe(join(dir, "old.pre-migrate.db"));

    const copy = new Database(backup!, { readonly: true });
    expect(copy.prepare("select name from vehicles").all()).toEqual([{ name: "Keep me" }]);
    expect(countPendingMigrations(copy, "drizzle")).toBe(1); // copy was taken before migrating
    copy.close();
    expect(countPendingMigrations(sqlite, "drizzle")).toBe(0);
    sqlite.close();
  });
});
