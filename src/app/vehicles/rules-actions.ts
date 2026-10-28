"use server";

import { updateTag } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { deleteRule as removeRule, insertRule, updateRule as saveRule } from "@/db/rules";
import { parseRuleForm, type RuleFormState } from "@/lib/rule-form";

export async function createRule(
  vehicleId: number,
  _prev: RuleFormState,
  formData: FormData,
): Promise<RuleFormState> {
  const parsed = parseRuleForm(formData);
  if ("state" in parsed) return parsed.state;

  if (!insertRule(vehicleId, parsed.data)) notFound();

  updateTag("vehicles");
  redirect(`/vehicles/${vehicleId}`);
}

export async function updateRule(
  vehicleId: number,
  ruleId: number,
  _prev: RuleFormState,
  formData: FormData,
): Promise<RuleFormState> {
  const parsed = parseRuleForm(formData);
  if ("state" in parsed) return parsed.state;

  if (!saveRule(vehicleId, ruleId, parsed.data)) notFound();

  updateTag("vehicles");
  redirect(`/vehicles/${vehicleId}`);
}

export async function deleteRule(vehicleId: number, ruleId: number): Promise<void> {
  if (!removeRule(vehicleId, ruleId)) notFound();

  updateTag("vehicles");
  redirect(`/vehicles/${vehicleId}`);
}
