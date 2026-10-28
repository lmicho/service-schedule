import type { MaintenanceLog, ScheduleItem, Vehicle } from "@/db/schema";
import { computeDue, type DueResult } from "./due";

/**
 * Status of a rule: counted from the last job logged against it, or from the
 * rule's baseline while nothing has been logged yet.
 */
export function computeRuleStatus(
  rule: ScheduleItem,
  lastLog: Pick<MaintenanceLog, "odometer" | "performedAt"> | null,
  vehicle: Pick<Vehicle, "odometer">,
  today: string,
): DueResult {
  const from = lastLog
    ? { odometer: lastLog.odometer, date: lastLog.performedAt }
    : { odometer: rule.baselineOdometer, date: rule.baselineDate ?? today };
  return computeDue(rule, from, { odometer: vehicle.odometer, date: today });
}
