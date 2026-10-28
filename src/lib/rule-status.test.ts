import { describe, expect, it } from "vitest";
import type { ScheduleItem } from "@/db/schema";
import { computeRuleStatus } from "./rule-status";

const rule: ScheduleItem = {
  id: 1,
  vehicleId: 1,
  name: "Huile",
  intervalDistance: 2000,
  intervalDays: null,
  warnDistance: null,
  warnDays: null,
  baselineOdometer: 10_000,
  baselineDate: "2026-01-01",
  notes: null,
};

describe("computeRuleStatus", () => {
  it("counts from the baseline when nothing is logged", () => {
    const r = computeRuleStatus(rule, null, { odometer: 11_000 }, "2026-02-01");
    expect(r).toMatchObject({ status: "ok", nextDueOdometer: 12_000 });
  });

  it("counts from the last logged job once there is one", () => {
    const last = { odometer: 11_500, performedAt: "2026-02-01" };
    const r = computeRuleStatus(rule, last, { odometer: 12_000 }, "2026-02-10");
    expect(r).toMatchObject({ status: "ok", nextDueOdometer: 13_500, remainingDistance: 1500 });
  });

  it("is overdue when the vehicle passed the due odometer", () => {
    const r = computeRuleStatus(rule, null, { odometer: 12_300 }, "2026-02-01");
    expect(r).toMatchObject({ status: "overdue", remainingDistance: -300 });
  });

  it("falls back to today when the rule has no baseline date", () => {
    const timed = { ...rule, intervalDistance: null, intervalDays: 30, baselineDate: null };
    const r = computeRuleStatus(timed, null, { odometer: 0 }, "2026-05-01");
    expect(r).toMatchObject({ status: "ok", nextDueDate: "2026-05-31" });
  });
});
