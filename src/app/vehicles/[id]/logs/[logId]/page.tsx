import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { db } from "@/db";
import { getLog } from "@/db/logs";
import { getRule } from "@/db/rules";
import { vehicles } from "@/db/schema";
import { Detail } from "@/components/detail";
import { PencilIcon } from "@/components/icons";
import { Card, PageTitle, buttonOutline, linkMuted } from "@/components/ui";
import { formatCurrency, formatDistance } from "@/lib/format";

async function LogDetails({ params }: { params: Promise<{ id: string; logId: string }> }) {
  const { id, logId } = await params;
  await connection(); // sync SQLite driver: keep the queries out of prerendering

  const vehicleId = Number(id);
  const logIdNum = Number(logId);
  if (!Number.isInteger(vehicleId) || !Number.isInteger(logIdNum)) notFound();

  const vehicle = db.select().from(vehicles).where(eq(vehicles.id, vehicleId)).get();
  const log = vehicle && getLog(vehicle.id, logIdNum);
  if (!vehicle || !log) notFound();

  const rule = log.scheduleItemId !== null ? getRule(vehicle.id, log.scheduleItemId) : undefined;
  const none = <span className="text-gray-500">—</span>;

  return (
    <>
      <div className="flex flex-col gap-2">
        <Link href={`/vehicles/${vehicle.id}`} className={linkMuted}>
          ← {vehicle.name}
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <PageTitle>{log.title}</PageTitle>
          <Link href={`/vehicles/${vehicle.id}/logs/${log.id}/edit`} className={buttonOutline}>
            <PencilIcon />
            Modifier
          </Link>
        </div>
      </div>

      <Card title="Détails">
        <dl className="grid grid-cols-1 gap-x-8 gap-y-5 text-sm sm:grid-cols-2">
          <Detail label="Date">{log.performedAt}</Detail>
          <Detail label="Odomètre">
            {log.odometer !== null ? formatDistance(log.odometer, vehicle.odometerUnit) : none}
          </Detail>
          <Detail label="Coût">{log.cost !== null ? formatCurrency(log.cost) : none}</Detail>
          <Detail label="Garage / atelier">{log.shop ?? none}</Detail>
          <Detail label="Règle d'entretien">
            {rule ? (
              <Link
                href={`/vehicles/${vehicle.id}/rules/${rule.id}`}
                className="hover:text-brand-500 dark:hover:text-brand-400"
              >
                {rule.name}
              </Link>
            ) : (
              <span className="text-gray-500">Aucune (travail ponctuel)</span>
            )}
          </Detail>
        </dl>
      </Card>

      {log.notes && (
        <Card title="Notes">
          <p className="text-sm whitespace-pre-line text-gray-800 dark:text-white/90">
            {log.notes}
          </p>
        </Card>
      )}
    </>
  );
}

export default function LogPage(props: PageProps<"/vehicles/[id]/logs/[logId]">) {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Suspense fallback={<p className="text-sm text-gray-500">Chargement…</p>}>
        <LogDetails params={props.params} />
      </Suspense>
    </div>
  );
}
