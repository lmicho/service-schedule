import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { Card, PageTitle } from "@/components/ui";
import { createLog } from "../../../logs-actions";
import { LogForm } from "./log-form";

export const metadata = { title: "Logger un travail" };

function todayLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

async function NewLog({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connection(); // sync SQLite driver + current date: render at request time

  const vehicleId = Number(id);
  if (!Number.isInteger(vehicleId)) notFound();

  const vehicle = db.select().from(vehicles).where(eq(vehicles.id, vehicleId)).get();
  if (!vehicle) notFound();

  return (
    <>
      <div>
        <PageTitle>Logger un travail</PageTitle>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{vehicle.name}</p>
      </div>
      <Card>
        <LogForm
          action={createLog.bind(null, vehicle.id)}
          defaults={{ performedAt: todayLocal(), odometer: vehicle.odometer.toString() }}
          unit={vehicle.odometerUnit}
          cancelHref={`/vehicles/${vehicle.id}`}
        />
      </Card>
    </>
  );
}

export default function NewLogPage(props: PageProps<"/vehicles/[id]/logs/new">) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 md:gap-6">
      <Suspense fallback={<p className="text-sm text-gray-500">Chargement…</p>}>
        <NewLog params={props.params} />
      </Suspense>
    </div>
  );
}
