import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "./index";
import { maintenanceLogs, type Vehicle } from "./schema";
import { computeUsageRate, type OdometerPoint } from "@/lib/usage-rate";

/**
 * Average distance driven per day, from the odometer readings of the vehicle's
 * jobs plus its current odometer when the date it was set is known.
 */
export function getUsageRate(vehicle: Pick<Vehicle, "id" | "odometer" | "odometerUpdatedAt">) {
  const points: OdometerPoint[] = db
    .select({ date: maintenanceLogs.performedAt, odometer: maintenanceLogs.odometer })
    .from(maintenanceLogs)
    .where(and(eq(maintenanceLogs.vehicleId, vehicle.id), isNotNull(maintenanceLogs.odometer)))
    .all()
    .map((l) => ({ date: l.date, odometer: l.odometer as number }));

  if (vehicle.odometerUpdatedAt) {
    points.push({ date: vehicle.odometerUpdatedAt, odometer: vehicle.odometer });
  }
  return computeUsageRate(points);
}
