import Link from "next/link";
import type { RuleWithStatus } from "@/db/rules";
import { describeDue, describeEstimate, describeInterval } from "@/lib/format";
import { PencilIcon } from "./icons";
import { StatusBadge, linkMuted, tableWrap, td, th, tr } from "./ui";

export function RulesTable({
  rules,
  vehicleId,
  unit,
}: {
  rules: RuleWithStatus[];
  vehicleId: number;
  unit: string;
}) {
  if (rules.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Aucune règle pour l&apos;instant. Ajoute-en pour savoir quand le prochain entretien est dû.
      </p>
    );
  }

  return (
    <div className={tableWrap}>
      <table className="w-full min-w-140">
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-800">
            <th className={th}>Règle</th>
            <th className={th}>Intervalle</th>
            <th className={th}>Prochaine échéance</th>
            <th className={th}>Statut</th>
            <th className={th}></th>
          </tr>
        </thead>
        <tbody>
          {rules.map((rule) => (
            <tr key={rule.id} className={tr}>
              <td className={`${td} font-medium`}>
                <Link
                  href={`/vehicles/${vehicleId}/rules/${rule.id}`}
                  className="hover:text-brand-500 dark:hover:text-brand-400"
                >
                  {rule.name}
                </Link>
              </td>
              <td className={`${td} text-gray-500 dark:text-gray-400`}>
                {describeInterval(rule, unit)}
              </td>
              <td className={td}>
                {describeDue(rule.due, unit).map((line) => (
                  <div key={line}>{line}</div>
                ))}
                {rule.estimate && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {describeEstimate(rule.estimate)}
                  </div>
                )}
              </td>
              <td className={td}>
                <StatusBadge status={rule.due.status} />
              </td>
              <td className={`${td} whitespace-nowrap`}>
                <div className="flex justify-end gap-4">
                  <Link
                    href={`/vehicles/${vehicleId}/logs/new?rule=${rule.id}`}
                    className={linkMuted}
                  >
                    Logger
                  </Link>
                  <Link
                    href={`/vehicles/${vehicleId}/rules/${rule.id}/edit`}
                    className={linkMuted}
                    aria-label="Modifier"
                    title="Modifier"
                  >
                    <PencilIcon />
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
