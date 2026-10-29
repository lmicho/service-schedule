import { daysBetween } from "./date";

export interface OdometerPoint {
  date: string; // YYYY-MM-DD
  odometer: number;
}

const WINDOW_DAYS = 365;
const MIN_SPAN_DAYS = 30;

/**
 * Average distance driven per day, from dated odometer readings. Uses the last
 * year of readings (so old habits and one-off trips weigh less), or the whole
 * history when that is too short. Null when the readings cannot tell: fewer
 * than two, spanning under a month, or going backwards (inconsistent data).
 */
export function computeUsageRate(points: OdometerPoint[]): number | null {
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length < 2) return null;

  const latest = sorted[sorted.length - 1];
  const recent = sorted.filter((p) => daysBetween(p.date, latest.date) <= WINDOW_DAYS);

  for (const set of [recent, sorted]) {
    const first = set[0];
    const span = daysBetween(first.date, latest.date);
    if (set.length >= 2 && span >= MIN_SPAN_DAYS) {
      const rate = (latest.odometer - first.odometer) / span;
      return rate > 0 ? rate : null;
    }
  }
  return null;
}
