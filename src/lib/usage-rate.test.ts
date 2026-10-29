import { describe, expect, it } from "vitest";
import { computeUsageRate } from "./usage-rate";

const p = (date: string, odometer: number) => ({ date, odometer });

describe("computeUsageRate", () => {
  it("averages the distance over the elapsed days", () => {
    const rate = computeUsageRate([p("2026-01-01", 10_000), p("2026-04-11", 12_000)]); // 100 days
    expect(rate).toBeCloseTo(20);
  });

  it("does not depend on the order of the readings", () => {
    const rate = computeUsageRate([p("2026-04-11", 12_000), p("2026-01-01", 10_000)]);
    expect(rate).toBeCloseTo(20);
  });

  it("uses only the last year when it has enough readings", () => {
    const rate = computeUsageRate([
      p("2020-01-01", 0), // slow old years are ignored
      p("2025-06-01", 50_000),
      p("2026-05-31", 60_000), // 364 days
    ]);
    expect(rate).toBeCloseTo(10_000 / 364);
  });

  it("falls back to the whole history when the last year is too thin", () => {
    const rate = computeUsageRate([
      p("2022-01-01", 10_000),
      p("2024-01-01", 30_000), // 730 days
      p("2026-01-01", 30_100), // only one reading in the last year
    ]);
    expect(rate).toBeCloseTo(20_100 / 1461);
  });

  it("is unknown with fewer than two readings or a span under a month", () => {
    expect(computeUsageRate([])).toBeNull();
    expect(computeUsageRate([p("2026-01-01", 10_000)])).toBeNull();
    expect(computeUsageRate([p("2026-01-01", 10_000), p("2026-01-20", 10_500)])).toBeNull();
  });

  it("is unknown when the readings go backwards or do not move", () => {
    expect(computeUsageRate([p("2026-01-01", 10_000), p("2026-06-01", 9_000)])).toBeNull();
    expect(computeUsageRate([p("2026-01-01", 10_000), p("2026-06-01", 10_000)])).toBeNull();
  });
});
