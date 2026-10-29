import { connection } from "next/server";
import { listActiveAlerts } from "@/db/alerts";
import { describeEstimate, describeRemaining } from "@/lib/format";
import { AlertBellPanel } from "./alert-bell-panel";

export async function AlertBell() {
  await connection(); // sync SQLite driver + current date: render at request time
  const items = listActiveAlerts().map(({ rule, vehicle }) => ({
    ruleId: rule.id,
    ruleName: rule.name,
    vehicleId: vehicle.id,
    vehicleName: vehicle.name,
    status: rule.due.status === "overdue" ? ("overdue" as const) : ("soon" as const),
    remaining: describeRemaining(rule.due, vehicle.odometerUnit),
    estimate: rule.estimate ? describeEstimate(rule.estimate) : null,
  }));

  return <AlertBellPanel items={items} />;
}
