import { describe, expect, it } from "vitest";
import { computeDue, estimateDistanceDue, leadingThreshold } from "./due";

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

describe("estimateDistanceDue", () => {
  it("projects the deadline from the pace, rounding days up", () => {
    // 1 000 km left at 30 km/day = 33.3 days
    expect(estimateDistanceDue({ remainingDistance: 1000 }, 30, "2026-01-01")).toEqual({
      days: 34,
      date: "2026-02-04",
    });
  });

  it("has no estimate without a pace, past the deadline, or without a distance interval", () => {
    expect(estimateDistanceDue({ remainingDistance: 1000 }, null, "2026-01-01")).toBeNull();
    expect(estimateDistanceDue({ remainingDistance: 1000 }, 0, "2026-01-01")).toBeNull();
    expect(estimateDistanceDue({ remainingDistance: -5 }, 30, "2026-01-01")).toBeNull();
    expect(estimateDistanceDue({ remainingDistance: 0 }, 30, "2026-01-01")).toBeNull();
    expect(estimateDistanceDue({ remainingDistance: null }, 30, "2026-01-01")).toBeNull();
  });
});

describe("which limit comes first", () => {
  const rule = { intervalDistance: 5000, intervalMonths: 6 };

  it("alerts as soon as either interval is reached", () => {
    // Plenty of distance left, but the 6 months are over.
    const byTime = computeDue(rule, from, { odometer: 10_100, date: "2026-07-10" });
    expect(byTime).toMatchObject({
      status: "overdue",
      distanceStatus: "ok",
      timeStatus: "overdue",
    });
    // Plenty of time left, but the distance is over.
    const byDistance = computeDue(rule, from, { odometer: 15_100, date: "2026-02-01" });
    expect(byDistance).toMatchObject({
      status: "overdue",
      distanceStatus: "overdue",
      timeStatus: "ok",
    });
  });

  it("reports no status for an interval the rule does not have", () => {
    expect(
      computeDue({ intervalDistance: 5000 }, from, { odometer: 10_000, date: "2026-02-01" }),
    ).toMatchObject({ distanceStatus: "ok", timeStatus: null });
  });

  it("picks the more urgent interval, then the one reached sooner at the usual pace", () => {
    const base = { remainingDistance: 0, remainingDays: 0 };
    expect(leadingThreshold({ ...base, distanceStatus: "ok", timeStatus: "overdue" }, null)).toBe(
      "time",
    );
    expect(leadingThreshold({ ...base, distanceStatus: "overdue", timeStatus: "soon" }, null)).toBe(
      "distance",
    );

    // Tied on "soon": 300 km at 20 km/day is 15 days, against 40 days left.
    const tie = { distanceStatus: "soon", timeStatus: "soon" } as const;
    expect(leadingThreshold({ ...tie, remainingDistance: 300, remainingDays: 40 }, 20)).toBe(
      "distance",
    );
    expect(leadingThreshold({ ...tie, remainingDistance: 900, remainingDays: 10 }, 20)).toBe(
      "time",
    );
    // Cannot tell without a pace: show both.
    expect(
      leadingThreshold({ ...tie, remainingDistance: 300, remainingDays: 40 }, null),
    ).toBeNull();
  });

  it("has a single leading interval when the rule has only one", () => {
    const base = { remainingDistance: 100, remainingDays: null };
    expect(leadingThreshold({ ...base, distanceStatus: "soon", timeStatus: null }, null)).toBe(
      "distance",
    );
    expect(
      leadingThreshold(
        { remainingDistance: null, remainingDays: 9, distanceStatus: null, timeStatus: "soon" },
        null,
      ),
    ).toBe("time");
    expect(
      leadingThreshold(
        { remainingDistance: null, remainingDays: null, distanceStatus: null, timeStatus: null },
        null,
      ),
    ).toBeNull();
  });
});
