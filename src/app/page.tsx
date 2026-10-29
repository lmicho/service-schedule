import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { listActiveAlerts } from "@/db/alerts";
import { AlertBanner } from "@/components/alert-banner";
import { getDashboardStats, listCostByVehicle, listVehiclesWithRecentLogs } from "@/db/stats";
import { CarIcon, CashIcon, PlusIcon, ToolsIcon } from "@/components/icons";
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
import { formatCurrency, formatDistance } from "@/lib/format";
import { VEHICLE_TYPE_LABELS } from "@/lib/labels";

const LOGS_PER_VEHICLE = 5;

async function Dashboard() {
  await connection(); // sync SQLite driver: keep the queries out of prerendering
  const stats = getDashboardStats();
  const entries = listVehiclesWithRecentLogs(LOGS_PER_VEHICLE);
  const costs = listCostByVehicle();
  const alerts = listActiveAlerts();

  return (
    <>
      <AlertBanner alerts={alerts} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
        <MetricCard icon={<CarIcon />} label="Véhicules" value={String(stats.vehicleCount)} />
        <MetricCard
          icon={<ToolsIcon />}
          label="Travaux enregistrés"
          value={String(stats.logCount)}
        />
        <MetricCard
          icon={<CashIcon />}
          label="Dépenses totales"
          value={formatCurrency(stats.totalCost)}
          detail={
            costs.length > 1 && (
              <ul className="flex flex-col justify-end gap-1.5 border-t border-gray-100 pt-4 text-sm sm:min-w-0 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-4 dark:border-gray-800">
                {costs.map((v) => (
                  <li key={v.id} className="flex items-center justify-between gap-3">
                    <Link href={`/vehicles/${v.id}`} className={`${linkMuted} truncate`}>
                      {v.name}
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
      </div>

      {entries.length === 0 ? (
        <Card>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            Aucun véhicule pour l&apos;instant.
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
              {formatDistance(vehicle.odometer, vehicle.odometerUnit)}
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
