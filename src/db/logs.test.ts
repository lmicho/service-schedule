import { beforeAll, describe, expect, it, vi } from "vitest";

vi.stubEnv("DATABASE_PATH", ":memory:");

const input = {
  title: "Huile",
  performedAt: "2026-03-01",
  odometer: 10_000,
  cost: null,
  scheduleItemId: null,
  shop: null,
  notes: null,
};

let mod: typeof import("./logs");
let db: typeof import("./index").db;
let schema: typeof import("./schema");

beforeAll(async () => {
  ({ db } = await import("./index"));
  schema = await import("./schema");
  const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
  migrate(db, { migrationsFolder: "drizzle" });
  mod = await import("./logs");
});

function addVehicle(odometer: number) {
  return db
    .insert(schema.vehicles)
    .values({ name: "Test", type: "car", odometer })
    .returning()
    .get();
}

describe("insertLog", () => {
  it("returns null for an unknown vehicle", () => {
    expect(mod.insertLog(9999, input)).toBeNull();
  });

  it("raises the vehicle odometer when the log is higher", () => {
    const v = addVehicle(5_000);
    mod.insertLog(v.id, input);
    const after = db
      .select()
      .from(schema.vehicles)
      .all()
      .find((x) => x.id === v.id);
    expect(after?.odometer).toBe(10_000);
  });

  it("leaves the vehicle odometer alone when the job has no reading", () => {
    const v = addVehicle(50_000);
    const log = mod.insertLog(v.id, { ...input, odometer: null });
    expect(log?.odometer).toBeNull();
    const after = db
      .select()
      .from(schema.vehicles)
      .all()
      .find((x) => x.id === v.id);
    expect(after?.odometer).toBe(50_000);
  });

  it("keeps the vehicle odometer when logging an older, lower reading", () => {
    const v = addVehicle(50_000);
    mod.insertLog(v.id, input);
    const after = db
      .select()
      .from(schema.vehicles)
      .all()
      .find((x) => x.id === v.id);
    expect(after?.odometer).toBe(50_000);
  });
});

describe("listLogs", () => {
  it("lists only that vehicle's logs, newest first", () => {
    const a = addVehicle(0);
    const b = addVehicle(0);
    mod.insertLog(a.id, { ...input, title: "old", performedAt: "2025-01-01" });
    mod.insertLog(a.id, { ...input, title: "new", performedAt: "2026-01-01" });
    mod.insertLog(b.id, { ...input, title: "other" });
    expect(mod.listLogs(a.id).map((l) => l.title)).toEqual(["new", "old"]);
  });
});

describe("updateLog", () => {
  it("edits the job in place", () => {
    const v = addVehicle(0);
    const log = mod.insertLog(v.id, input)!;
    const updated = mod.updateLog(v.id, log.id, { ...input, title: "Filtre", odometer: null });
    expect(updated).toMatchObject({ id: log.id, title: "Filtre", odometer: null });
    expect(mod.getLog(v.id, log.id)?.title).toBe("Filtre");
  });

  it("returns null for a log of another vehicle", () => {
    const a = addVehicle(0);
    const b = addVehicle(0);
    const log = mod.insertLog(a.id, input)!;
    expect(mod.updateLog(b.id, log.id, { ...input, title: "x" })).toBeNull();
    expect(mod.getLog(a.id, log.id)?.title).toBe("Huile");
  });

  it("raises but never lowers the vehicle odometer", () => {
    const v = addVehicle(50_000);
    const log = mod.insertLog(v.id, input)!;
    mod.updateLog(v.id, log.id, { ...input, odometer: 20_000 });
    expect(
      db
        .select()
        .from(schema.vehicles)
        .all()
        .find((x) => x.id === v.id)?.odometer,
    ).toBe(50_000);
    mod.updateLog(v.id, log.id, { ...input, odometer: 60_000 });
    expect(
      db
        .select()
        .from(schema.vehicles)
        .all()
        .find((x) => x.id === v.id)?.odometer,
    ).toBe(60_000);
  });

  it("rejects a rule from another vehicle", () => {
    const a = addVehicle(0);
    const b = addVehicle(0);
    const rule = db
      .insert(schema.scheduleItems)
      .values({ vehicleId: b.id, name: "R", intervalDays: 30 })
      .returning()
      .get();
    const log = mod.insertLog(a.id, input)!;
    expect(() => mod.updateLog(a.id, log.id, { ...input, scheduleItemId: rule.id })).toThrow();
  });
});
