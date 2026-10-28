import { z } from "zod";

export function todayLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// A YYYY-MM-DD date that is not in the future.
export const pastOrTodayDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide")
  .refine((v) => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)), "Date invalide")
  .refine((v) => v <= todayLocal(), "La date ne peut pas être dans le futur");
