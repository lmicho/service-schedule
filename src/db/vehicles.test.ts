import { beforeAll, describe, expect, it, vi } from "vitest";

vi.stubEnv("DATABASE_PATH", ":memory:");

let mod: typeof import("./vehicles");
let alerts: typeof import("./alerts");
let db: typeof import("./index").db;
let schema: typeof import("./schema");

beforeAll(async () => {
  ({ db } = await import("./index"));
  schema = await import("./schema");
  const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
  migrate(db, { migrationsFolder: "drizzle" });
  mod = await import("./vehicles");
  alerts = await import("./alerts");
});

function addVehicle(name: string) {
  return db.insert(schema.vehicles).values({ name, type: "car" }).returning().get();
}

function addRule(vehicleId: number) {
  return db
    .insert(schema.scheduleItems)
    .values({ vehicleId, name: "Huile", intervalMonths: 30 })
    .returning()
    .get();
}

function addLog(vehicleId: number, scheduleItemId: number | null = null) {
  db.insert(schema.maintenanceLogs)
    .values({ vehicleId, scheduleItemId, title: "Job", performedAt: "2026-01-01" })
    .run();
}

describe("deleteVehicle", () => {
  it("removes the vehicle with its logs, rules and dismissals, and nothing else", () => {
    const gone = addVehicle("Gone");
    const kept = addVehicle("Kept");
    const rule = addRule(gone.id);
    addLog(gone.id, rule.id);
    addLog(gone.id);
    addRule(kept.id);
    addLog(kept.id);
    alerts.dismissAlert(rule.id, "key");

    expect(mod.getVehicleUsage(gone.id)).toEqual({ logs: 2, rules: 1 });
    expect(mod.deleteVehicle(gone.id)).toBe(true);

    expect(mod.getVehicleUsage(gone.id)).toEqual({ logs: 0, rules: 0 });
    expect(mod.getVehicleUsage(kept.id)).toEqual({ logs: 1, rules: 1 });
    expect(
      db
        .select()
        .from(schema.alertDismissals)
        .all()
        .filter((d) => d.scheduleItemId === rule.id),
    ).toHaveLength(0);
  });

  it("returns false for an unknown vehicle", () => {
    expect(mod.deleteVehicle(9999)).toBe(false);
  });
});
