export const VEHICLE_TABS = ["rules", "history"] as const;
export type VehicleTab = (typeof VEHICLE_TABS)[number];

type SearchParams = Record<string, string | string[] | undefined>;

/** URL of a vehicle page on a given tab. */
export function vehicleTabHref(vehicleId: number, tab: VehicleTab): string {
  return `/vehicles/${vehicleId}?tab=${tab}`;
}

/**
 * Which tab of the vehicle page to show. An explicit, valid `?tab=` wins. Without
 * one: the history when history filters are in the URL (older links) or when the
 * vehicle has no rules tab (retired), otherwise the rules.
 */
export function parseVehicleTab(
  params: SearchParams,
  ctx: { hasRulesTab: boolean; hasFilters: boolean },
): VehicleTab {
  if (!ctx.hasRulesTab) return "history";
  const raw = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const explicit = VEHICLE_TABS.find((t) => t === raw);
  return explicit ?? (ctx.hasFilters ? "history" : "rules");
}
