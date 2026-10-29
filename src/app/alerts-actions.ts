"use server";

import { updateTag } from "next/cache";
import { dismissAlert as closeAlert } from "@/db/alerts";

export async function dismissAlert(ruleId: number, cycleKey: string): Promise<void> {
  closeAlert(ruleId, cycleKey);
  updateTag("vehicles");
}
