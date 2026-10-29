import { desc, eq } from "drizzle-orm";
import { db } from "./index";
import { maintenanceLogs, scheduleItems, vehicles, type MaintenanceLog } from "./schema";
import type { LogFormInput } from "@/lib/log-form";

/**
 * Records a job on a vehicle. If the log's odometer is higher than the
 * vehicle's, the vehicle's odometer is bumped to match (a job without an
 * odometer reading leaves it alone). Returns null when the
 * vehicle does not exist; throws if the linked rule belongs to another vehicle.
 */
export function insertLog(vehicleId: number, data: LogFormInput): MaintenanceLog | null {
  return db.transaction((tx) => {
    const vehicle = tx.select().from(vehicles).where(eq(vehicles.id, vehicleId)).get();
    if (!vehicle) return null;

    if (data.scheduleItemId !== null) {
      const rule = tx
        .select({ vehicleId: scheduleItems.vehicleId })
        .from(scheduleItems)
        .where(eq(scheduleItems.id, data.scheduleItemId))
        .get();
      if (rule?.vehicleId !== vehicleId) throw new Error("Rule does not belong to this vehicle");
    }

    const log = tx
      .insert(maintenanceLogs)
      .values({ ...data, vehicleId })
      .returning()
      .get();

    if (data.odometer !== null && data.odometer > vehicle.odometer) {
      tx.update(vehicles).set({ odometer: data.odometer }).where(eq(vehicles.id, vehicleId)).run();
    }
    return log;
  });
}

export function listLogs(vehicleId: number): MaintenanceLog[] {
  return db
    .select()
    .from(maintenanceLogs)
    .where(eq(maintenanceLogs.vehicleId, vehicleId))
    .orderBy(desc(maintenanceLogs.performedAt), desc(maintenanceLogs.id))
    .all();
}
