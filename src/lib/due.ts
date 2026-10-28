export type DueStatus = "ok" | "soon" | "overdue";

export interface DueRule {
  intervalDistance?: number | null;
  intervalDays?: number | null;
  // How long before the deadline to warn; defaults to SOON_RATIO of the interval.
  warnDistance?: number | null;
  warnDays?: number | null;
}

export interface DuePoint {
  odometer: number;
  date: string; // YYYY-MM-DD
}

export interface DueResult {
  status: DueStatus;
  nextDueOdometer: number | null;
  nextDueDate: string | null;
  remainingDistance: number | null;
  remainingDays: number | null;
}

// "Soon" kicks in when less than this share of the interval remains,
// unless the rule sets its own warning distance / days.
const SOON_RATIO = 0.1;

function soonThreshold(interval: number, warn?: number | null): number {
  return warn ?? interval * SOON_RATIO;
}

const MS_PER_DAY = 86_400_000;

function toUtcDay(date: string): number {
  return Date.parse(`${date}T00:00:00Z`);
}

function addDays(date: string, days: number): string {
  return new Date(toUtcDay(date) + days * MS_PER_DAY).toISOString().slice(0, 10);
}

/**
 * Computes when a recurring item is next due.
 * `from` is the last time it was done, or the point where tracking started
 * (vehicle added) when it has never been done.
 */
export function computeDue(rule: DueRule, from: DuePoint, current: DuePoint): DueResult {
  let status: DueStatus = "ok";
  const escalate = (next: DueStatus) => {
    if (next === "overdue" || status === "ok") status = next;
  };

  let nextDueOdometer: number | null = null;
  let remainingDistance: number | null = null;
  if (rule.intervalDistance) {
    nextDueOdometer = from.odometer + rule.intervalDistance;
    remainingDistance = nextDueOdometer - current.odometer;
    if (remainingDistance < 0) escalate("overdue");
    else if (remainingDistance <= soonThreshold(rule.intervalDistance, rule.warnDistance))
      escalate("soon");
  }

  let nextDueDate: string | null = null;
  let remainingDays: number | null = null;
  if (rule.intervalDays) {
    nextDueDate = addDays(from.date, rule.intervalDays);
    remainingDays = Math.round((toUtcDay(nextDueDate) - toUtcDay(current.date)) / MS_PER_DAY);
    if (remainingDays < 0) escalate("overdue");
    else if (remainingDays <= soonThreshold(rule.intervalDays, rule.warnDays)) escalate("soon");
  }

  return { status, nextDueOdometer, nextDueDate, remainingDistance, remainingDays };
}
