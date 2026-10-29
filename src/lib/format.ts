import type { DueEstimate, DueResult, Threshold } from "./due";

export function formatDistance(value: number, unit: string): string {
  return `${value.toLocaleString("fr-CA")} ${unit}`;
}

export function formatCurrency(value: number): string {
  return value.toLocaleString("fr-CA", { style: "currency", currency: "CAD" });
}

function remaining(value: number, unit: string): string {
  return value < 0 ? `en retard de ${-value} ${unit}` : `dans ${value} ${unit}`;
}

/** Next-due line for each interval the rule uses (null when it has no such interval). */
export function describeDueParts(
  due: DueResult,
  unit: string,
): { distance: string | null; time: string | null } {
  let distance: string | null = null;
  if (due.nextDueOdometer !== null && due.remainingDistance !== null) {
    const left = remaining(due.remainingDistance, unit).replace(/\d+/, (n) =>
      Number(n).toLocaleString("fr-CA"),
    );
    distance = `à ${formatDistance(due.nextDueOdometer, unit)} (${left})`;
  }
  const time =
    due.nextDueDate !== null && due.remainingDays !== null
      ? `le ${due.nextDueDate} (${remaining(due.remainingDays, "j")})`
      : null;
  return { distance, time };
}

/**
 * Which next-due lines to show. Once a limit is reached, that limit is the
 * message: showing the other one ("dans 2 804 km" next to "en retard de 139 j")
 * only muddies it. Before that, both are shown, as alternatives ("ou").
 */
export function dueLinesToShow(
  due: Pick<DueResult, "status" | "remainingDistance" | "remainingDays">,
  leading: Threshold | null,
): { distance: boolean; time: boolean; or: boolean } {
  const hasDistance = due.remainingDistance !== null;
  const hasTime = due.remainingDays !== null;
  const reached = due.status === "overdue";

  if (reached && leading !== null) {
    return { distance: leading === "distance", time: leading === "time", or: false };
  }
  return { distance: hasDistance, time: hasTime, or: hasDistance && hasTime && !reached };
}

/** Human-readable next-due lines, one per interval type the rule uses. */
export function describeDue(due: DueResult, unit: string): string[] {
  const { distance, time } = describeDueParts(due, unit);
  return [distance, time].filter((line): line is string => line !== null);
}

/** "≈ dans 18 j (vers le 2026-11-15)" / "≈ dans 4 mois (vers le …)" */
export function describeEstimate(estimate: DueEstimate): string {
  const wait =
    estimate.days < 90 ? `${estimate.days} j` : `${Math.round(estimate.days / 30.44)} mois`;
  return `≈ dans ${wait} (vers le ${estimate.date})`;
}

/**
 * "en retard de 300 km · dans 12 j": what is left on each interval the rule uses,
 * or only on `only` when one interval is the one that comes first.
 */
export function describeRemaining(due: DueResult, unit: string, only?: Threshold | null): string {
  const parts: string[] = [];
  if (due.remainingDistance !== null && only !== "time") {
    parts.push(
      remaining(due.remainingDistance, unit).replace(/\d+/, (n) =>
        Number(n).toLocaleString("fr-CA"),
      ),
    );
  }
  if (due.remainingDays !== null && only !== "distance") {
    parts.push(remaining(due.remainingDays, "j"));
  }
  return parts.join(" · ");
}

/** "tous les 5 000 km · tous les 6 mois" */
export function describeInterval(
  rule: { intervalDistance: number | null; intervalMonths: number | null },
  unit: string,
): string {
  const parts: string[] = [];
  if (rule.intervalDistance) parts.push(`tous les ${formatDistance(rule.intervalDistance, unit)}`);
  if (rule.intervalMonths) parts.push(`tous les ${rule.intervalMonths} mois`);
  return parts.join(" · ");
}

/** "600 km avant · 1 mois avant", or the default when the rule sets no warning of its own. */
export function describeWarning(
  rule: { warnDistance: number | null; warnMonths: number | null },
  unit: string,
): string {
  const parts: string[] = [];
  if (rule.warnDistance) parts.push(`${formatDistance(rule.warnDistance, unit)} avant`);
  if (rule.warnMonths) parts.push(`${rule.warnMonths} mois avant`);
  return parts.length > 0 ? parts.join(" · ") : "10 % de l'intervalle (par défaut)";
}
