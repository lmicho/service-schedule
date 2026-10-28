"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, fieldClass as field } from "@/components/form-field";
import type { LogFormState } from "@/lib/log-form";

type LogFormAction = (prev: LogFormState, formData: FormData) => Promise<LogFormState>;

export function LogForm({
  action: submit,
  defaults,
  unit,
  cancelHref,
}: {
  action: LogFormAction;
  defaults: { performedAt: string; odometer: string };
  unit: string;
  cancelHref: string;
}) {
  const [state, action, pending] = useActionState(submit, {});
  const { errors = {} } = state;
  const values: Record<string, string> = state.values ?? defaults;

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Travail effectué *" error={errors.title}>
        <input
          name="title"
          required
          maxLength={120}
          placeholder="Changement d'huile"
          defaultValue={values.title}
          className={field}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Date *" error={errors.performedAt}>
          <input
            name="performedAt"
            type="date"
            required
            defaultValue={values.performedAt}
            className={field}
          />
        </Field>
        <Field label={`Odomètre (${unit}) *`} error={errors.odometer}>
          <input
            name="odometer"
            inputMode="numeric"
            required
            defaultValue={values.odometer}
            className={field}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Coût ($)" error={errors.cost}>
          <input name="cost" inputMode="decimal" defaultValue={values.cost} className={field} />
        </Field>
        <Field label="Garage / atelier" error={errors.shop}>
          <input name="shop" defaultValue={values.shop} className={field} />
        </Field>
      </div>

      <Field label="Notes" error={errors.notes}>
        <textarea name="notes" rows={3} defaultValue={values.notes} className={field} />
      </Field>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {pending ? "Enregistrement…" : "Enregistrer le travail"}
        </button>
        <Link href={cancelHref} className="text-sm text-zinc-600 underline dark:text-zinc-400">
          Annuler
        </Link>
      </div>
    </form>
  );
}
