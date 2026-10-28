import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { PlusIcon } from "@/components/icons";
import { VehicleTable } from "@/components/vehicle-table";
import { Card, PageTitle, buttonPrimary } from "@/components/ui";

export const metadata = { title: "Véhicules" };

async function AllVehicles() {
  await connection(); // sync SQLite driver: keep the query out of prerendering
  const all = db.select().from(vehicles).orderBy(vehicles.name).all();
  return (
    <Card>
      <VehicleTable vehicles={all} />
    </Card>
  );
}

export default function VehiclesPage() {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex items-center justify-between gap-4">
        <PageTitle>Véhicules</PageTitle>
        <Link href="/vehicles/new" className={buttonPrimary}>
          <PlusIcon />
          Ajouter
        </Link>
      </div>
      <Suspense fallback={<p className="text-sm text-gray-500">Chargement…</p>}>
        <AllVehicles />
      </Suspense>
    </div>
  );
}
