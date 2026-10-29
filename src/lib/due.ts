export type DueStatus = "ok" | "soon" | "overdue";

export interface DueRule {
  intervalDistance?: number | null;
  intervalMonths?: number | null;
  // How long before the deadline to warn (months for the time interval);
  // defaults to SOON_RATIO of the interval.
  warnDistance?: number | null;
  warnMonths?: number | null;
}

export interface DuePoint {
  odometer: number;
  date: string; // YYYY-MM-DD
}

export type Threshold = "distance" | "time";

export interface DueResult {
  status: DueStatus;
  // Status of each interval on its own (null when the rule has no such interval).
  distanceStatus: DueStatus | null;
  timeStatus: DueStatus | null;
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

export function addDays(date: string, days: number): string {
  return new Date(toUtcDay(date) + days * MS_PER_DAY).toISOString().slice(0, 10);
}

/** Calendar months; a day past the end of the target month lands on its last day. */
function addMonths(date: string, months: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const index = y * 12 + (m - 1) + months;
  const year = Math.floor(index / 12);
  const month = index % 12;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(d, lastDay))).toISOString().slice(0, 10);
}

/**
 * Computes when a recurring item is next due.
 * `from` is the last time it was done, or the point where tracking started
 * (vehicle added) when it has never been done.
 */
export function computeDue(rule: DueRule, from: DuePoint, current: DuePoint): DueResult {
  let distanceStatus: DueStatus | null = null;
  let timeStatus: DueStatus | null = null;

  let nextDueOdometer: number | null = null;
  let remainingDistance: number | null = null;
  if (rule.intervalDistance) {
    nextDueOdometer = from.odometer + rule.intervalDistance;
    remainingDistance = nextDueOdometer - current.odometer;
    distanceStatus =
      remainingDistance < 0
        ? "overdue"
        : remainingDistance <= soonThreshold(rule.intervalDistance, rule.warnDistance)
          ? "soon"
          : "ok";
  }

  let nextDueDate: string | null = null;
  let remainingDays: number | null = null;
  if (rule.intervalMonths) {
    nextDueDate = addMonths(from.date, rule.intervalMonths);
    remainingDays = Math.round((toUtcDay(nextDueDate) - toUtcDay(current.date)) / MS_PER_DAY);
    // Warning window opens `warnMonths` before the deadline, or 10% of the interval's length.
    const warnFrom =
      rule.warnMonths != null
        ? addMonths(nextDueDate, -rule.warnMonths)
        : addDays(
            nextDueDate,
            -Math.round(((toUtcDay(nextDueDate) - toUtcDay(from.date)) / MS_PER_DAY) * SOON_RATIO),
          );
    timeStatus = remainingDays < 0 ? "overdue" : current.date >= warnFrom ? "soon" : "ok";
  }

  // The rule is as urgent as its most urgent interval: whichever limit comes first.
  const status = [distanceStatus, timeStatus].reduce<DueStatus>(
    (worst, s) => (s !== null && STATUS_RANK[s] > STATUS_RANK[worst] ? s : worst),
    "ok",
  );

  return {
    status,
    distanceStatus,
    timeStatus,
    nextDueOdometer,
    nextDueDate,
    remainingDistance,
    remainingDays,
  };
}

const STATUS_RANK = { ok: 0, soon: 1, overdue: 2 } as const;

/**
 * Which interval of a rule comes first: the more urgent of the two, or on a tie
 * the one reached sooner at the usual driving pace. Null when it cannot be told
 * (a tie without a known pace) or the rule has no interval; callers then show
 * both.
 */
export function leadingThreshold(
  due: Pick<DueResult, "distanceStatus" | "timeStatus" | "remainingDistance" | "remainingDays">,
  ratePerDay: number | null,
): Threshold | null {
  const { distanceStatus: d, timeStatus: t } = due;
  if (d === null) return t === null ? null : "time";
  if (t === null) return "distance";
  if (STATUS_RANK[d] !== STATUS_RANK[t])
    return STATUS_RANK[d] > STATUS_RANK[t] ? "distance" : "time";

  if (ratePerDay === null || ratePerDay <= 0) return null;
  if (due.remainingDistance === null || due.remainingDays === null) return null;
  // Compare in days: the distance left, driven at the usual pace, against the days left.
  return due.remainingDistance / ratePerDay < due.remainingDays ? "distance" : "time";
}

export interface DueEstimate {
  days: number;
  date: string; // YYYY-MM-DD
}

/**
 * When a distance deadline will probably be reached, at `ratePerDay` km (or mi)
 * per day. Null when there is nothing to estimate: no distance interval, the
 * deadline is already passed, or the pace is unknown.
 */
export function estimateDistanceDue(
  due: Pick<DueResult, "remainingDistance">,
  ratePerDay: number | null,
  today: string,
): DueEstimate | null {
  if (due.remainingDistance === null || due.remainingDistance <= 0) return null;
  if (ratePerDay === null || ratePerDay <= 0) return null;
  const days = Math.ceil(due.remainingDistance / ratePerDay);
  return { days, date: addDays(today, days) };
}
