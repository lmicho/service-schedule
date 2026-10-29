import { and, desc, eq, isNotNull } from "drizzle-orm";
import { db } from "./index";
import {
  maintenanceLogs,
  scheduleItems,
  vehicles,
  type MaintenanceLog,
  type ScheduleItem,
} from "./schema";
import {
  estimateDistanceDue,
  leadingThreshold,
  type DueEstimate,
  type DueResult,
  type Threshold,
} from "@/lib/due";
import { todayLocal } from "@/lib/date";
import type { RuleFormInput } from "@/lib/rule-form";
import { computeRuleStatus } from "@/lib/rule-status";
import { getUsageRate } from "./usage";

export type RuleWithStatus = ScheduleItem & {
  due: DueResult;
  lastLog: MaintenanceLog | null;
  // Probable date of a distance deadline at the vehicle's usual pace (display only).
  estimate: DueEstimate | null;
  // The interval that comes first, when the rule has both (null: cannot be told).
  leading: Threshold | null;
};

export function getRule(vehicleId: number, ruleId: number): ScheduleItem | undefined {
  return db
    .select()
    .from(scheduleItems)
    .where(and(eq(scheduleItems.id, ruleId), eq(scheduleItems.vehicleId, vehicleId)))
    .get();
}

/** Rules of a vehicle with their due status, most urgent first. */
export function listRulesWithStatus(vehicleId: number, today = todayLocal()): RuleWithStatus[] {
  const vehicle = db.select().from(vehicles).where(eq(vehicles.id, vehicleId)).get();
  if (!vehicle) return [];

  const rules = db.select().from(scheduleItems).where(eq(scheduleItems.vehicleId, vehicleId)).all();

  // Newest first, so the first log seen per rule is its last one.
  const logs = db
    .select()
    .from(maintenanceLogs)
    .where(and(eq(maintenanceLogs.vehicleId, vehicleId), isNotNull(maintenanceLogs.scheduleItemId)))
    .orderBy(desc(maintenanceLogs.performedAt), desc(maintenanceLogs.id))
    .all();
  const lastByRule = new Map<number, MaintenanceLog>();
  for (const log of logs) {
    if (log.scheduleItemId !== null && !lastByRule.has(log.scheduleItemId)) {
      lastByRule.set(log.scheduleItemId, log);
    }
  }

  const rate = getUsageRate(vehicle);
  const rank = { overdue: 0, soon: 1, ok: 2 } as const;
  return rules
    .map((rule) => {
      const lastLog = lastByRule.get(rule.id) ?? null;
      const due = computeRuleStatus(rule, lastLog, vehicle, today);
      return {
        ...rule,
        lastLog,
        due,
        estimate: estimateDistanceDue(due, rate, today),
        leading: leadingThreshold(due, rate),
      };
    })
    .sort((a, b) => rank[a.due.status] - rank[b.due.status] || a.name.localeCompare(b.name));
}

/** Returns null when the vehicle does not exist. */
export function insertRule(vehicleId: number, data: RuleFormInput): ScheduleItem | null {
  const vehicle = db.select().from(vehicles).where(eq(vehicles.id, vehicleId)).get();
  if (!vehicle) return null;
  return db
    .insert(scheduleItems)
    .values({ ...data, vehicleId })
    .returning()
    .get();
}

/** Returns false when the rule does not exist on that vehicle. */
export function updateRule(vehicleId: number, ruleId: number, data: RuleFormInput): boolean {
  return (
    db
      .update(scheduleItems)
      .set(data)
      .where(and(eq(scheduleItems.id, ruleId), eq(scheduleItems.vehicleId, vehicleId)))
      .returning({ id: scheduleItems.id })
      .all().length > 0
  );
}

/** Logs linked to the rule are kept (their link is cleared by the foreign key). */
export function deleteRule(vehicleId: number, ruleId: number): boolean {
  return (
    db
      .delete(scheduleItems)
      .where(and(eq(scheduleItems.id, ruleId), eq(scheduleItems.vehicleId, vehicleId)))
      .returning({ id: scheduleItems.id })
      .all().length > 0
  );
}
