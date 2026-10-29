import { Card, PageTitle } from "@/components/ui";
import { createVehicle } from "../actions";
import { VehicleForm } from "../vehicle-form";

export const metadata = { title: "Nouveau véhicule" };

export default function NewVehiclePage() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 md:gap-6">
      <PageTitle>Nouveau véhicule</PageTitle>
      <Card>
        <VehicleForm
          action={createVehicle}
          submitLabel="Ajouter le véhicule"
          pendingLabel="Ajout…"
          cancelHref="/"
        />
      </Card>
    </div>
  );
}
