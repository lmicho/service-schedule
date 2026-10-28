import { count, desc, sum } from "drizzle-orm";
import { db } from "./index";
import { maintenanceLogs, vehicles, type MaintenanceLog } from "./schema";

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

export function listVehiclesWithRecentLogs(limit = 5) {
  const allVehicles = db.select().from(vehicles).orderBy(vehicles.name).all();
  const allLogs = db
    .select()
    .from(maintenanceLogs)
    .orderBy(desc(maintenanceLogs.performedAt), desc(maintenanceLogs.id))
    .all();

  const byVehicle = new Map<number, MaintenanceLog[]>();
  for (const log of allLogs) {
    const list = byVehicle.get(log.vehicleId) ?? [];
    list.push(log);
    byVehicle.set(log.vehicleId, list);
  }

  return allVehicles.map((vehicle) => {
    const logs = byVehicle.get(vehicle.id) ?? [];
    return { vehicle, logs: logs.slice(0, limit), totalLogs: logs.length };
  });
}
