import { beforeAll, describe, expect, it, vi } from "vitest";

vi.stubEnv("DATABASE_PATH", ":memory:");

let rules: typeof import("./rules");
let logs: typeof import("./logs");
let db: typeof import("./index").db;
let schema: typeof import("./schema");

const ruleInput = {
  name: "Huile",
  intervalDistance: 2000,
  intervalMonths: null,
  warnDistance: null,
  warnMonths: null,
  baselineOdometer: 10_000,
  baselineDate: "2026-01-01",
  notes: null,
};

const logInput = {
  title: "Huile",
  performedAt: "2026-02-01",
  odometer: 11_000,
  cost: null,
  scheduleItemId: null,
  shop: null,
  notes: null,
};

beforeAll(async () => {
  ({ db } = await import("./index"));
  schema = await import("./schema");
  const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
  migrate(db, { migrationsFolder: "drizzle" });
  rules = await import("./rules");
  logs = await import("./logs");
});

function addVehicle(odometer: number) {
  return db.insert(schema.vehicles).values({ name: "V", type: "car", odometer }).returning().get();
}

describe("rules CRUD", () => {
  it("inserts, updates and deletes a rule scoped to its vehicle", () => {
    const v = addVehicle(10_000);
    const other = addVehicle(0);
    const rule = rules.insertRule(v.id, ruleInput)!;
    expect(rule.name).toBe("Huile");
    expect(rules.insertRule(9999, ruleInput)).toBeNull();

    expect(rules.updateRule(other.id, rule.id, { ...ruleInput, name: "Hack" })).toBe(false);
    expect(rules.updateRule(v.id, rule.id, { ...ruleInput, name: "Vidange" })).toBe(true);
    expect(rules.getRule(v.id, rule.id)?.name).toBe("Vidange");

    expect(rules.deleteRule(other.id, rule.id)).toBe(false);
    expect(rules.deleteRule(v.id, rule.id)).toBe(true);
    expect(rules.getRule(v.id, rule.id)).toBeUndefined();
  });

  it("keeps logs but clears their link when a rule is deleted", () => {
    const v = addVehicle(10_000);
    const rule = rules.insertRule(v.id, ruleInput)!;
    const log = logs.insertLog(v.id, { ...logInput, scheduleItemId: rule.id })!;
    rules.deleteRule(v.id, rule.id);
    const after = logs.listLogs(v.id).find((l) => l.id === log.id);
    expect(after).toMatchObject({ title: "Huile", scheduleItemId: null });
  });
});

describe("listRulesWithStatus", () => {
  it("counts from the baseline until a job is logged against the rule", () => {
    const v = addVehicle(11_850);
    rules.insertRule(v.id, ruleInput);
    const [r] = rules.listRulesWithStatus(v.id, "2026-02-01");
    expect(r.lastLog).toBeNull();
    expect(r.due).toMatchObject({ status: "soon", nextDueOdometer: 12_000 });
  });

  it("restarts from the last logged job, ignoring unlinked jobs", () => {
    const v = addVehicle(11_500);
    const rule = rules.insertRule(v.id, ruleInput)!;
    logs.insertLog(v.id, { ...logInput, odometer: 11_500, scheduleItemId: rule.id });
    logs.insertLog(v.id, { ...logInput, title: "Autre", odometer: 11_900 });
    const [r] = rules.listRulesWithStatus(v.id, "2026-02-10");
    expect(r.due).toMatchObject({ status: "ok", nextDueOdometer: 13_500 });
    expect(r.lastLog?.odometer).toBe(11_500);
  });

  it("sorts overdue first, then soon, then ok", () => {
    const v = addVehicle(12_500);
    rules.insertRule(v.id, { ...ruleInput, name: "A ok", intervalDistance: 9000 });
    rules.insertRule(v.id, { ...ruleInput, name: "B overdue" });
    rules.insertRule(v.id, { ...ruleInput, name: "C soon", intervalDistance: 2600 });
    const names = rules.listRulesWithStatus(v.id, "2026-02-01").map((r) => r.name);
    expect(names).toEqual(["B overdue", "C soon", "A ok"]);
  });

  it("returns nothing for an unknown vehicle", () => {
    expect(rules.listRulesWithStatus(9999)).toEqual([]);
  });
});

describe("insertLog with a rule", () => {
  it("rejects a rule that belongs to another vehicle", () => {
    const a = addVehicle(0);
    const b = addVehicle(0);
    const rule = rules.insertRule(a.id, ruleInput)!;
    expect(() => logs.insertLog(b.id, { ...logInput, scheduleItemId: rule.id })).toThrow();
    expect(() => logs.insertLog(b.id, { ...logInput, scheduleItemId: 99999 })).toThrow();
  });
});
