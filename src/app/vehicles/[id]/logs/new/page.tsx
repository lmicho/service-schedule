import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
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
        <h1 className="text-2xl font-semibold tracking-tight">Logger un travail</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{vehicle.name}</p>
      </div>
      <LogForm
        action={createLog.bind(null, vehicle.id)}
        defaults={{ performedAt: todayLocal(), odometer: vehicle.odometer.toString() }}
        unit={vehicle.odometerUnit}
        cancelHref={`/vehicles/${vehicle.id}`}
      />
    </>
  );
}

export default function NewLogPage(props: PageProps<"/vehicles/[id]/logs/new">) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-12">
      <Suspense fallback={<p className="text-sm text-zinc-500">Chargement…</p>}>
        <NewLog params={props.params} />
      </Suspense>
    </main>
  );
}
