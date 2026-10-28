"use server";

import { updateTag } from "next/cache";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { parseVehicleForm, type VehicleFormState } from "@/lib/vehicle-form";

export async function createVehicle(
  _prev: VehicleFormState,
  formData: FormData,
): Promise<VehicleFormState> {
  const parsed = parseVehicleForm(formData);
  if ("state" in parsed) return parsed.state;

  const [vehicle] = db.insert(vehicles).values(parsed.data).returning({ id: vehicles.id }).all();

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

  const updated = db
    .update(vehicles)
    .set(parsed.data)
    .where(eq(vehicles.id, id))
    .returning({ id: vehicles.id })
    .all();
  if (updated.length === 0) notFound();

  updateTag("vehicles");
  redirect(`/vehicles/${id}`);
}
