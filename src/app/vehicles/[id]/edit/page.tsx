import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { updateVehicle } from "../../actions";
import { VehicleForm } from "../../vehicle-form";

export const metadata = { title: "Modifier le véhicule" };

async function EditVehicleForm({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connection(); // sync SQLite driver: keep the query out of prerendering

  const vehicleId = Number(id);
  if (!Number.isInteger(vehicleId)) notFound();

  const vehicle = db.select().from(vehicles).where(eq(vehicles.id, vehicleId)).get();
  if (!vehicle) notFound();

  return (
    <VehicleForm
      action={updateVehicle.bind(null, vehicle.id)}
      initialValues={{
        name: vehicle.name,
        type: vehicle.type,
        make: vehicle.make ?? "",
        model: vehicle.model ?? "",
        year: vehicle.year?.toString() ?? "",
        vin: vehicle.vin ?? "",
        odometer: vehicle.odometer.toString(),
        odometerUnit: vehicle.odometerUnit,
      }}
      submitLabel="Enregistrer"
      pendingLabel="Enregistrement…"
      cancelHref={`/vehicles/${vehicle.id}`}
    />
  );
}

export default function EditVehiclePage(props: PageProps<"/vehicles/[id]/edit">) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Modifier le véhicule</h1>
      <Suspense fallback={<p className="text-sm text-zinc-500">Chargement…</p>}>
        <EditVehicleForm params={props.params} />
      </Suspense>
    </main>
  );
}
