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
    const r = computeDue({ intervalMonths: 12 }, from, { odometer: 10_000, date: "2027-01-02" });
    expect(r).toMatchObject({ status: "overdue", nextDueDate: "2027-01-01", remainingDays: -1 });
  });

  it("takes the worst status when both intervals are set", () => {
    const r = computeDue({ intervalDistance: 5000, intervalMonths: 6 }, from, {
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

  it("uses the rule's warning months instead of the 10% default", () => {
    const rule = { intervalMonths: 12, warnMonths: 1 };
    expect(computeDue(rule, from, { odometer: 10_000, date: "2026-11-30" }).status).toBe("ok");
    expect(computeDue(rule, from, { odometer: 10_000, date: "2026-12-01" }).status).toBe("soon");
  });

  it("warns 10% of the interval before the deadline by default", () => {
    const rule = { intervalMonths: 12 }; // 365 days: window opens 37 days before 2027-01-01
    expect(computeDue(rule, from, { odometer: 10_000, date: "2026-11-24" }).status).toBe("ok");
    expect(computeDue(rule, from, { odometer: 10_000, date: "2026-11-25" }).status).toBe("soon");
  });

  it("counts calendar months, clamping to the end of a short month", () => {
    const jan31 = { odometer: 0, date: "2026-01-31" };
    const now = { odometer: 0, date: "2026-02-01" };
    expect(computeDue({ intervalMonths: 1 }, jan31, now).nextDueDate).toBe("2026-02-28");
    expect(computeDue({ intervalMonths: 13 }, jan31, now).nextDueDate).toBe("2027-02-28");
    expect(
      computeDue({ intervalMonths: 1 }, { odometer: 0, date: "2028-01-31" }, now).nextDueDate,
    ).toBe("2028-02-29");
    expect(
      computeDue({ intervalMonths: 12 }, { odometer: 0, date: "2026-11-15" }, now).nextDueDate,
    ).toBe("2027-11-15");
  });
});
