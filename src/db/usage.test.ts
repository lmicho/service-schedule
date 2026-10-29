import { beforeAll, describe, expect, it, vi } from "vitest";

vi.stubEnv("DATABASE_PATH", ":memory:");

let usage: typeof import("./usage");
let rules: typeof import("./rules");
let db: typeof import("./index").db;
let schema: typeof import("./schema");

beforeAll(async () => {
  ({ db } = await import("./index"));
  schema = await import("./schema");
  const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
  migrate(db, { migrationsFolder: "drizzle" });
  usage = await import("./usage");
  rules = await import("./rules");
});

function addVehicle(odometer: number, odometerUpdatedAt: string | null = null) {
  return db
    .insert(schema.vehicles)
    .values({ name: "V", type: "car", odometer, odometerUpdatedAt })
    .returning()
    .get();
}

function addLog(vehicleId: number, performedAt: string, odometer: number | null) {
  db.insert(schema.maintenanceLogs)
    .values({ vehicleId, title: "Job", performedAt, odometer })
    .run();
}

describe("getUsageRate", () => {
  it("uses job readings, ignoring jobs without one", () => {
    const v = addVehicle(0);
    addLog(v.id, "2026-01-01", 10_000);
    addLog(v.id, "2026-03-02", null);
    addLog(v.id, "2026-04-11", 12_000); // 100 days later
    expect(usage.getUsageRate(v)).toBeCloseTo(20);
  });

  it("adds the vehicle's own odometer when its date is known", () => {
    const v = addVehicle(13_000, "2026-05-21"); // 40 days after the last job: +1 000 km
    addLog(v.id, "2026-01-01", 10_000);
    addLog(v.id, "2026-04-11", 12_000);
    expect(usage.getUsageRate(v)).toBeCloseTo(3_000 / 140);
  });

  it("is null without enough readings", () => {
    expect(usage.getUsageRate(addVehicle(5_000))).toBeNull();
  });
});

describe("listRulesWithStatus estimate", () => {
  it("estimates a distance deadline from the usual pace", () => {
    const v = addVehicle(12_000, "2026-04-11");
    addLog(v.id, "2026-01-01", 10_000); // 20 km/day
    const rule = rules.insertRule(v.id, {
      name: "Huile",
      intervalDistance: 5000,
      intervalMonths: null,
      warnDistance: null,
      warnMonths: null,
      baselineOdometer: 10_000,
      baselineDate: "2026-01-01",
      notes: null,
    })!;

    const [found] = rules.listRulesWithStatus(v.id, "2026-04-11");
    expect(found.id).toBe(rule.id);
    expect(found.due.remainingDistance).toBe(3000);
    expect(found.estimate).toEqual({ days: 150, date: "2026-09-08" });
  });

  it("has no estimate for a time-only rule", () => {
    const v = addVehicle(12_000, "2026-04-11");
    addLog(v.id, "2026-01-01", 10_000);
    rules.insertRule(v.id, {
      name: "Pneus",
      intervalDistance: null,
      intervalMonths: 12,
      warnDistance: null,
      warnMonths: null,
      baselineOdometer: 0,
      baselineDate: "2026-01-01",
      notes: null,
    });
    expect(rules.listRulesWithStatus(v.id, "2026-04-11")[0].estimate).toBeNull();
  });
});
