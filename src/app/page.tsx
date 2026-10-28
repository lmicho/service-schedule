import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { db } from "@/db";
import { vehicles } from "@/db/schema";

async function VehicleList() {
  await connection(); // sync SQLite driver: keep the query out of prerendering
  const all = db.select().from(vehicles).orderBy(vehicles.name).all();

  if (all.length === 0) {
    return <p className="text-zinc-600 dark:text-zinc-400">Aucun véhicule pour l&apos;instant.</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
      {all.map((v) => (
        <li key={v.id}>
          <Link
            href={`/vehicles/${v.id}`}
            className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            <span className="font-medium">{v.name}</span>
            <span className="text-sm text-zinc-500">
              {v.odometer.toLocaleString("fr-CA")} {v.odometerUnit}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Mes véhicules</h1>
        <Link
          href="/vehicles/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Ajouter
        </Link>
      </div>
      <Suspense fallback={<p className="text-sm text-zinc-500">Chargement…</p>}>
        <VehicleList />
      </Suspense>
    </main>
  );
}
