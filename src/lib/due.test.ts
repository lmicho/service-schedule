import { describe, expect, it } from "vitest";
import { computeDue } from "./due";

const from = { odometer: 10_000, date: "2026-01-01" };

describe("computeDue", () => {
  it("is ok when far from the distance interval", () => {
    const r = computeDue({ intervalDistance: 2000 }, from, {
      odometer: 10_500,
      date: "2026-02-01",
    });
    expect(r).toMatchObject({ status: "ok", nextDueOdometer: 12_000, remainingDistance: 1500 });
  });

  it("is soon within 10% of the distance interval", () => {
    const r = computeDue({ intervalDistance: 2000 }, from, {
      odometer: 11_850,
      date: "2026-02-01",
    });
    expect(r.status).toBe("soon");
  });

  it("is overdue past the distance interval", () => {
    const r = computeDue({ intervalDistance: 2000 }, from, {
      odometer: 12_100,
      date: "2026-02-01",
    });
    expect(r).toMatchObject({ status: "overdue", remainingDistance: -100 });
  });

  it("uses the time interval on its own", () => {
    const r = computeDue({ intervalDays: 365 }, from, { odometer: 10_000, date: "2027-01-02" });
    expect(r).toMatchObject({ status: "overdue", nextDueDate: "2027-01-01", remainingDays: -1 });
  });

  it("takes the worst status when both intervals are set", () => {
    const r = computeDue({ intervalDistance: 5000, intervalDays: 180 }, from, {
      odometer: 10_100,
      date: "2026-12-01",
    });
    expect(r.status).toBe("overdue");
  });

  it("is ok with no intervals", () => {
    const r = computeDue({}, from, { odometer: 99_999, date: "2030-01-01" });
    expect(r).toMatchObject({ status: "ok", nextDueOdometer: null, nextDueDate: null });
  });

  it("uses the rule's warning distance instead of the 10% default", () => {
    const rule = { intervalDistance: 2000, warnDistance: 500 };
    expect(computeDue(rule, from, { odometer: 11_400, date: "2026-02-01" }).status).toBe("ok");
    expect(computeDue(rule, from, { odometer: 11_600, date: "2026-02-01" }).status).toBe("soon");
  });

  it("uses the rule's warning days instead of the 10% default", () => {
    const rule = { intervalDays: 365, warnDays: 30 };
    expect(computeDue(rule, from, { odometer: 10_000, date: "2026-11-15" }).status).toBe("ok");
    expect(computeDue(rule, from, { odometer: 10_000, date: "2026-12-15" }).status).toBe("soon");
  });
});
