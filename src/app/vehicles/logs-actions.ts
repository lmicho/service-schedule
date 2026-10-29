"use server";

import { updateTag } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { deleteLog as removeLog, insertLog, updateLog as saveLog } from "@/db/logs";
import { parseLogForm, type LogFormState } from "@/lib/log-form";
import { vehicleTabHref } from "@/lib/vehicle-tabs";

export async function createLog(
  vehicleId: number,
  _prev: LogFormState,
  formData: FormData,
): Promise<LogFormState> {
  const parsed = parseLogForm(formData);
  if ("state" in parsed) return parsed.state;

  if (!insertLog(vehicleId, parsed.data)) notFound();

  updateTag("vehicles");
  redirect(vehicleTabHref(vehicleId, "history"));
}

export async function updateLog(
  vehicleId: number,
  logId: number,
  _prev: LogFormState,
  formData: FormData,
): Promise<LogFormState> {
  const parsed = parseLogForm(formData);
  if ("state" in parsed) return parsed.state;

  if (!saveLog(vehicleId, logId, parsed.data)) notFound();

  updateTag("vehicles");
  redirect(vehicleTabHref(vehicleId, "history"));
}

export async function deleteLog(vehicleId: number, logId: number): Promise<void> {
  if (!removeLog(vehicleId, logId)) notFound();

  updateTag("vehicles");
  redirect(vehicleTabHref(vehicleId, "history"));
}
