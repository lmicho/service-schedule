import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { db } from "@/db";
import { scheduleItems, vehicles } from "@/db/schema";
import { Card, PageTitle } from "@/components/ui";
import { todayLocal } from "@/lib/date";
import { vehicleTabHref } from "@/lib/vehicle-tabs";
import { createLog } from "../../../logs-actions";
import { LogForm } from "./log-form";

export const metadata = { title: "Logger un travail" };

async function NewLog({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ rule?: string | string[] }>;
}) {
  const { id } = await params;
  const { rule: ruleParam } = await searchParams;
  await connection(); // sync SQLite driver + current date: render at request time

  const vehicleId = Number(id);
  if (!Number.isInteger(vehicleId)) notFound();

  const vehicle = db.select().from(vehicles).where(eq(vehicles.id, vehicleId)).get();
  if (!vehicle) notFound();

  const rules = db
    .select({ id: scheduleItems.id, name: scheduleItems.name })
    .from(scheduleItems)
    .where(eq(scheduleItems.vehicleId, vehicle.id))
    .orderBy(scheduleItems.name)
    .all();
  const wanted = Number(Array.isArray(ruleParam) ? ruleParam[0] : ruleParam);
  const preselected = rules.find((r) => r.id === wanted);

  return (
    <>
      <div>
        <PageTitle>Logger un travail</PageTitle>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{vehicle.name}</p>
      </div>
      <Card>
        <LogForm
          action={createLog.bind(null, vehicle.id)}
          defaults={{
            performedAt: todayLocal(),
            odometer: vehicle.odometer.toString(),
            title: preselected?.name ?? "",
            scheduleItemId: preselected?.id.toString() ?? "",
          }}
          rules={rules}
          unit={vehicle.odometerUnit}
          cancelHref={vehicleTabHref(vehicle.id, "history")}
        />
      </Card>
    </>
  );
}

export default function NewLogPage(props: PageProps<"/vehicles/[id]/logs/new">) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 md:gap-6">
      <Suspense fallback={<p className="text-sm text-gray-500">Chargement…</p>}>
        <NewLog params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
