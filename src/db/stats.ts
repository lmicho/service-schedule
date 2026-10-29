import { count, desc, eq, sum } from "drizzle-orm";
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

/** Total cost of logged jobs per vehicle (0 when none), biggest spender first. */
export function listCostByVehicle(): { id: number; name: string; cost: number }[] {
  return db
    .select({ id: vehicles.id, name: vehicles.name, cost: sum(maintenanceLogs.cost) })
    .from(vehicles)
    .leftJoin(maintenanceLogs, eq(maintenanceLogs.vehicleId, vehicles.id))
    .groupBy(vehicles.id)
    .all()
    .map((row) => ({ id: row.id, name: row.name, cost: Number(row.cost ?? 0) }))
    .sort((a, b) => b.cost - a.cost || a.name.localeCompare(b.name));
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
