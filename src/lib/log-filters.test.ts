import { describe, expect, it } from "vitest";
import type { MaintenanceLog } from "@/db/schema";
import { NO_FILTERS, filterLogs, hasActiveFilters, logYears, parseLogFilters } from "./log-filters";

let nextId = 1;
const log = (over: Partial<MaintenanceLog>): MaintenanceLog => ({
  id: nextId++,
  vehicleId: 1,
  scheduleItemId: null,
  title: "Job",
  performedAt: "2026-01-01",
  odometer: null,
  cost: null,
  shop: null,
  notes: null,
  ...over,
});

// Newest first, like listLogs.
const logs = [
  log({ title: "Équilibrage de roues", performedAt: "2026-05-01", cost: 90, odometer: 130_000 }),
  log({
    title: "Changement d'huile",
    performedAt: "2026-02-01",
    scheduleItemId: 7,
    cost: 150,
    shop: "Garage Point S",
  }),
  log({ title: "Pneus d'hiver", performedAt: "2025-11-01", cost: 800, odometer: 120_000 }),
  log({ title: "Inspection", performedAt: "2025-01-01", notes: "Frein arrière usé", cost: null }),
];

const titles = (list: MaintenanceLog[]) => list.map((l) => l.title);

describe("parseLogFilters", () => {
  it("reads valid filters", () => {
    expect(parseLogFilters({ q: " huile ", year: "2025", rule: "7", sort: "cost" })).toEqual({
      q: "huile",
      year: 2025,
      rule: 7,
      sort: "cost",
    });
    expect(parseLogFilters({ rule: "none" }).rule).toBe("none");
  });

  it("falls back to no filter on anything invalid", () => {
    expect(parseLogFilters({ year: "abc", rule: "-3", sort: "bogus" })).toEqual(NO_FILTERS);
    expect(parseLogFilters({ year: "12", rule: "1.5" })).toEqual(NO_FILTERS);
    expect(parseLogFilters({})).toEqual(NO_FILTERS);
  });

  it("takes the first value of a repeated param", () => {
    expect(parseLogFilters({ q: ["a", "b"] }).q).toBe("a");
  });
});

describe("hasActiveFilters", () => {
  it("is false only with the defaults", () => {
    expect(hasActiveFilters(NO_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...NO_FILTERS, sort: "cost" })).toBe(true);
    expect(hasActiveFilters({ ...NO_FILTERS, q: "x" })).toBe(true);
  });
});

describe("filterLogs", () => {
  it("returns everything, in order, without filters", () => {
    expect(filterLogs(logs, NO_FILTERS)).toEqual(logs);
  });

  it("searches title, notes and shop, ignoring case and accents", () => {
    expect(titles(filterLogs(logs, { ...NO_FILTERS, q: "equilibrage" }))).toEqual([
      "Équilibrage de roues",
    ]);
    expect(titles(filterLogs(logs, { ...NO_FILTERS, q: "FREIN" }))).toEqual(["Inspection"]);
    expect(titles(filterLogs(logs, { ...NO_FILTERS, q: "point s" }))).toEqual([
      "Changement d'huile",
    ]);
  });

  it("filters by year", () => {
    expect(titles(filterLogs(logs, { ...NO_FILTERS, year: 2025 }))).toEqual([
      "Pneus d'hiver",
      "Inspection",
    ]);
  });

  it("filters by rule, or by jobs without one", () => {
    expect(titles(filterLogs(logs, { ...NO_FILTERS, rule: 7 }))).toEqual(["Changement d'huile"]);
    expect(filterLogs(logs, { ...NO_FILTERS, rule: "none" })).toHaveLength(3);
  });

  it("combines filters", () => {
    const f = { ...NO_FILTERS, year: 2026, rule: "none" as const };
    expect(titles(filterLogs(logs, f))).toEqual(["Équilibrage de roues"]);
    expect(filterLogs(logs, { ...f, q: "huile" })).toEqual([]);
  });

  it("sorts by cost or odometer, biggest first, unknown values last", () => {
    expect(titles(filterLogs(logs, { ...NO_FILTERS, sort: "cost" }))).toEqual([
      "Pneus d'hiver",
      "Changement d'huile",
      "Équilibrage de roues",
      "Inspection",
    ]);
    expect(titles(filterLogs(logs, { ...NO_FILTERS, sort: "odometer" }))).toEqual([
      "Équilibrage de roues",
      "Pneus d'hiver",
      "Changement d'huile",
      "Inspection",
    ]);
  });

  it("does not modify its input", () => {
    const copy = [...logs];
    filterLogs(logs, { ...NO_FILTERS, sort: "cost" });
    expect(logs).toEqual(copy);
  });
});

describe("logYears", () => {
  it("lists distinct years, newest first", () => {
    expect(logYears(logs)).toEqual([2026, 2025]);
  });
});
