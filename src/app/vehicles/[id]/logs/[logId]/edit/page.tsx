import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { db } from "@/db";
import { getLog } from "@/db/logs";
import { scheduleItems, vehicles } from "@/db/schema";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Card, PageTitle, buttonDanger } from "@/components/ui";
import { deleteLog, updateLog } from "../../../../logs-actions";
import { LogForm } from "../../new/log-form";

export const metadata = { title: "Modifier le travail" };

async function EditLog({ params }: { params: Promise<{ id: string; logId: string }> }) {
  const { id, logId } = await params;
  await connection(); // sync SQLite driver: keep the query out of prerendering

  const vehicleId = Number(id);
  const logIdNum = Number(logId);
  if (!Number.isInteger(vehicleId) || !Number.isInteger(logIdNum)) notFound();

  const vehicle = db.select().from(vehicles).where(eq(vehicles.id, vehicleId)).get();
  const log = vehicle && getLog(vehicle.id, logIdNum);
  if (!vehicle || !log) notFound();

  const rules = db
    .select({ id: scheduleItems.id, name: scheduleItems.name })
    .from(scheduleItems)
    .where(eq(scheduleItems.vehicleId, vehicle.id))
    .orderBy(scheduleItems.name)
    .all();

  return (
    <>
      <div>
        <PageTitle>Modifier le travail</PageTitle>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{vehicle.name}</p>
      </div>
      <Card>
        <LogForm
          action={updateLog.bind(null, vehicle.id, log.id)}
          defaults={{
            title: log.title,
            performedAt: log.performedAt,
            odometer: log.odometer?.toString() ?? "",
            cost: log.cost?.toString() ?? "",
            shop: log.shop ?? "",
            notes: log.notes ?? "",
            scheduleItemId: log.scheduleItemId?.toString() ?? "",
          }}
          rules={rules}
          unit={vehicle.odometerUnit}
          cancelHref={`/vehicles/${vehicle.id}`}
          submitLabel="Enregistrer"
        />
      </Card>
      <Card title="Supprimer ce travail">
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          L&apos;odomètre du véhicule n&apos;est pas modifié. Si le travail était lié à une règle,
          le prochain entretien est recalculé à partir du travail précédent.
        </p>
        <form action={deleteLog.bind(null, vehicle.id, log.id)}>
          <ConfirmSubmitButton message="Supprimer ce travail?" className={buttonDanger}>
            Supprimer le travail
          </ConfirmSubmitButton>
        </form>
      </Card>
    </>
  );
}

export default function EditLogPage(props: PageProps<"/vehicles/[id]/logs/[logId]/edit">) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 md:gap-6">
      <Suspense fallback={<p className="text-sm text-gray-500">Chargement…</p>}>
        <EditLog params={props.params} />
      </Suspense>
    </div>
  );
}
