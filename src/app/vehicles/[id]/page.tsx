import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { eq } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/db";
import { listLogs } from "@/db/logs";
import { listRulesWithStatus } from "@/db/rules";
import { vehicles } from "@/db/schema";
import { PlusIcon } from "@/components/icons";
import { LogFiltersForm } from "@/components/log-filters";
import { LogsTable } from "@/components/logs-table";
import { RulesTable } from "@/components/rules-table";
import { Badge, Card, PageTitle, buttonOutline, buttonPrimary, linkMuted } from "@/components/ui";
import { OdometerQuickEdit } from "@/components/odometer-quick-edit";
import { isStale, todayLocal } from "@/lib/date";
import { reactivateVehicle, updateOdometer } from "../actions";
import { formatDistance } from "@/lib/format";
import { RETIRED_REASON_LABELS, VEHICLE_TYPE_LABELS } from "@/lib/labels";
import { filterLogs, hasActiveFilters, logYears, parseLogFilters } from "@/lib/log-filters";

async function VehicleDetails({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const filters = parseLogFilters(await searchParams);
  await connection(); // sync SQLite driver: keep the query out of prerendering

  const vehicleId = Number(id);
  if (!Number.isInteger(vehicleId)) notFound();

  const vehicle = db.select().from(vehicles).where(eq(vehicles.id, vehicleId)).get();
  if (!vehicle) notFound();

  const logs = listLogs(vehicle.id);
  const rules = listRulesWithStatus(vehicle.id);
  const shownLogs = filterLogs(logs, filters);
  const retired = vehicle.retiredAt !== null;
  const subtitle = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ");

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <PageTitle>{vehicle.name}</PageTitle>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Badge>{VEHICLE_TYPE_LABELS[vehicle.type]}</Badge>
            {retired && <Badge tone="muted">Retiré</Badge>}
            {subtitle}
          </div>
        </div>
        <Link href={`/vehicles/${vehicle.id}/edit`} className={buttonOutline}>
          Modifier
        </Link>
      </div>

      {retired && vehicle.retiredReason && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">
                Retiré le {vehicle.retiredAt} · {RETIRED_REASON_LABELS[vehicle.retiredReason]}
              </span>
              <br />
              L&apos;historique est conservé; ce véhicule n&apos;a plus d&apos;alertes.
            </p>
            <form action={reactivateVehicle.bind(null, vehicle.id)}>
              <button type="submit" className={buttonOutline}>
                Réactiver
              </button>
            </form>
          </div>
        </Card>
      )}

      <Card>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Odomètre</dt>
            <dd className="mt-1 font-medium">
              {retired ? (
                formatDistance(vehicle.odometer, vehicle.odometerUnit)
              ) : (
                <OdometerQuickEdit
                  action={updateOdometer.bind(null, vehicle.id)}
                  odometer={vehicle.odometer}
                  unit={vehicle.odometerUnit}
                  updatedAt={vehicle.odometerUpdatedAt}
                  stale={isStale(vehicle.odometerUpdatedAt, todayLocal())}
                />
              )}
            </dd>
          </div>
          {vehicle.vin && (
            <div>
              <dt className="text-gray-500 dark:text-gray-400">VIN</dt>
              <dd className="mt-1 font-medium">{vehicle.vin}</dd>
            </div>
          )}
        </dl>
      </Card>

      {!retired && (
        <Card
          title="Règles d'entretien"
          action={
            <Link href={`/vehicles/${vehicle.id}/rules/new`} className={buttonOutline}>
              <PlusIcon />
              Ajouter une règle
            </Link>
          }
        >
          <RulesTable rules={rules} vehicleId={vehicle.id} unit={vehicle.odometerUnit} />
        </Card>
      )}

      <Card
        title="Historique d'entretien"
        action={
          <Link href={`/vehicles/${vehicle.id}/logs/new`} className={buttonPrimary}>
            <PlusIcon />
            Logger un travail
          </Link>
        }
      >
        {logs.length > 0 && (
          <LogFiltersForm
            filters={filters}
            years={logYears(logs)}
            rules={rules.map((r) => ({ id: r.id, name: r.name }))}
            resetHref={`/vehicles/${vehicle.id}`}
            shown={shownLogs.length}
            total={logs.length}
          />
        )}
        {shownLogs.length === 0 && logs.length > 0 && hasActiveFilters(filters) ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Aucun travail ne correspond aux filtres.
          </p>
        ) : (
          <LogsTable logs={shownLogs} unit={vehicle.odometerUnit} />
        )}
      </Card>
    </>
  );
}

export default function VehiclePage(props: PageProps<"/vehicles/[id]">) {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Link href="/" className={linkMuted}>
        ← Tableau de bord
      </Link>
      <Suspense fallback={<p className="text-sm text-gray-500">Chargement…</p>}>
        <VehicleDetails params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
