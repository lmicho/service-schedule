import { describe, expect, it } from "vitest";
import { daysBetween } from "./date";

describe("daysBetween", () => {
  it("counts whole days, across months and leap years", () => {
    expect(daysBetween("2026-01-01", "2026-01-31")).toBe(30);
    expect(daysBetween("2028-02-28", "2028-03-01")).toBe(2);
    expect(daysBetween("2026-03-10", "2026-03-10")).toBe(0);
    expect(daysBetween("2026-03-10", "2026-03-01")).toBe(-9);
  });
});
