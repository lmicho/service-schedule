import { formatDistance } from "./format";

export type OdometerFormState = { error?: string; value?: string };

/**
 * Validates a quick odometer update. The reading can only go up: lowering it is
 * almost always a typo, and real corrections go through "Modifier le véhicule".
 */
export function parseOdometerUpdate(
  raw: unknown,
  current: { odometer: number; unit: string },
): { odometer: number } | { error: string } {
  // "132 500" typed with (non-breaking) spaces is fine.
  const text = String(raw ?? "").replace(/[\s\u00a0\u202f]/g, "");
  if (text === "") return { error: "L'odomètre est requis" };
  if (!/^\d+$/.test(text)) return { error: "Entier positif requis" };

  const odometer = Number(text);
  if (odometer < current.odometer) {
    return {
      error: `Doit être au moins ${formatDistance(current.odometer, current.unit)} (utilise « Modifier » pour corriger une erreur)`,
    };
  }
  return { odometer };
}
