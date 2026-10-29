import { count, eq } from "drizzle-orm";
import { db } from "./index";
import { maintenanceLogs, scheduleItems, vehicles } from "./schema";
import { todayLocal } from "@/lib/date";
import type { VehicleFormInput } from "@/lib/vehicle-form";

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

/**
 * Quick odometer update. Returns false when the vehicle does not exist. The
 * date is kept so the driving pace can be estimated from it later.
 */
export function updateVehicleOdometer(
  vehicleId: number,
  odometer: number,
  today = todayLocal(),
): boolean {
  return (
    db
      .update(vehicles)
      .set({ odometer, odometerUpdatedAt: today })
      .where(eq(vehicles.id, vehicleId))
      .returning({ id: vehicles.id })
      .all().length > 0
  );
}

/**
 * Saves the vehicle form. The odometer date only moves when the odometer
 * itself changed. Returns false when the vehicle does not exist.
 */
export function saveVehicle(
  vehicleId: number,
  data: VehicleFormInput,
  today = todayLocal(),
): boolean {
  const existing = db
    .select({ odometer: vehicles.odometer })
    .from(vehicles)
    .where(eq(vehicles.id, vehicleId))
    .get();
  if (!existing) return false;

  db.update(vehicles)
    .set(existing.odometer === data.odometer ? data : { ...data, odometerUpdatedAt: today })
    .where(eq(vehicles.id, vehicleId))
    .run();
  return true;
}
