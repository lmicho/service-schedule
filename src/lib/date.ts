import { z } from "zod";

export function todayLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const MS_PER_DAY = 86_400_000;

/** Whole days from `from` to `to` (both YYYY-MM-DD); negative when `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / MS_PER_DAY);
}

/** Odometer readings older than this are flagged as stale. */
export const STALE_ODOMETER_DAYS = 30;

export function isStale(updatedAt: string | null, today: string): boolean {
  return updatedAt !== null && daysBetween(updatedAt, today) > STALE_ODOMETER_DAYS;
}

// A YYYY-MM-DD date that is not in the future.
export const pastOrTodayDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide")
  .refine((v) => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)), "Date invalide")
  .refine((v) => v <= todayLocal(), "La date ne peut pas être dans le futur");
