import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { db } from "@/db";
import { getRule } from "@/db/rules";
import { vehicles } from "@/db/schema";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Card, PageTitle, buttonDanger } from "@/components/ui";
import { deleteRule, updateRule } from "../../../../rules-actions";
import { RuleForm } from "../../rule-form";

export const metadata = { title: "Modifier la règle" };

async function EditRule({ params }: { params: Promise<{ id: string; ruleId: string }> }) {
  const { id, ruleId } = await params;
  await connection(); // sync SQLite driver: keep the query out of prerendering

  const vehicleId = Number(id);
  const ruleIdNum = Number(ruleId);
  if (!Number.isInteger(vehicleId) || !Number.isInteger(ruleIdNum)) notFound();

  const vehicle = db.select().from(vehicles).where(eq(vehicles.id, vehicleId)).get();
  const rule = vehicle && getRule(vehicle.id, ruleIdNum);
  if (!vehicle || !rule) notFound();

  return (
    <>
      <div>
        <PageTitle>Modifier la règle</PageTitle>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{vehicle.name}</p>
      </div>
      <Card>
        <RuleForm
          action={updateRule.bind(null, vehicle.id, rule.id)}
          defaults={{
            name: rule.name,
            intervalDistance: rule.intervalDistance?.toString() ?? "",
            intervalDays: rule.intervalDays?.toString() ?? "",
            warnDistance: rule.warnDistance?.toString() ?? "",
            warnDays: rule.warnDays?.toString() ?? "",
            baselineOdometer: rule.baselineOdometer.toString(),
            baselineDate: rule.baselineDate ?? "",
            notes: rule.notes ?? "",
          }}
          unit={vehicle.odometerUnit}
          submitLabel="Enregistrer"
          pendingLabel="Enregistrement…"
          cancelHref={`/vehicles/${vehicle.id}`}
        />
      </Card>
      <Card title="Supprimer cette règle">
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Les travaux déjà enregistrés sont conservés, mais ne sont plus liés à la règle.
        </p>
        <form action={deleteRule.bind(null, vehicle.id, rule.id)}>
          <ConfirmSubmitButton
            message="Supprimer cette règle d'entretien?"
            className={buttonDanger}
          >
            Supprimer la règle
          </ConfirmSubmitButton>
        </form>
      </Card>
    </>
  );
}

export default function EditRulePage(props: PageProps<"/vehicles/[id]/rules/[ruleId]/edit">) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 md:gap-6">
      <Suspense fallback={<p className="text-sm text-gray-500">Chargement…</p>}>
        <EditRule params={props.params} />
      </Suspense>
    </div>
  );
}
