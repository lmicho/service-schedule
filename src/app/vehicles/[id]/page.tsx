import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { eq } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/db";
import { vehicles } from "@/db/schema";

const TYPE_LABELS = { car: "Auto", motorcycle: "Moto", other: "Autre" } as const;

async function VehicleDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connection(); // sync SQLite driver: keep the query out of prerendering

  const vehicleId = Number(id);
  if (!Number.isInteger(vehicleId)) notFound();

  const vehicle = db.select().from(vehicles).where(eq(vehicles.id, vehicleId)).get();
  if (!vehicle) notFound();

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
