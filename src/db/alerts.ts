import { and, eq, ne } from "drizzle-orm";
import { db } from "./index";
import { alertDismissals, vehicles, type Vehicle } from "./schema";
import { listRulesWithStatus, type RuleWithStatus } from "./rules";
import { cycleKey } from "@/lib/alerts";
import { todayLocal } from "@/lib/date";

export type Alert = {
  rule: RuleWithStatus;
  vehicle: Pick<Vehicle, "id" | "name" | "odometerUnit">;
  cycleKey: string;
  dismissed: boolean;
};

/**
 * Rules that are due soon or overdue, across all vehicles: overdue first,
 * then by vehicle and rule name. `dismissed` alerts stay in the list so the
 * bell can still show them.
 */
export function listActiveAlerts(today = todayLocal()): Alert[] {
  const dismissed = new Set(
    db
      .select()
      .from(alertDismissals)
      .all()
      .map((d) => `${d.scheduleItemId}:${d.cycleKey}`),
  );

  const alerts: Alert[] = [];
  for (const vehicle of db.select().from(vehicles).all()) {
    if (vehicle.retiredAt !== null) continue; // retired vehicles raise no alerts
    for (const rule of listRulesWithStatus(vehicle.id, today)) {
      if (rule.due.status === "ok") continue;
      const key = cycleKey(rule.due);
      alerts.push({
        rule,
        vehicle: { id: vehicle.id, name: vehicle.name, odometerUnit: vehicle.odometerUnit },
        cycleKey: key,
        dismissed: dismissed.has(`${rule.id}:${key}`),
      });
    }
  }

  const rank = { overdue: 0, soon: 1, ok: 2 } as const;
  return alerts.sort(
    (a, b) =>
      rank[a.rule.due.status] - rank[b.rule.due.status] ||
      a.vehicle.name.localeCompare(b.vehicle.name) ||
      a.rule.name.localeCompare(b.rule.name),
  );
}

/** Closes the alert for this cycle; older dismissals of the rule are dropped. */
export function dismissAlert(ruleId: number, key: string): void {
  db.transaction((tx) => {
    tx.delete(alertDismissals)
      .where(and(eq(alertDismissals.scheduleItemId, ruleId), ne(alertDismissals.cycleKey, key)))
      .run();
    tx.insert(alertDismissals)
      .values({ scheduleItemId: ruleId, cycleKey: key })
      .onConflictDoNothing()
      .run();
  });
}
