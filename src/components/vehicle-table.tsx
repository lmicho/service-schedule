import Link from "next/link";
import type { Vehicle } from "@/db/schema";
import { formatDistance } from "@/lib/format";
import { VEHICLE_TYPE_LABELS } from "@/lib/labels";
import { Badge, td, th, tr, tableWrap } from "./ui";

export function VehicleTable({ vehicles }: { vehicles: Vehicle[] }) {
  if (vehicles.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Aucun véhicule pour l&apos;instant.
      </p>
    );
  }

  return (
    <div className={tableWrap}>
      <table className="w-full min-w-120">
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-800">
            <th className={th}>Véhicule</th>
            <th className={th}>Type</th>
            <th className={th}>Détails</th>
            <th className={th}>Odomètre</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((v) => (
            <tr key={v.id} className={tr}>
              <td className={`${td} font-medium`}>
                <Link href={`/vehicles/${v.id}`} className="hover:text-brand-500">
                  {v.name}
                </Link>
              </td>
              <td className={td}>
                <Badge>{VEHICLE_TYPE_LABELS[v.type]}</Badge>
              </td>
              <td className={`${td} text-gray-500 dark:text-gray-400`}>
                {[v.year, v.make, v.model].filter(Boolean).join(" ") || "—"}
              </td>
              <td className={td}>{formatDistance(v.odometer, v.odometerUnit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
