import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { listActiveAlerts } from "@/db/alerts";
import { OdometerQuickEdit } from "@/components/odometer-quick-edit";
import { updateOdometer } from "@/app/vehicles/actions";
import { isStale, todayLocal } from "@/lib/date";
import { AlertBanner } from "@/components/alert-banner";
import { listCostByVehicle, listVehiclesWithRecentLogs } from "@/db/stats";
import { CashIcon, PlusIcon } from "@/components/icons";
import { LogsTable } from "@/components/logs-table";
import {
  Badge,
  Card,
  MetricCard,
  PageTitle,
  buttonOutline,
  buttonPrimary,
  linkMuted,
} from "@/components/ui";
import { formatCurrency } from "@/lib/format";
import { RETIRED_REASON_LABELS, VEHICLE_TYPE_LABELS } from "@/lib/labels";

const LOGS_PER_VEHICLE = 5;

async function Dashboard() {
  await connection(); // sync SQLite driver: keep the queries out of prerendering
  const all = listVehiclesWithRecentLogs(LOGS_PER_VEHICLE);
  const entries = all.filter((e) => e.vehicle.retiredAt === null);
  const retiredEntries = all.filter((e) => e.vehicle.retiredAt !== null);
  const costs = listCostByVehicle();
  const totalCost = costs.reduce((sum, v) => sum + v.cost, 0);
  const alerts = listActiveAlerts();
  const today = todayLocal();

  return (
    <>
      <AlertBanner alerts={alerts} />
      {costs.length > 0 && (
        <MetricCard
          icon={<CashIcon />}
          label="Dépenses totales"
          value={formatCurrency(totalCost)}
          detail={
            costs.length > 1 && (
              <ul className="flex flex-col justify-end gap-1.5 border-t border-gray-100 pt-4 text-sm sm:min-w-0 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-4 dark:border-gray-800">
                {costs.map((v) => (
                  <li key={v.id} className="flex items-center justify-between gap-3">
                    <Link href={`/vehicles/${v.id}`} className={`${linkMuted} truncate`}>
                      {v.name}
                      {v.retired && " (retiré)"}
                    </Link>
                    <span className="whitespace-nowrap text-gray-800 dark:text-white/90">
                      {formatCurrency(v.cost)}
                    </span>
                  </li>
                ))}
              </ul>
            )
          }
        />
      )}

      {entries.length === 0 ? (
        <Card>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            {retiredEntries.length > 0
              ? "Aucun véhicule actif pour l'instant."
              : "Aucun véhicule pour l'instant."}
          </p>
          <Link href="/vehicles/new" className={buttonPrimary}>
            <PlusIcon />
            Ajouter un véhicule
          </Link>
        </Card>
      ) : (
        entries.map(({ vehicle, logs, totalLogs }) => (
          <Card
            key={vehicle.id}
            action={
              <Link href={`/vehicles/${vehicle.id}/logs/new`} className={buttonOutline}>
                <PlusIcon />
                Logger un travail
              </Link>
            }
            title={vehicle.name}
          >
            <div className="-mt-2 mb-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Badge>{VEHICLE_TYPE_LABELS[vehicle.type]}</Badge>
              <OdometerQuickEdit
                action={updateOdometer.bind(null, vehicle.id)}
                odometer={vehicle.odometer}
                unit={vehicle.odometerUnit}
                updatedAt={vehicle.odometerUpdatedAt}
                stale={isStale(vehicle.odometerUpdatedAt, today)}
              />
            </div>
            <LogsTable logs={logs} unit={vehicle.odometerUnit} />
            <div className="mt-4">
              <Link href={`/vehicles/${vehicle.id}`} className={linkMuted}>
                {totalLogs > logs.length ? `Voir tout (${totalLogs})` : "Voir la fiche"}
              </Link>
            </div>
          </Card>
        ))
      )}

      {retiredEntries.length > 0 && (
        <Card title="Véhicules retirés">
          <ul className="flex flex-col gap-2 text-sm">
            {retiredEntries.map(({ vehicle, totalLogs }) => (
              <li key={vehicle.id} className="flex flex-wrap items-center justify-between gap-2">
                <Link href={`/vehicles/${vehicle.id}`} className="font-medium hover:text-brand-500">
                  {vehicle.name}
                </Link>
                <span className="text-gray-500 dark:text-gray-400">
                  {vehicle.retiredReason ? RETIRED_REASON_LABELS[vehicle.retiredReason] : "Retiré"}
                  {" · "}
                  {vehicle.retiredAt} · {totalLogs} travaux
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <PageTitle>Tableau de bord</PageTitle>
      <Suspense fallback={<p className="text-sm text-gray-500">Chargement…</p>}>
        <Dashboard />
      </Suspense>
    </div>
  );
}
