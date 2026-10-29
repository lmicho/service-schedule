import { desc, eq, sum } from "drizzle-orm";
import { db } from "./index";
import { maintenanceLogs, vehicles, type MaintenanceLog } from "./schema";

/** Total cost of logged jobs per vehicle (0 when none), biggest spender first. */
export function listCostByVehicle(): {
  id: number;
  name: string;
  cost: number;
  retired: boolean;
}[] {
  return db
    .select({
      id: vehicles.id,
      name: vehicles.name,
      retiredAt: vehicles.retiredAt,
      cost: sum(maintenanceLogs.cost),
    })
    .from(vehicles)
    .leftJoin(maintenanceLogs, eq(maintenanceLogs.vehicleId, vehicles.id))
    .groupBy(vehicles.id)
    .all()
    .map((row) => ({
      id: row.id,
      name: row.name,
      cost: Number(row.cost ?? 0),
      retired: row.retiredAt !== null,
    }))
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
