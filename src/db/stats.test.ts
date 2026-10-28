import { beforeAll, describe, expect, it, vi } from "vitest";

vi.stubEnv("DATABASE_PATH", ":memory:");

let stats: typeof import("./stats");
let logs: typeof import("./logs");
let db: typeof import("./index").db;
let schema: typeof import("./schema");

const base = { performedAt: "2026-01-01", odometer: 0, cost: null, shop: null, notes: null };

beforeAll(async () => {
  ({ db } = await import("./index"));
  schema = await import("./schema");
  const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
  migrate(db, { migrationsFolder: "drizzle" });
  stats = await import("./stats");
  logs = await import("./logs");
});

function addVehicle(name: string) {
  return db.insert(schema.vehicles).values({ name, type: "car" }).returning().get();
}

describe("listVehiclesWithRecentLogs", () => {
  it("groups logs per vehicle, newest first, capped at the limit with the real total", () => {
    const a = addVehicle("A-groups");
    const b = addVehicle("B-groups");
    for (let day = 1; day <= 7; day++) {
      logs.insertLog(a.id, { ...base, title: `job ${day}`, performedAt: `2026-02-0${day}` });
    }
    logs.insertLog(b.id, { ...base, title: "other" });

    const entries = stats.listVehiclesWithRecentLogs(5);
    const ea = entries.find((e) => e.vehicle.id === a.id)!;
    const eb = entries.find((e) => e.vehicle.id === b.id)!;

    expect(ea.logs.map((l) => l.title)).toEqual(["job 7", "job 6", "job 5", "job 4", "job 3"]);
    expect(ea.totalLogs).toBe(7);
    expect(eb.logs.map((l) => l.title)).toEqual(["other"]);
    expect(eb.totalLogs).toBe(1);
  });

  it("includes vehicles that have no logs", () => {
    const v = addVehicle("C-empty");
    const entry = stats.listVehiclesWithRecentLogs().find((e) => e.vehicle.id === v.id);
    expect(entry).toMatchObject({ logs: [], totalLogs: 0 });
  });

  it("orders vehicles by name", () => {
    const names = stats.listVehiclesWithRecentLogs().map((e) => e.vehicle.name);
    expect(names).toEqual([...names].sort());
  });
});
