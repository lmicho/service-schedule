import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { getDashboardStats, listRecentLogs } from "@/db/stats";
import { CarIcon, CashIcon, WrenchIcon } from "@/components/icons";
import { VehicleTable } from "@/components/vehicle-table";
import { Card, MetricCard, PageTitle, linkMuted, td, th, tr, tableWrap } from "@/components/ui";
import { formatCurrency, formatDistance } from "@/lib/format";

async function Dashboard() {
  await connection(); // sync SQLite driver: keep the queries out of prerendering
  const stats = getDashboardStats();
  const all = db.select().from(vehicles).orderBy(vehicles.name).all();
  const recent = listRecentLogs(5);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
        <MetricCard icon={<CarIcon />} label="Véhicules" value={String(stats.vehicleCount)} />
        <MetricCard
          icon={<WrenchIcon />}
          label="Travaux enregistrés"
          value={String(stats.logCount)}
        />
        <MetricCard
          icon={<CashIcon />}
          label="Dépenses totales"
          value={formatCurrency(stats.totalCost)}
        />
      </div>

      <Card
        title="Mes véhicules"
        action={
          <Link href="/vehicles" className={linkMuted}>
            Tout voir
          </Link>
        }
      >
        <VehicleTable vehicles={all} />
      </Card>

      <Card title="Travaux récents">
        {recent.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Aucun travail enregistré.</p>
        ) : (
          <div className={tableWrap}>
            <table className="w-full min-w-120">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className={th}>Travail</th>
                  <th className={th}>Véhicule</th>
                  <th className={th}>Date</th>
                  <th className={`${th} text-end`}>Odomètre</th>
                  <th className={`${th} text-end`}>Coût</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((log) => (
                  <tr key={log.id} className={tr}>
                    <td className={`${td} font-medium`}>{log.title}</td>
                    <td className={td}>
                      <Link href={`/vehicles/${log.vehicleId}`} className="hover:text-brand-500">
                        {log.vehicleName}
                      </Link>
                    </td>
                    <td className={`${td} text-gray-500 dark:text-gray-400`}>{log.performedAt}</td>
                    <td className={`${td} text-end`}>
                      {formatDistance(log.odometer, log.odometerUnit)}
                    </td>
                    <td className={`${td} text-end`}>
                      {log.cost != null ? formatCurrency(log.cost) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <PageTitle>Tableau de bord</PageTitle>
      <Suspense fallback={<p className="text-sm text-gray-500">Chargement…</p>}>
        <Dashboard />
      </Suspense>
    </div>
  );
}
