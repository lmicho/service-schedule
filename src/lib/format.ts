export function formatDistance(value: number, unit: string): string {
  return `${value.toLocaleString("fr-CA")} ${unit}`;
}

export function formatCurrency(value: number): string {
  return value.toLocaleString("fr-CA", { style: "currency", currency: "CAD" });
}
