import type { VehicleType } from "@/db/schema";

export interface RuleTemplate {
  id: string;
  name: string;
  // Distance intervals are in km; see templateIntervals for other units.
  intervalDistance?: number;
  intervalDays?: number;
}

const KM_TO_MI = 0.621371;

export const RULE_TEMPLATES: Record<VehicleType, RuleTemplate[]> = {
  car: [
    { id: "oil", name: "Changement d'huile", intervalDistance: 8000, intervalDays: 180 },
    { id: "air-filter", name: "Filtre à air", intervalDistance: 20000, intervalDays: 730 },
    { id: "brake-fluid", name: "Liquide de frein", intervalDistance: 40000, intervalDays: 730 },
    {
      id: "coolant",
      name: "Liquide de refroidissement",
      intervalDistance: 60000,
      intervalDays: 1095,
    },
    { id: "tire-rotation", name: "Rotation des pneus", intervalDistance: 10000, intervalDays: 180 },
    {
      id: "brake-check",
      name: "Inspection des freins",
      intervalDistance: 20000,
      intervalDays: 365,
    },
  ],
  motorcycle: [
    { id: "oil", name: "Changement d'huile", intervalDistance: 6000, intervalDays: 365 },
    { id: "chain", name: "Graissage de la chaîne", intervalDistance: 600 },
    { id: "brake-fluid", name: "Liquide de frein", intervalDistance: 20000, intervalDays: 730 },
    { id: "air-filter", name: "Filtre à air", intervalDistance: 12000, intervalDays: 730 },
    { id: "spark-plugs", name: "Bougies", intervalDistance: 12000 },
  ],
  other: [{ id: "general", name: "Entretien général", intervalDays: 365 }],
};

export function findTemplate(type: VehicleType, id: string | undefined): RuleTemplate | undefined {
  return RULE_TEMPLATES[type].find((t) => t.id === id);
}

/** Template distance converted to the vehicle's unit, rounded to a tidy number. */
export function templateDistance(km: number | undefined, unit: "km" | "mi"): number | undefined {
  if (km === undefined || unit === "km") return km;
  const mi = km * KM_TO_MI;
  const step = mi >= 1000 ? 100 : 50;
  return Math.max(step, Math.round(mi / step) * step);
}
