"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, fieldClass as field } from "@/components/form-field";
import type { VehicleFormState } from "@/lib/vehicle-form";

type VehicleFormAction = (prev: VehicleFormState, formData: FormData) => Promise<VehicleFormState>;

export function VehicleForm({
  action: submit,
  initialValues = {},
  submitLabel,
  pendingLabel,
  cancelHref,
}: {
  action: VehicleFormAction;
  initialValues?: Record<string, string>;
  submitLabel: string;
  pendingLabel: string;
  cancelHref: string;
}) {
  const [state, action, pending] = useActionState(submit, {});
  const { errors = {} } = state;
  // After a failed submit, show what was typed rather than the saved values.
  const values = state.values ?? initialValues;

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Nom *" error={errors.name}>
        <input
          name="name"
          required
          maxLength={80}
          placeholder="Ma Civic"
          defaultValue={values.name}
          className={field}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Type *" error={errors.type}>
          <select name="type" defaultValue={values.type ?? "car"} className={field}>
            <option value="car">Auto</option>
            <option value="motorcycle">Moto</option>
            <option value="other">Autre</option>
          </select>
        </Field>
        <Field label="Année" error={errors.year}>
          <input
            name="year"
            inputMode="numeric"
            placeholder="2018"
            defaultValue={values.year}
            className={field}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Marque" error={errors.make}>
          <input name="make" defaultValue={values.make} className={field} />
        </Field>
        <Field label="Modèle" error={errors.model}>
          <input name="model" defaultValue={values.model} className={field} />
        </Field>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-4">
        <Field label="Odomètre actuel *" error={errors.odometer}>
          <input
            name="odometer"
            inputMode="numeric"
            required
            defaultValue={values.odometer ?? "0"}
            className={field}
          />
        </Field>
        <Field label="Unité" error={errors.odometerUnit}>
          <select name="odometerUnit" defaultValue={values.odometerUnit ?? "km"} className={field}>
            <option value="km">km</option>
            <option value="mi">mi</option>
          </select>
        </Field>
      </div>

      <Field label="NIV / VIN" error={errors.vin}>
        <input name="vin" defaultValue={values.vin} className={field} />
      </Field>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {pending ? pendingLabel : submitLabel}
        </button>
        <Link href={cancelHref} className="text-sm text-zinc-600 underline dark:text-zinc-400">
          Annuler
        </Link>
      </div>
    </form>
  );
}
