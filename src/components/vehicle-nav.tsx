import { connection } from "next/server";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { VehicleNavLinks } from "./vehicle-nav-links";

export async function VehicleNav() {
  await connection(); // sync SQLite driver: keep the query out of prerendering
  const all = db
    .select({ id: vehicles.id, name: vehicles.name, retiredAt: vehicles.retiredAt })
    .from(vehicles)
    .orderBy(vehicles.name)
    .all();

  return (
    <VehicleNavLinks
      vehicles={all.map((v) => ({ id: v.id, name: v.name, retired: v.retiredAt !== null }))}
    />
  );
}
