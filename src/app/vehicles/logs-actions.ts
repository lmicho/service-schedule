"use server";

import { updateTag } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { insertLog } from "@/db/logs";
import { parseLogForm, type LogFormState } from "@/lib/log-form";

export async function createLog(
  vehicleId: number,
  _prev: LogFormState,
  formData: FormData,
): Promise<LogFormState> {
  const parsed = parseLogForm(formData);
  if ("state" in parsed) return parsed.state;

  if (!insertLog(vehicleId, parsed.data)) notFound();

  updateTag("vehicles");
  redirect(`/vehicles/${vehicleId}`);
}
