import { z } from "zod";
import { RETIRED_REASONS } from "@/db/schema";
import { pastOrTodayDate } from "./date";

export const retireFormSchema = z.object({
  reason: z.enum(RETIRED_REASONS, { error: "Choisis une raison" }),
  retiredAt: pastOrTodayDate,
});

export type RetireFormInput = z.output<typeof retireFormSchema>;

export type RetireFormState = {
  errors?: Partial<Record<keyof RetireFormInput, string>>;
  values?: Record<string, string>;
};

export function parseRetireForm(
  formData: FormData,
): { data: RetireFormInput } | { state: RetireFormState } {
  const values = Object.fromEntries(
    [...formData.entries()].filter(([, v]) => typeof v === "string"),
  ) as Record<string, string>;

  const result = retireFormSchema.safeParse(values);
  if (result.success) return { data: result.data };

  const errors: NonNullable<RetireFormState["errors"]> = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof RetireFormInput;
    errors[key] ??= issue.message;
  }
  return { state: { errors, values } };
}
