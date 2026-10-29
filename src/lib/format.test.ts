import { describe, expect, it } from "vitest";
import { describeDue, describeInterval, describeRemaining } from "./format";

const base = {
  status: "ok" as const,
  nextDueOdometer: null,
  nextDueDate: null,
  remainingDistance: null,
  remainingDays: null,
};

describe("describeDue", () => {
  it("describes an upcoming distance", () => {
    const lines = describeDue({ ...base, nextDueOdometer: 47_000, remainingDistance: 2000 }, "km");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/^à 47.000 km \(dans 2.000 km\)$/);
  });

  it("describes an overdue distance and a date", () => {
    const lines = describeDue(
      {
        ...base,
        nextDueOdometer: 12_000,
        remainingDistance: -300,
        nextDueDate: "2026-12-01",
        remainingDays: 34,
      },
      "km",
    );
    expect(lines[0]).toContain("en retard de 300 km");
    expect(lines[1]).toBe("le 2026-12-01 (dans 34 j)");
  });

  it("returns nothing for a rule with no interval", () => {
    expect(describeDue(base, "km")).toEqual([]);
  });
});

describe("describeInterval", () => {
  it("joins the distance and time intervals", () => {
    const text = describeInterval({ intervalDistance: 5000, intervalMonths: 6 }, "km");
    expect(text).toMatch(/^tous les 5.000 km · tous les 6 mois$/);
    expect(describeInterval({ intervalDistance: null, intervalMonths: 12 }, "km")).toBe(
      "tous les 12 mois",
    );
  });
});

describe("describeRemaining", () => {
  it("joins the remaining distance and days", () => {
    const text = describeRemaining({ ...base, remainingDistance: -1300, remainingDays: 12 }, "km");
    expect(text).toMatch(/^en retard de 1.300 km · dans 12 j$/);
  });

  it("handles a single interval", () => {
    expect(describeRemaining({ ...base, remainingDays: 5 }, "km")).toBe("dans 5 j");
  });
});
