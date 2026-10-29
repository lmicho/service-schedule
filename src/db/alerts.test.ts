import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.stubEnv("DATABASE_PATH", ":memory:");

let alerts: typeof import("./alerts");
let rules: typeof import("./rules");
let logs: typeof import("./logs");
let db: typeof import("./index").db;
let schema: typeof import("./schema");

const TODAY = "2026-06-01";

const ruleInput = {
  name: "Huile",
  intervalDistance: 2000,
  intervalMonths: null,
  warnDistance: 300,
  warnMonths: null,
  baselineOdometer: 10_000,
  baselineDate: "2026-01-01",
  notes: null,
};

beforeAll(async () => {
  ({ db } = await import("./index"));
  schema = await import("./schema");
  const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
  migrate(db, { migrationsFolder: "drizzle" });
  alerts = await import("./alerts");
  rules = await import("./rules");
  logs = await import("./logs");
});

function addVehicle(name: string, odometer: number) {
  return db.insert(schema.vehicles).values({ name, type: "car", odometer }).returning().get();
}

// Alerts of the given vehicles only: the in-memory DB is shared between tests.
function alertsFor(...ids: number[]) {
  return alerts.listActiveAlerts(TODAY).filter((a) => ids.includes(a.vehicle.id));
}

describe("listActiveAlerts", () => {
  it("keeps soon and overdue rules only, overdue first", () => {
    const v = addVehicle("V-status", 11_800); // 200 km left: soon
    rules.insertRule(v.id, { ...ruleInput, name: "Soon" });
    rules.insertRule(v.id, { ...ruleInput, name: "Overdue", intervalDistance: 1000 });
    rules.insertRule(v.id, { ...ruleInput, name: "Fine", intervalDistance: 20_000 });

    const found = alertsFor(v.id);
    expect(found.map((a) => [a.rule.name, a.rule.due.status])).toEqual([
      ["Overdue", "overdue"],
      ["Soon", "soon"],
    ]);
    expect(found.every((a) => !a.dismissed)).toBe(true);
  });

  it("orders ties by vehicle then rule name", () => {
    const b = addVehicle("B-order", 12_500);
    const a = addVehicle("A-order", 12_500);
    rules.insertRule(b.id, { ...ruleInput, name: "Z" });
    rules.insertRule(a.id, { ...ruleInput, name: "Y" });
    rules.insertRule(a.id, { ...ruleInput, name: "X" });

    expect(alertsFor(a.id, b.id).map((x) => `${x.vehicle.name}/${x.rule.name}`)).toEqual([
      "A-order/X",
      "A-order/Y",
      "B-order/Z",
    ]);
  });

  it("clears the alert once a job is logged against the rule", () => {
    const v = addVehicle("V-logged", 12_500);
    const rule = rules.insertRule(v.id, ruleInput)!;
    expect(alertsFor(v.id)).toHaveLength(1);

    logs.insertLog(v.id, {
      title: "Huile",
      performedAt: "2026-05-30",
      odometer: 12_500,
      cost: null,
      scheduleItemId: rule.id,
      shop: null,
      notes: null,
    });
    expect(alertsFor(v.id)).toHaveLength(0);
  });
});

describe("dismissAlert", () => {
  it("marks the alert dismissed for that cycle", () => {
    const v = addVehicle("V-dismiss", 12_500);
    rules.insertRule(v.id, ruleInput);
    const [alert] = alertsFor(v.id);

    alerts.dismissAlert(alert.rule.id, alert.cycleKey);
    alerts.dismissAlert(alert.rule.id, alert.cycleKey); // idempotent
    expect(alertsFor(v.id)[0].dismissed).toBe(true);
  });

  it("comes back when the status changes", () => {
    const v = addVehicle("V-escalate", 11_800); // soon
    rules.insertRule(v.id, ruleInput);
    const [soon] = alertsFor(v.id);
    alerts.dismissAlert(soon.rule.id, soon.cycleKey);

    db.update(schema.vehicles).set({ odometer: 12_100 }).where(eq(schema.vehicles.id, v.id)).run();
    const [overdue] = alertsFor(v.id);
    expect(overdue.rule.due.status).toBe("overdue");
    expect(overdue.dismissed).toBe(false);
  });

  it("keeps only the latest dismissal of a rule", () => {
    const v = addVehicle("V-prune", 12_500);
    const rule = rules.insertRule(v.id, ruleInput)!;
    alerts.dismissAlert(rule.id, "old");
    alerts.dismissAlert(rule.id, "new");
    const keys = db
      .select()
      .from(schema.alertDismissals)
      .all()
      .filter((d) => d.scheduleItemId === rule.id)
      .map((d) => d.cycleKey);
    expect(keys).toEqual(["new"]);
  });

  it("is removed with the rule", () => {
    const v = addVehicle("V-cascade", 12_500);
    const rule = rules.insertRule(v.id, ruleInput)!;
    alerts.dismissAlert(rule.id, "key");
    rules.deleteRule(v.id, rule.id);
    expect(
      db
        .select()
        .from(schema.alertDismissals)
        .all()
        .filter((d) => d.scheduleItemId === rule.id),
    ).toHaveLength(0);
  });
});
