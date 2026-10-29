import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { db } from "@/db";
import { listLogs } from "@/db/logs";
import { listRulesWithStatus } from "@/db/rules";
import { vehicles } from "@/db/schema";
import { Detail } from "@/components/detail";
import { PencilIcon, PlusIcon } from "@/components/icons";
import { LogsTable } from "@/components/logs-table";
import {
  Card,
  PageTitle,
  StatusBadge,
  buttonOutline,
  buttonPrimary,
  linkMuted,
} from "@/components/ui";
import {
  describeDue,
  describeEstimate,
  describeInterval,
  describeWarning,
  formatDistance,
} from "@/lib/format";

async function RuleDetails({ params }: { params: Promise<{ id: string; ruleId: string }> }) {
  const { id, ruleId } = await params;
  await connection(); // sync SQLite driver + current date: render at request time

  const vehicleId = Number(id);
  const ruleIdNum = Number(ruleId);
  if (!Number.isInteger(vehicleId) || !Number.isInteger(ruleIdNum)) notFound();

  const vehicle = db.select().from(vehicles).where(eq(vehicles.id, vehicleId)).get();
  const rule = vehicle && listRulesWithStatus(vehicle.id).find((r) => r.id === ruleIdNum);
  if (!vehicle || !rule) notFound();

  const unit = vehicle.odometerUnit;
  const logs = listLogs(vehicle.id).filter((l) => l.scheduleItemId === rule.id);
  const dueLines = describeDue(rule.due, unit);

  // Counting starts from the last job logged against the rule, or from the
  // starting point entered on the rule while there is none.
  const last = rule.lastLog
    ? {
        label: "Dernier travail enregistré",
        date: rule.lastLog.performedAt,
        odometer: rule.lastLog.odometer,
      }
    : {
        label: "Point de départ (dernier entretien saisi dans la règle)",
        date: rule.baselineDate,
        odometer: rule.baselineOdometer,
      };

  return (
    <>
      <div className="flex flex-col gap-2">
        <Link href={`/vehicles/${vehicle.id}`} className={linkMuted}>
          ← {vehicle.name}
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <PageTitle>{rule.name}</PageTitle>
            <StatusBadge status={rule.due.status} />
          </div>
          <div className="flex gap-3">
            <Link href={`/vehicles/${vehicle.id}/rules/${rule.id}/edit`} className={buttonOutline}>
              <PencilIcon />
              Modifier
            </Link>
            <Link
              href={`/vehicles/${vehicle.id}/logs/new?rule=${rule.id}`}
              className={buttonPrimary}
            >
              <PlusIcon />
              Logger un travail
            </Link>
          </div>
        </div>
      </div>

      <Card title="Détails">
        <dl className="grid grid-cols-1 gap-x-8 gap-y-5 text-sm sm:grid-cols-2">
          <Detail label="Prochaine échéance">
            {dueLines.length > 0 ? (
              dueLines.map((line) => <div key={line}>{line}</div>)
            ) : (
              <span className="text-gray-500">—</span>
            )}
            {rule.estimate && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {describeEstimate(rule.estimate)}
              </div>
            )}
          </Detail>
          <Detail label="Intervalle">{describeInterval(rule, unit)}</Detail>
          <Detail label={last.label}>
            {last.date}
            {last.odometer !== null && ` · ${formatDistance(last.odometer, unit)}`}
          </Detail>
          <Detail label="M'avertir avant l'échéance">{describeWarning(rule, unit)}</Detail>
        </dl>
      </Card>

      {rule.notes && (
        <Card title="Notes">
          <p className="text-sm whitespace-pre-line text-gray-800 dark:text-white/90">
            {rule.notes}
          </p>
        </Card>
      )}

      <Card title={`Travaux liés (${logs.length})`}>
        {logs.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Aucun travail n&apos;est lié à cette règle pour l&apos;instant.
          </p>
        ) : (
          <LogsTable logs={logs} unit={unit} />
        )}
      </Card>
    </>
  );
}

export default function RulePage(props: PageProps<"/vehicles/[id]/rules/[ruleId]">) {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Suspense fallback={<p className="text-sm text-gray-500">Chargement…</p>}>
        <RuleDetails params={props.params} />
      </Suspense>
    </div>
  );
}
