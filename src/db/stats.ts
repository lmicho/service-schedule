import { count, desc, eq, sum } from "drizzle-orm";
import { db } from "./index";
import { maintenanceLogs, vehicles } from "./schema";

export function getDashboardStats() {
  const vehicleCount = db.select({ n: count() }).from(vehicles).get()?.n ?? 0;
  const totals = db
    .select({ n: count(), cost: sum(maintenanceLogs.cost) })
    .from(maintenanceLogs)
    .get();
  return {
    vehicleCount,
    logCount: totals?.n ?? 0,
    totalCost: Number(totals?.cost ?? 0),
  };
}

export function listRecentLogs(limit = 5) {
  return db
    .select({
      id: maintenanceLogs.id,
      title: maintenanceLogs.title,
      performedAt: maintenanceLogs.performedAt,
      odometer: maintenanceLogs.odometer,
      cost: maintenanceLogs.cost,
      vehicleId: vehicles.id,
      vehicleName: vehicles.name,
      odometerUnit: vehicles.odometerUnit,
    })
    .from(maintenanceLogs)
    .innerJoin(vehicles, eq(maintenanceLogs.vehicleId, vehicles.id))
    .orderBy(desc(maintenanceLogs.performedAt), desc(maintenanceLogs.id))
    .limit(limit)
    .all();
}
