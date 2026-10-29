import type { MaintenanceLog, ScheduleItem, Vehicle } from "@/db/schema";
import { computeDue, type DueResult } from "./due";

/**
 * Status of a rule: counted from the last job logged against it, or from the
 * rule's baseline while nothing has been logged yet. If that last job has no
 * odometer reading, only the time interval can be tracked for this cycle.
 */
export function computeRuleStatus(
  rule: ScheduleItem,
  lastLog: Pick<MaintenanceLog, "odometer" | "performedAt"> | null,
  vehicle: Pick<Vehicle, "odometer">,
  today: string,
): DueResult {
  const from = lastLog
    ? { odometer: lastLog.odometer ?? 0, date: lastLog.performedAt }
    : { odometer: rule.baselineOdometer, date: rule.baselineDate ?? today };
  const trackable =
    lastLog?.odometer === null ? { ...rule, intervalDistance: null, warnDistance: null } : rule;
  return computeDue(trackable, from, { odometer: vehicle.odometer, date: today });
}
