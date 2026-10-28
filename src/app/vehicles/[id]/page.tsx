import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { eq } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/db";
import { listLogs } from "@/db/logs";
import { vehicles } from "@/db/schema";
import { PlusIcon } from "@/components/icons";
import {
  Badge,
  Card,
  PageTitle,
  buttonOutline,
  buttonPrimary,
  linkMuted,
  tableWrap,
  td,
  th,
  tr,
} from "@/components/ui";
import { formatCurrency, formatDistance } from "@/lib/format";
import { VEHICLE_TYPE_LABELS } from "@/lib/labels";

async function VehicleDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connection(); // sync SQLite driver: keep the query out of prerendering

  const vehicleId = Number(id);
  if (!Number.isInteger(vehicleId)) notFound();

  const vehicle = db.select().from(vehicles).where(eq(vehicles.id, vehicleId)).get();
  if (!vehicle) notFound();

  const logs = listLogs(vehicle.id);
  const subtitle = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ");

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <PageTitle>{vehicle.name}</PageTitle>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Badge>{VEHICLE_TYPE_LABELS[vehicle.type]}</Badge>
            {subtitle}
          </div>
        </div>
        <Link href={`/vehicles/${vehicle.id}/edit`} className={buttonOutline}>
          Modifier
        </Link>
      </div>

      <Card>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Odomètre</dt>
            <dd className="mt-1 font-medium">
              {formatDistance(vehicle.odometer, vehicle.odometerUnit)}
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

      <Card
        title="Historique d'entretien"
        action={
          <Link href={`/vehicles/${vehicle.id}/logs/new`} className={buttonPrimary}>
            <PlusIcon />
            Logger un travail
          </Link>
        }
      >
        {logs.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Aucun travail enregistré.</p>
        ) : (
          <div className={tableWrap}>
            <table className="w-full min-w-140">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className={th}>Travail</th>
                  <th className={th}>Date</th>
                  <th className={`${th} text-end`}>Odomètre</th>
                  <th className={`${th} text-end`}>Coût</th>
                  <th className={th}>Garage</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className={tr}>
                    <td className={td}>
                      <div className="font-medium">{log.title}</div>
                      {log.notes && (
                        <div className="mt-0.5 whitespace-pre-line text-gray-500 dark:text-gray-400">
                          {log.notes}
                        </div>
                      )}
                    </td>
                    <td className={`${td} whitespace-nowrap text-gray-500 dark:text-gray-400`}>
                      {log.performedAt}
                    </td>
                    <td className={`${td} text-end whitespace-nowrap`}>
                      {formatDistance(log.odometer, vehicle.odometerUnit)}
                    </td>
                    <td className={`${td} text-end whitespace-nowrap`}>
                      {log.cost != null ? formatCurrency(log.cost) : "—"}
                    </td>
                    <td className={`${td} text-gray-500 dark:text-gray-400`}>{log.shop ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

export default function VehiclePage(props: PageProps<"/vehicles/[id]">) {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Link href="/vehicles" className={linkMuted}>
        ← Véhicules
      </Link>
      <Suspense fallback={<p className="text-sm text-gray-500">Chargement…</p>}>
        <VehicleDetails params={props.params} />
      </Suspense>
    </div>
  );
}
