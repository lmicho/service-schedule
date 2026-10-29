import Link from "next/link";
import { dismissAlert } from "@/app/alerts-actions";
import type { Alert } from "@/db/alerts";
import { describeEstimate, describeRemaining } from "@/lib/format";
import { CloseIcon } from "./icons";

const MAX_BANNERS = 3;

const STYLES = {
  overdue:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400",
  soon: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400",
} as const;

export function AlertBanner({ alerts }: { alerts: Alert[] }) {
  const open = alerts.filter((a) => !a.dismissed);
  if (open.length === 0) return null;

  const shown = open.slice(0, MAX_BANNERS);
  const hidden = open.length - shown.length;

  return (
    <div className="flex flex-col gap-3" role="region" aria-label="Alertes d'entretien">
      {shown.map(({ rule, vehicle, cycleKey }) => (
        <div
          key={rule.id}
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
            STYLES[rule.due.status === "overdue" ? "overdue" : "soon"]
          }`}
        >
          <p className="min-w-0 flex-1">
            <span className="font-medium">
              {vehicle.name} · {rule.name}
            </span>{" "}
            <span className="opacity-90">{describeRemaining(rule.due, vehicle.odometerUnit)}</span>
            {rule.estimate && (
              <span className="opacity-75"> · {describeEstimate(rule.estimate)}</span>
            )}
          </p>
          <Link
            href={`/vehicles/${vehicle.id}/logs/new?rule=${rule.id}`}
            className="font-medium whitespace-nowrap underline underline-offset-2"
          >
            Logger
          </Link>
          <form action={dismissAlert.bind(null, rule.id, cycleKey)}>
            <button
              type="submit"
              aria-label="Fermer l'alerte"
              className="inline-flex size-7 items-center justify-center rounded-md hover:bg-black/5 dark:hover:bg-white/10"
            >
              <CloseIcon className="size-4" />
            </button>
          </form>
        </div>
      ))}
      {hidden > 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          +{hidden} autre{hidden > 1 ? "s" : ""} alerte{hidden > 1 ? "s" : ""} (voir la cloche)
        </p>
      )}
    </div>
  );
}
