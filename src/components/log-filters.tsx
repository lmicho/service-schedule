import Link from "next/link";
import { Field, Select, fieldClass } from "@/components/form-field";
import { buttonOutline, linkMuted } from "@/components/ui";
import { hasActiveFilters, type LogFilters } from "@/lib/log-filters";

const SORT_LABELS = {
  date: "Date (récent d'abord)",
  cost: "Coût (élevé d'abord)",
  odometer: "Odomètre (élevé d'abord)",
} as const;

/** GET form: the filters live in the URL, so it works without client JavaScript. */
export function LogFiltersForm({
  filters,
  years,
  rules,
  resetHref,
  shown,
  total,
}: {
  filters: LogFilters;
  years: number[];
  rules: { id: number; name: string }[];
  resetHref: string;
  shown: number;
  total: number;
}) {
  const active = hasActiveFilters(filters);

  return (
    <form method="get" className="mb-4 flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Recherche">
          <input
            name="q"
            type="search"
            placeholder="Huile, garage, notes…"
            defaultValue={filters.q}
            className={fieldClass}
          />
        </Field>
        <Field label="Année">
          <Select name="year" defaultValue={filters.year?.toString() ?? ""}>
            <option value="">Toutes</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Règle">
          <Select name="rule" defaultValue={filters.rule?.toString() ?? ""}>
            <option value="">Toutes</option>
            <option value="none">Sans règle</option>
            {rules.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Tri">
          <Select name="sort" defaultValue={filters.sort}>
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" className={buttonOutline}>
          Filtrer
        </button>
        {active && (
          <Link href={resetHref} className={linkMuted}>
            Réinitialiser
          </Link>
        )}
        {active && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {shown} sur {total} travaux
          </span>
        )}
      </div>
    </form>
  );
}
