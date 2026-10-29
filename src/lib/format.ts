import type { DueEstimate, DueResult } from "./due";

export function formatDistance(value: number, unit: string): string {
  return `${value.toLocaleString("fr-CA")} ${unit}`;
}

export function formatCurrency(value: number): string {
  return value.toLocaleString("fr-CA", { style: "currency", currency: "CAD" });
}

function remaining(value: number, unit: string): string {
  return value < 0 ? `en retard de ${-value} ${unit}` : `dans ${value} ${unit}`;
}

/** Human-readable next-due lines, one per interval type the rule uses. */
export function describeDue(due: DueResult, unit: string): string[] {
  const lines: string[] = [];
  if (due.nextDueOdometer !== null && due.remainingDistance !== null) {
    const left = remaining(due.remainingDistance, unit).replace(/\d+/, (n) =>
      Number(n).toLocaleString("fr-CA"),
    );
    lines.push(`à ${formatDistance(due.nextDueOdometer, unit)} (${left})`);
  }
  if (due.nextDueDate !== null && due.remainingDays !== null) {
    lines.push(`le ${due.nextDueDate} (${remaining(due.remainingDays, "j")})`);
  }
  return lines;
}

/** "≈ dans 18 j (vers le 2026-11-15)" / "≈ dans 4 mois (vers le …)" */
export function describeEstimate(estimate: DueEstimate): string {
  const wait =
    estimate.days < 90 ? `${estimate.days} j` : `${Math.round(estimate.days / 30.44)} mois`;
  return `≈ dans ${wait} (vers le ${estimate.date})`;
}

/** "en retard de 300 km · dans 12 j": what is left on each interval the rule uses. */
export function describeRemaining(due: DueResult, unit: string): string {
  const parts: string[] = [];
  if (due.remainingDistance !== null) {
    parts.push(
      remaining(due.remainingDistance, unit).replace(/\d+/, (n) =>
        Number(n).toLocaleString("fr-CA"),
      ),
    );
  }
  if (due.remainingDays !== null) parts.push(remaining(due.remainingDays, "j"));
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
