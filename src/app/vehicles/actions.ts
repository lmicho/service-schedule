"use server";

import { updateTag } from "next/cache";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { deleteVehicle as removeVehicle, saveVehicle, updateVehicleOdometer } from "@/db/vehicles";
import { todayLocal } from "@/lib/date";
import { parseOdometerUpdate, type OdometerFormState } from "@/lib/odometer-form";
import { parseVehicleForm, type VehicleFormState } from "@/lib/vehicle-form";

export async function createVehicle(
  _prev: VehicleFormState,
  formData: FormData,
): Promise<VehicleFormState> {
  const parsed = parseVehicleForm(formData);
  if ("state" in parsed) return parsed.state;

  const [vehicle] = db
    .insert(vehicles)
    .values({ ...parsed.data, odometerUpdatedAt: todayLocal() })
    .returning({ id: vehicles.id })
    .all();

  updateTag("vehicles");
  redirect(`/vehicles/${vehicle.id}`);
}

export async function updateVehicle(
  id: number,
  _prev: VehicleFormState,
  formData: FormData,
): Promise<VehicleFormState> {
  const parsed = parseVehicleForm(formData);
  if ("state" in parsed) return parsed.state;

  if (!saveVehicle(id, parsed.data)) notFound();

  updateTag("vehicles");
  redirect(`/vehicles/${id}`);
}

export async function deleteVehicle(id: number): Promise<void> {
  if (!removeVehicle(id)) notFound();

  updateTag("vehicles");
  redirect("/");
}

export async function updateOdometer(
  vehicleId: number,
  _prev: OdometerFormState,
  formData: FormData,
): Promise<OdometerFormState> {
  const raw = formData.get("odometer");
  const vehicle = db
    .select({ odometer: vehicles.odometer, unit: vehicles.odometerUnit })
    .from(vehicles)
    .where(eq(vehicles.id, vehicleId))
    .get();
  if (!vehicle) notFound();

  const parsed = parseOdometerUpdate(raw, { odometer: vehicle.odometer, unit: vehicle.unit });
  if ("error" in parsed) return { error: parsed.error, value: String(raw ?? "") };

  updateVehicleOdometer(vehicleId, parsed.odometer);
  updateTag("vehicles");
  return {};
}
