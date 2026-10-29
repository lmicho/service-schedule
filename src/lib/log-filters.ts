import type { MaintenanceLog } from "@/db/schema";

export const LOG_SORTS = ["date", "cost", "odometer"] as const;
export type LogSort = (typeof LOG_SORTS)[number];

export interface LogFilters {
  q: string;
  year: number | null;
  /** A rule id, "none" for jobs not linked to a rule, or null for any. */
  rule: number | "none" | null;
  sort: LogSort;
}

export const NO_FILTERS: LogFilters = { q: "", year: null, rule: null, sort: "date" };

type SearchParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Reads filters from the URL; anything invalid is ignored rather than rejected. */
export function parseLogFilters(params: SearchParams): LogFilters {
  const year = Number(first(params.year));
  const ruleParam = first(params.rule);
  const rule = Number(ruleParam);
  const sort = first(params.sort);

  return {
    q: (first(params.q) ?? "").trim(),
    year: Number.isInteger(year) && year >= 1900 && year <= 2999 ? year : null,
    rule: ruleParam === "none" ? "none" : Number.isInteger(rule) && rule > 0 ? rule : null,
    sort: LOG_SORTS.find((s) => s === sort) ?? "date",
  };
}

export function hasActiveFilters(f: LogFilters): boolean {
  return f.q !== "" || f.year !== null || f.rule !== null || f.sort !== "date";
}

// "Vidange" must match "vidange" and "Équilibrage" must match "equilibrage".
const normalize = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/** Filters and sorts jobs; the input order (newest first) is kept for the date sort. */
export function filterLogs(logs: MaintenanceLog[], f: LogFilters): MaintenanceLog[] {
  const needle = normalize(f.q);

  const kept = logs.filter((log) => {
    if (f.year !== null && log.performedAt.slice(0, 4) !== String(f.year)) return false;
    if (f.rule === "none" && log.scheduleItemId !== null) return false;
    if (typeof f.rule === "number" && log.scheduleItemId !== f.rule) return false;
    if (needle) {
      const haystack = normalize([log.title, log.notes, log.shop].filter(Boolean).join(" "));
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });

  if (f.sort === "date") return kept;

  const value = (log: MaintenanceLog) => (f.sort === "cost" ? log.cost : log.odometer);
  return [...kept].sort((a, b) => {
    const [va, vb] = [value(a), value(b)];
    if (va === null && vb === null) return 0;
    if (va === null) return 1; // unknown values last
    if (vb === null) return -1;
    return vb - va || b.performedAt.localeCompare(a.performedAt) || b.id - a.id;
  });
}

/** Years that have at least one job, newest first. */
export function logYears(logs: MaintenanceLog[]): number[] {
  return [...new Set(logs.map((l) => Number(l.performedAt.slice(0, 4))))].sort((a, b) => b - a);
}
