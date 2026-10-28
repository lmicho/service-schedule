import { createVehicle } from "../actions";
import { VehicleForm } from "../vehicle-form";

export const metadata = { title: "Nouveau véhicule" };

export default function NewVehiclePage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Nouveau véhicule</h1>
      <VehicleForm
        action={createVehicle}
        submitLabel="Ajouter le véhicule"
        pendingLabel="Ajout…"
        cancelHref="/"
      />
    </main>
  );
}
