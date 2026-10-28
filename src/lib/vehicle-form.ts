import { z } from "zod";
import { ODOMETER_UNITS, VEHICLE_TYPES } from "@/db/schema";

// Empty form fields arrive as "" — treat them as absent.
const absentAsEmpty = (v: unknown) => v ?? "";

const optionalText = z.preprocess(
  absentAsEmpty,
  z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v)),
);

const optionalYear = z.preprocess(
  absentAsEmpty,
  z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v)))
    .pipe(
      z
        .number()
        .int("L'année doit être un entier")
        .min(1900, "Année invalide")
        .max(new Date().getFullYear() + 1, "Année invalide")
        .nullable(),
    ),
);

export const vehicleFormSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis").max(80),
  type: z.enum(VEHICLE_TYPES, { error: "Type invalide" }),
  make: optionalText,
  model: optionalText,
  year: optionalYear,
  vin: optionalText,
  odometer: z
    .string()
    .trim()
    .min(1, "L'odomètre est requis")
    .transform(Number)
    .pipe(z.number().int("Entier requis").min(0, "Doit être positif")),
  odometerUnit: z.enum(ODOMETER_UNITS, { error: "Unité invalide" }),
});

export type VehicleFormInput = z.output<typeof vehicleFormSchema>;

export type VehicleFormState = {
  errors?: Partial<Record<keyof VehicleFormInput, string>>;
  values?: Record<string, string>;
};

export function parseVehicleForm(
  formData: FormData,
): { data: VehicleFormInput } | { state: VehicleFormState } {
  const values = Object.fromEntries(
    [...formData.entries()].filter(([, v]) => typeof v === "string"),
  ) as Record<string, string>;

  const result = vehicleFormSchema.safeParse(values);
  if (result.success) return { data: result.data };

  const errors: NonNullable<VehicleFormState["errors"]> = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof VehicleFormInput;
    errors[key] ??= issue.message;
  }
  return { state: { errors, values } };
}
