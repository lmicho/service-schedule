import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { Card, PageTitle } from "@/components/ui";
import { todayLocal } from "@/lib/date";
import { RULE_TEMPLATES, findTemplate, templateDistance } from "@/lib/rule-templates";
import { createRule } from "../../../rules-actions";
import { RuleForm } from "../rule-form";

export const metadata = { title: "Nouvelle règle d'entretien" };

async function NewRule({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ template?: string | string[] }>;
}) {
  const { id } = await params;
  const { template: templateParam } = await searchParams;
  await connection(); // sync SQLite driver + current date: render at request time

  const vehicleId = Number(id);
  if (!Number.isInteger(vehicleId)) notFound();

  const vehicle = db.select().from(vehicles).where(eq(vehicles.id, vehicleId)).get();
  if (!vehicle) notFound();

  const templateId = Array.isArray(templateParam) ? templateParam[0] : templateParam;
  const template = findTemplate(vehicle.type, templateId);
  const distance = templateDistance(template?.intervalDistance, vehicle.odometerUnit);

  const defaults = {
    name: template?.name ?? "",
    intervalDistance: distance?.toString() ?? "",
    intervalDays: template?.intervalDays?.toString() ?? "",
    baselineOdometer: vehicle.odometer.toString(),
    baselineDate: todayLocal(),
  };

  const base = `/vehicles/${vehicle.id}/rules/new`;

  return (
    <>
      <div>
        <PageTitle>Nouvelle règle d&apos;entretien</PageTitle>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{vehicle.name}</p>
      </div>

      <Card title="Partir d'un gabarit">
        <div className="flex flex-wrap gap-2">
          {RULE_TEMPLATES[vehicle.type].map((t) => (
            <Link
              key={t.id}
              href={`${base}?template=${t.id}`}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset ${
                t.id === template?.id
                  ? "bg-brand-50 text-brand-500 ring-brand-200 dark:bg-brand-500/12 dark:text-brand-400 dark:ring-brand-500/30"
                  : "text-gray-700 ring-gray-300 hover:bg-gray-50 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-white/5"
              }`}
            >
              {t.name}
            </Link>
          ))}
        </div>
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          Les valeurs sont des suggestions: modifie-les avant d&apos;enregistrer.
        </p>
      </Card>

      <Card>
        {/* key: remount the form so the defaults change when another template is picked */}
        <RuleForm
          key={template?.id ?? "blank"}
          action={createRule.bind(null, vehicle.id)}
          defaults={defaults}
          unit={vehicle.odometerUnit}
          submitLabel="Ajouter la règle"
          pendingLabel="Ajout…"
          cancelHref={`/vehicles/${vehicle.id}`}
        />
      </Card>
    </>
  );
}

export default function NewRulePage(props: PageProps<"/vehicles/[id]/rules/new">) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 md:gap-6">
      <Suspense fallback={<p className="text-sm text-gray-500">Chargement…</p>}>
        <NewRule params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
