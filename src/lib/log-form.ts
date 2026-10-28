import { z } from "zod";
import { pastOrTodayDate } from "./date";

const optionalText = z.preprocess(
  (v) => v ?? "",
  z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v)),
);

const optionalCost = z.preprocess(
  (v) => v ?? "",
  z
    .string()
    .trim()
    // French locale users type "45,50"
    .transform((v) => (v === "" ? null : Number(v.replace(",", "."))))
    .pipe(z.number({ error: "Montant invalide" }).min(0, "Doit être positif").nullable()),
);

export const logFormSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis").max(120),
  performedAt: pastOrTodayDate,
  odometer: z
    .string()
    .trim()
    .min(1, "L'odomètre est requis")
    .transform(Number)
    .pipe(z.number().int("Entier requis").min(0, "Doit être positif")),
  cost: optionalCost,
  scheduleItemId: z.preprocess(
    (v) => v ?? "",
    z
      .string()
      .trim()
      .transform((v) => (v === "" ? null : Number(v)))
      .pipe(z.number().int().min(1).nullable()),
  ),
  shop: optionalText,
  notes: optionalText,
});

export type LogFormInput = z.output<typeof logFormSchema>;

export type LogFormState = {
  errors?: Partial<Record<keyof LogFormInput, string>>;
  values?: Record<string, string>;
};

export function parseLogForm(formData: FormData): { data: LogFormInput } | { state: LogFormState } {
  const values = Object.fromEntries(
    [...formData.entries()].filter(([, v]) => typeof v === "string"),
  ) as Record<string, string>;

  const result = logFormSchema.safeParse(values);
  if (result.success) return { data: result.data };

  const errors: NonNullable<LogFormState["errors"]> = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof LogFormInput;
    errors[key] ??= issue.message;
  }
  return { state: { errors, values } };
}
