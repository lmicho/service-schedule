import { and, desc, eq } from "drizzle-orm";
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

    assertRuleBelongsTo(tx, vehicleId, data.scheduleItemId);

    const log = tx
      .insert(maintenanceLogs)
      .values({ ...data, vehicleId })
      .returning()
      .get();

    bumpOdometer(tx, vehicle, data.odometer);
    return log;
  });
}

/**
 * Edits a job. Like insertLog, it can raise the vehicle's odometer but never
 * lowers it. Returns null when the log does not exist on that vehicle.
 */
export function updateLog(
  vehicleId: number,
  logId: number,
  data: LogFormInput,
): MaintenanceLog | null {
  return db.transaction((tx) => {
    const vehicle = tx.select().from(vehicles).where(eq(vehicles.id, vehicleId)).get();
    if (!vehicle) return null;

    assertRuleBelongsTo(tx, vehicleId, data.scheduleItemId);

    const log = tx
      .update(maintenanceLogs)
      .set(data)
      .where(and(eq(maintenanceLogs.id, logId), eq(maintenanceLogs.vehicleId, vehicleId)))
      .returning()
      .get();
    if (!log) return null;

    bumpOdometer(tx, vehicle, data.odometer);
    return log;
  });
}

/**
 * Returns false when the log does not exist on that vehicle. The vehicle's
 * odometer is left alone, and a rule it was linked to falls back to the
 * rule's previous job (or its baseline).
 */
export function deleteLog(vehicleId: number, logId: number): boolean {
  return (
    db
      .delete(maintenanceLogs)
      .where(and(eq(maintenanceLogs.id, logId), eq(maintenanceLogs.vehicleId, vehicleId)))
      .returning({ id: maintenanceLogs.id })
      .all().length > 0
  );
}

export function getLog(vehicleId: number, logId: number): MaintenanceLog | undefined {
  return db
    .select()
    .from(maintenanceLogs)
    .where(and(eq(maintenanceLogs.id, logId), eq(maintenanceLogs.vehicleId, vehicleId)))
    .get();
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

function assertRuleBelongsTo(tx: Tx, vehicleId: number, scheduleItemId: number | null) {
  if (scheduleItemId === null) return;
  const rule = tx
    .select({ vehicleId: scheduleItems.vehicleId })
    .from(scheduleItems)
    .where(eq(scheduleItems.id, scheduleItemId))
    .get();
  if (rule?.vehicleId !== vehicleId) throw new Error("Rule does not belong to this vehicle");
}

function bumpOdometer(tx: Tx, vehicle: { id: number; odometer: number }, odometer: number | null) {
  if (odometer !== null && odometer > vehicle.odometer) {
    tx.update(vehicles).set({ odometer }).where(eq(vehicles.id, vehicle.id)).run();
  }
}

export function listLogs(vehicleId: number): MaintenanceLog[] {
  return db
    .select()
    .from(maintenanceLogs)
    .where(eq(maintenanceLogs.vehicleId, vehicleId))
    .orderBy(desc(maintenanceLogs.performedAt), desc(maintenanceLogs.id))
    .all();
}
