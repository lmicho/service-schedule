import type { DueResult } from "./due";

/**
 * Identifies one alert cycle: a dismissal only holds while the status and the
 * deadline stay the same (so "soon" -> "overdue", or a new job, brings it back).
 */
export function cycleKey(
  due: Pick<DueResult, "status" | "nextDueOdometer" | "nextDueDate">,
): string {
  return `${due.status}|${due.nextDueOdometer ?? ""}|${due.nextDueDate ?? ""}`;
}
