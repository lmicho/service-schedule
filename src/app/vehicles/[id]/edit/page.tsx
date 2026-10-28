import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { updateVehicle } from "../../actions";
import { Card, PageTitle } from "@/components/ui";
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
    <Card>
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
    </Card>
  );
}

export default function EditVehiclePage(props: PageProps<"/vehicles/[id]/edit">) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 md:gap-6">
      <PageTitle>Modifier le véhicule</PageTitle>
      <Suspense fallback={<p className="text-sm text-gray-500">Chargement…</p>}>
        <EditVehicleForm params={props.params} />
      </Suspense>
    </div>
  );
}
