"use client";

import { useActionState } from "react";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Field, Select, fieldClass as field } from "@/components/form-field";
import { buttonOutline, buttonPrimary } from "@/components/ui";
import { RETIRED_REASON_LABELS } from "@/lib/labels";
import type { RetireFormState } from "@/lib/retire-form";

type RetireFormAction = (prev: RetireFormState, formData: FormData) => Promise<RetireFormState>;

export function RetireForm({
  action: submit,
  today,
  vehicleName,
}: {
  action: RetireFormAction;
  today: string;
  vehicleName: string;
}) {
  const [state, action] = useActionState(submit, {});
  const { errors = {} } = state;
  const values: Record<string, string> = state.values ?? { reason: "sold", retiredAt: today };

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Raison" error={errors.reason}>
          <Select name="reason" defaultValue={values.reason}>
            {Object.entries(RETIRED_REASON_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Date" error={errors.retiredAt}>
          <input
            name="retiredAt"
            type="date"
            required
            max={today}
            defaultValue={values.retiredAt}
            className={field}
          />
        </Field>
      </div>
      <div>
        <ConfirmSubmitButton
          message={`Retirer « ${vehicleName} »? Ses alertes sont désactivées et l'historique est conservé. Tu pourras le réactiver.`}
          className={buttonOutline}
          confirmLabel="Retirer"
          confirmClassName={buttonPrimary}
        >
          Retirer le véhicule
        </ConfirmSubmitButton>
      </div>
    </form>
  );
}
