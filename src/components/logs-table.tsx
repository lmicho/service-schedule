import Link from "next/link";
import { PencilIcon } from "./icons";
import type { MaintenanceLog } from "@/db/schema";
import { formatCurrency, formatDistance } from "@/lib/format";
import { linkMuted, tableWrap, td, th, tr } from "./ui";

export function LogsTable({ logs, unit }: { logs: MaintenanceLog[]; unit: string }) {
  if (logs.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Aucun travail enregistré.</p>;
  }

  return (
    <div className={tableWrap}>
      <table className="w-full min-w-140">
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-800">
            <th className={th}>Travail</th>
            <th className={th}>Date</th>
            <th className={th}>Odomètre</th>
            <th className={th}>Coût</th>
            <th className={th}>Garage</th>
            <th className={th}></th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className={tr}>
              <td className={td}>
                <div className="font-medium">{log.title}</div>
                {log.notes && (
                  <div className="mt-0.5 whitespace-pre-line text-gray-500 dark:text-gray-400">
                    {log.notes}
                  </div>
                )}
              </td>
              <td className={`${td} whitespace-nowrap text-gray-500 dark:text-gray-400`}>
                {log.performedAt}
              </td>
              <td className={`${td} whitespace-nowrap`}>
                {log.odometer !== null ? formatDistance(log.odometer, unit) : "—"}
              </td>
              <td className={`${td} whitespace-nowrap`}>
                {log.cost != null ? formatCurrency(log.cost) : "—"}
              </td>
              <td className={`${td} text-gray-500 dark:text-gray-400`}>{log.shop ?? "—"}</td>
              <td className={`${td} whitespace-nowrap`}>
                <Link
                  href={`/vehicles/${log.vehicleId}/logs/${log.id}/edit`}
                  className={linkMuted}
                  aria-label="Modifier"
                  title="Modifier"
                >
                  <PencilIcon />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
