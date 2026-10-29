import { describe, expect, it } from "vitest";
import {
  describeDue,
  describeDueParts,
  describeEstimate,
  describeInterval,
  describeRemaining,
  describeWarning,
  dueLinesToShow,
} from "./format";

const base = {
  status: "ok" as const,
  distanceStatus: null,
  timeStatus: null,
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

  it("shows only the interval that comes first when told", () => {
    const due = { ...base, remainingDistance: 2800, remainingDays: -139 };
    expect(describeRemaining(due, "km", "time")).toBe("en retard de 139 j");
    expect(describeRemaining(due, "km", "distance")).toMatch(/^dans 2.800 km$/);
    expect(describeRemaining(due, "km", null)).toMatch(/dans 2.800 km · en retard de 139 j/);
  });
});

describe("describeEstimate", () => {
  it("uses days for a near date and months for a far one", () => {
    expect(describeEstimate({ days: 18, date: "2026-11-15" })).toBe(
      "≈ dans 18 j (vers le 2026-11-15)",
    );
    expect(describeEstimate({ days: 125, date: "2027-03-02" })).toBe(
      "≈ dans 4 mois (vers le 2027-03-02)",
    );
  });
});

describe("describeWarning", () => {
  it("lists the warnings the rule sets", () => {
    expect(describeWarning({ warnDistance: 600, warnMonths: 1 }, "km")).toMatch(
      /^600 km avant · 1 mois avant$/,
    );
    expect(describeWarning({ warnDistance: null, warnMonths: 2 }, "km")).toBe("2 mois avant");
  });

  it("falls back to the default when none is set", () => {
    expect(describeWarning({ warnDistance: null, warnMonths: null }, "km")).toBe(
      "10 % de l'intervalle (par défaut)",
    );
  });
});

describe("describeDueParts", () => {
  it("separates the distance and the date, with null for a missing interval", () => {
    const both = describeDueParts(
      {
        ...base,
        nextDueOdometer: 12_000,
        remainingDistance: 500,
        nextDueDate: "2026-12-01",
        remainingDays: 34,
      },
      "km",
    );
    expect(both.distance).toMatch(/^à 12.000 km \(dans 500 km\)$/);
    expect(both.time).toBe("le 2026-12-01 (dans 34 j)");
    expect(describeDueParts(base, "km")).toEqual({ distance: null, time: null });
  });
});

describe("dueLinesToShow", () => {
  const both = { remainingDistance: 2800, remainingDays: -139 };

  it("shows both limits, as alternatives, while neither is reached", () => {
    expect(dueLinesToShow({ ...both, status: "ok", remainingDays: 200 }, null)).toEqual({
      distance: true,
      time: true,
      or: true,
    });
    expect(dueLinesToShow({ ...both, status: "soon", remainingDays: 20 }, "time")).toEqual({
      distance: true,
      time: true,
      or: true,
    });
  });

  it("shows only the limit that is reached", () => {
    expect(dueLinesToShow({ ...both, status: "overdue" }, "time")).toEqual({
      distance: false,
      time: true,
      or: false,
    });
    expect(
      dueLinesToShow({ remainingDistance: -300, remainingDays: 50, status: "overdue" }, "distance"),
    ).toEqual({ distance: true, time: false, or: false });
  });

  it('shows both, without "ou", when both are reached and cannot be ranked', () => {
    expect(
      dueLinesToShow({ remainingDistance: -300, remainingDays: -20, status: "overdue" }, null),
    ).toEqual({ distance: true, time: true, or: false });
  });

  it("shows the single line of a one-interval rule", () => {
    expect(
      dueLinesToShow({ remainingDistance: 500, remainingDays: null, status: "ok" }, "distance"),
    ).toEqual({ distance: true, time: false, or: false });
    expect(
      dueLinesToShow({ remainingDistance: null, remainingDays: -3, status: "overdue" }, "time"),
    ).toEqual({ distance: false, time: true, or: false });
  });
});
