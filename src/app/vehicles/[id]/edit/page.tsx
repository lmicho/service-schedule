import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { getVehicleUsage } from "@/db/vehicles";
import { deleteVehicle, retireVehicle, updateVehicle } from "../../actions";
import { RetireForm } from "../../retire-form";
import { todayLocal } from "@/lib/date";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Card, PageTitle, buttonDanger } from "@/components/ui";
import { VehicleForm } from "../../vehicle-form";

export const metadata = { title: "Modifier le véhicule" };

async function EditVehicleForm({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connection(); // sync SQLite driver: keep the query out of prerendering

  const vehicleId = Number(id);
  if (!Number.isInteger(vehicleId)) notFound();

  const vehicle = db.select().from(vehicles).where(eq(vehicles.id, vehicleId)).get();
  if (!vehicle) notFound();

  const usage = getVehicleUsage(vehicle.id);
  const plural = (n: number, word: string, many = `${word}s`) => `${n} ${n > 1 ? many : word}`;
  const contents = `${plural(usage.logs, "travail", "travaux")} et ${plural(usage.rules, "règle")}`;

  return (
    <>
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
      {vehicle.retiredAt === null && (
        <Card title="Retirer ce véhicule">
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            Vendu, perdu ou volé: le véhicule n&apos;est plus actif, ses alertes s&apos;arrêtent,
            mais tout son historique est conservé.
          </p>
          <RetireForm
            action={retireVehicle.bind(null, vehicle.id)}
            today={todayLocal()}
            vehicleName={vehicle.name}
          />
        </Card>
      )}
      <Card title="Supprimer ce véhicule">
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Supprime aussi {contents}. Cette action est irréversible.
        </p>
        <form action={deleteVehicle.bind(null, vehicle.id)}>
          <ConfirmSubmitButton
            message={`Supprimer « ${vehicle.name} » avec ${contents}? Cette action est irréversible.`}
            className={buttonDanger}
          >
            Supprimer le véhicule
          </ConfirmSubmitButton>
        </form>
      </Card>
    </>
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
