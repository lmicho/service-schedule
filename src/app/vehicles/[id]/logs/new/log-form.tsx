"use client";

import Link from "next/link";
import { useActionState, useRef } from "react";
import { Field, fieldClass as field } from "@/components/form-field";
import { buttonPrimary, linkMuted } from "@/components/ui";
import type { LogFormState } from "@/lib/log-form";

type LogFormAction = (prev: LogFormState, formData: FormData) => Promise<LogFormState>;

export function LogForm({
  action: submit,
  defaults,
  rules,
  unit,
  cancelHref,
  submitLabel = "Enregistrer le travail",
}: {
  action: LogFormAction;
  defaults: Record<string, string>;
  rules: { id: number; name: string }[];
  unit: string;
  cancelHref: string;
  submitLabel?: string;
}) {
  const [state, action, pending] = useActionState(submit, {});
  const { errors = {} } = state;
  const values: Record<string, string> = state.values ?? defaults;
  const titleRef = useRef<HTMLInputElement>(null);

  return (
    <form action={action} className="flex flex-col gap-4">
      {rules.length > 0 && (
        <Field label="Règle d'entretien" error={errors.scheduleItemId}>
          <select
            name="scheduleItemId"
            defaultValue={values.scheduleItemId ?? ""}
            onChange={(e) => {
              const rule = rules.find((r) => String(r.id) === e.target.value);
              if (rule && titleRef.current && !titleRef.current.value) {
                titleRef.current.value = rule.name;
              }
            }}
            className={field}
          >
            <option value="">Aucune (travail ponctuel)</option>
            {rules.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field label="Travail effectué *" error={errors.title}>
        <input
          ref={titleRef}
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
        <Field label={`Odomètre (${unit})`} error={errors.odometer}>
          <input
            name="odometer"
            inputMode="numeric"
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
        <textarea name="notes" rows={3} defaultValue={values.notes} className={`${field} h-auto`} />
      </Field>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={buttonPrimary}>
          {pending ? "Enregistrement…" : submitLabel}
        </button>
        <Link href={cancelHref} className={linkMuted}>
          Annuler
        </Link>
      </div>
    </form>
  );
}
