"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, Select, fieldClass as field } from "@/components/form-field";
import { buttonPrimary, linkMuted } from "@/components/ui";
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
          <Select name="type" defaultValue={values.type ?? "car"}>
            <option value="car">Auto</option>
            <option value="motorcycle">Moto</option>
            <option value="other">Autre</option>
          </Select>
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
          <Select name="odometerUnit" defaultValue={values.odometerUnit ?? "km"}>
            <option value="km">km</option>
            <option value="mi">mi</option>
          </Select>
        </Field>
      </div>

      <Field label="NIV / VIN" error={errors.vin}>
        <input name="vin" defaultValue={values.vin} className={field} />
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
