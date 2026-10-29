import Database from "better-sqlite3";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

let dir: string;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "journal-"));
});
afterAll(() => {
  vi.unstubAllEnvs();
  rmSync(dir, { recursive: true, force: true });
});

async function openApp(path: string) {
  vi.resetModules();
  vi.stubEnv("DATABASE_PATH", path);
  return (await import("./index")).db.$client;
}

describe("database journal mode", () => {
  it("uses a rollback journal, so no -wal/-shm files exist", async () => {
    const path = join(dir, "new.db");
    const sqlite = await openApp(path);
    sqlite.exec("create table t (x)");
    sqlite.exec("insert into t values (1)");

    expect(sqlite.pragma("journal_mode", { simple: true })).toBe("delete");
    expect(existsSync(`${path}-wal`)).toBe(false);
    expect(existsSync(`${path}-shm`)).toBe(false);
    sqlite.close();
  });

  it("converts an existing WAL database on open, keeping its data", async () => {
    const path = join(dir, "old-wal.db");
    const old = new Database(path);
    old.pragma("journal_mode = WAL");
    old.exec("create table t (x); insert into t values (42)");
    old.close();

    const sqlite = await openApp(path);
    expect(sqlite.pragma("journal_mode", { simple: true })).toBe("delete");
    expect(sqlite.prepare("select x from t").all()).toEqual([{ x: 42 }]);
    expect(existsSync(`${path}-wal`)).toBe(false);
    expect(existsSync(`${path}-shm`)).toBe(false);
    sqlite.close();
  });

  it("does not fail when another connection still holds the WAL database", async () => {
    const path = join(dir, "busy-wal.db");
    const other = new Database(path);
    other.pragma("journal_mode = WAL");
    other.exec("create table t (x)");
    other.exec("begin; insert into t values (1)"); // open write transaction

    const sqlite = await openApp(path);
    expect(sqlite.pragma("journal_mode", { simple: true })).toBe("wal"); // switched later
    other.exec("rollback");
    other.close();
    sqlite.close();
  });
});
