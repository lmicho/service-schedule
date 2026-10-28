"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, fieldClass as field } from "@/components/form-field";
import { buttonPrimary, linkMuted } from "@/components/ui";
import type { RuleFormState } from "@/lib/rule-form";

type RuleFormAction = (prev: RuleFormState, formData: FormData) => Promise<RuleFormState>;

export function RuleForm({
  action: submit,
  defaults,
  unit,
  submitLabel,
  pendingLabel,
  cancelHref,
}: {
  action: RuleFormAction;
  defaults: Record<string, string>;
  unit: string;
  submitLabel: string;
  pendingLabel: string;
  cancelHref: string;
}) {
  const [state, action, pending] = useActionState(submit, {});
  const { errors = {} } = state;
  const values: Record<string, string> = state.values ?? defaults;

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Nom de la règle *" error={errors.name}>
        <input
          name="name"
          required
          maxLength={120}
          placeholder="Changement d'huile"
          defaultValue={values.name}
          className={field}
        />
      </Field>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
          À répéter tous les… (au moins un)
        </legend>
        <div className="grid grid-cols-2 gap-4">
          <Field label={`Distance (${unit})`} error={errors.intervalDistance}>
            <input
              name="intervalDistance"
              inputMode="numeric"
              placeholder="5000"
              defaultValue={values.intervalDistance}
              className={field}
            />
          </Field>
          <Field label="Jours" error={errors.intervalDays}>
            <input
              name="intervalDays"
              inputMode="numeric"
              placeholder="180"
              defaultValue={values.intervalDays}
              className={field}
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
          M&apos;avertir avant l&apos;échéance (par défaut: 10 % de l&apos;intervalle)
        </legend>
        <div className="grid grid-cols-2 gap-4">
          <Field label={`Distance (${unit})`} error={errors.warnDistance}>
            <input
              name="warnDistance"
              inputMode="numeric"
              defaultValue={values.warnDistance}
              className={field}
            />
          </Field>
          <Field label="Jours" error={errors.warnDays}>
            <input
              name="warnDays"
              inputMode="numeric"
              defaultValue={values.warnDays}
              className={field}
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
          Dernier entretien fait à…
        </legend>
        <div className="grid grid-cols-2 gap-4">
          <Field label={`Odomètre (${unit}) *`} error={errors.baselineOdometer}>
            <input
              name="baselineOdometer"
              inputMode="numeric"
              required
              defaultValue={values.baselineOdometer}
              className={field}
            />
          </Field>
          <Field label="Date *" error={errors.baselineDate}>
            <input
              name="baselineDate"
              type="date"
              required
              defaultValue={values.baselineDate}
              className={field}
            />
          </Field>
        </div>
      </fieldset>

      <Field label="Notes" error={errors.notes}>
        <textarea name="notes" rows={3} defaultValue={values.notes} className={`${field} h-auto`} />
      </Field>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={buttonPrimary}>
          {pending ? pendingLabel : submitLabel}
        </button>
        <Link href={cancelHref} className={linkMuted}>
          Annuler
        </Link>
      </div>
    </form>
  );
}
