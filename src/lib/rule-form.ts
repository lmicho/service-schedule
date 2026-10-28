import { z } from "zod";
import { pastOrTodayDate } from "./date";

const optionalPositiveInt = z.preprocess(
  (v) => v ?? "",
  z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v)))
    .pipe(
      z
        .number({ error: "Nombre invalide" })
        .int("Entier requis")
        .min(1, "Doit être supérieur à 0")
        .nullable(),
    ),
);

const optionalText = z.preprocess(
  (v) => v ?? "",
  z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v)),
);

export const ruleFormSchema = z
  .object({
    name: z.string().trim().min(1, "Le nom est requis").max(120),
    intervalDistance: optionalPositiveInt,
    intervalDays: optionalPositiveInt,
    warnDistance: optionalPositiveInt,
    warnDays: optionalPositiveInt,
    baselineOdometer: z
      .string()
      .trim()
      .min(1, "L'odomètre est requis")
      .transform(Number)
      .pipe(
        z.number({ error: "Nombre invalide" }).int("Entier requis").min(0, "Doit être positif"),
      ),
    baselineDate: pastOrTodayDate,
    notes: optionalText,
  })
  .superRefine((v, ctx) => {
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });

    if (v.intervalDistance === null && v.intervalDays === null) {
      issue("intervalDistance", "Indique un intervalle en distance ou en jours");
    }
    if (v.warnDistance !== null) {
      if (v.intervalDistance === null) issue("warnDistance", "Nécessite un intervalle en distance");
      else if (v.warnDistance >= v.intervalDistance)
        issue("warnDistance", "Doit être plus petit que l'intervalle");
    }
    if (v.warnDays !== null) {
      if (v.intervalDays === null) issue("warnDays", "Nécessite un intervalle en jours");
      else if (v.warnDays >= v.intervalDays)
        issue("warnDays", "Doit être plus petit que l'intervalle");
    }
  });

export type RuleFormInput = z.output<typeof ruleFormSchema>;

export type RuleFormState = {
  errors?: Partial<Record<keyof RuleFormInput, string>>;
  values?: Record<string, string>;
};

export function parseRuleForm(
  formData: FormData,
): { data: RuleFormInput } | { state: RuleFormState } {
  const values = Object.fromEntries(
    [...formData.entries()].filter(([, v]) => typeof v === "string"),
  ) as Record<string, string>;

  const result = ruleFormSchema.safeParse(values);
  if (result.success) return { data: result.data };

  const errors: NonNullable<RuleFormState["errors"]> = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof RuleFormInput;
    errors[key] ??= issue.message;
  }
  return { state: { errors, values } };
}
