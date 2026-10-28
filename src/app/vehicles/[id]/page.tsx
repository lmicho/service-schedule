import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { eq } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/db";
import { listLogs } from "@/db/logs";
import { vehicles } from "@/db/schema";

const TYPE_LABELS = { car: "Auto", motorcycle: "Moto", other: "Autre" } as const;

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
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{vehicle.name}</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {TYPE_LABELS[vehicle.type]}
            {subtitle && ` · ${subtitle}`}
          </p>
        </div>
        <Link
          href={`/vehicles/${vehicle.id}/edit`}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium dark:border-zinc-700"
        >
          Modifier
        </Link>
      </div>
      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-zinc-500">Odomètre</dt>
          <dd className="font-medium">
            {vehicle.odometer.toLocaleString("fr-CA")} {vehicle.odometerUnit}
          </dd>
        </div>
        {vehicle.vin && (
          <div>
            <dt className="text-zinc-500">VIN</dt>
            <dd className="font-medium">{vehicle.vin}</dd>
          </div>
        )}
      </dl>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Historique d&apos;entretien</h2>
          <Link
            href={`/vehicles/${vehicle.id}/logs/new`}
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Logger un travail
          </Link>
        </div>
        {logs.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Aucun travail enregistré.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {logs.map((log) => (
              <li key={log.id} className="flex flex-col gap-1 px-4 py-3">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-medium">{log.title}</span>
                  <span className="text-sm text-zinc-500">{log.performedAt}</span>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {log.odometer.toLocaleString("fr-CA")} {vehicle.odometerUnit}
                  {log.cost != null &&
                    ` · ${log.cost.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}`}
                  {log.shop && ` · ${log.shop}`}
                </p>
                {log.notes && <p className="text-sm whitespace-pre-line">{log.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

export default function VehiclePage(props: PageProps<"/vehicles/[id]">) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-12">
      <Link href="/" className="text-sm text-zinc-600 underline dark:text-zinc-400">
        ← Mes véhicules
      </Link>
      <Suspense fallback={<p className="text-sm text-zinc-500">Chargement…</p>}>
        <VehicleDetails params={props.params} />
      </Suspense>
    </main>
  );
}
