import { count, eq } from "drizzle-orm";
import { db } from "./index";
import { maintenanceLogs, scheduleItems, vehicles } from "./schema";

/** How much data deleting the vehicle would take with it. */
export function getVehicleUsage(vehicleId: number): { logs: number; rules: number } {
  const logs = db
    .select({ n: count() })
    .from(maintenanceLogs)
    .where(eq(maintenanceLogs.vehicleId, vehicleId))
    .get();
  const rules = db
    .select({ n: count() })
    .from(scheduleItems)
    .where(eq(scheduleItems.vehicleId, vehicleId))
    .get();
  return { logs: logs?.n ?? 0, rules: rules?.n ?? 0 };
}

/**
 * Deletes a vehicle with its jobs, rules and closed alerts (foreign-key
 * cascade). Returns false when the vehicle does not exist.
 */
export function deleteVehicle(vehicleId: number): boolean {
  return (
    db.delete(vehicles).where(eq(vehicles.id, vehicleId)).returning({ id: vehicles.id }).all()
      .length > 0
  );
}
