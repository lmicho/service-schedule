"use client";

import { useActionState, useState } from "react";
import { formatDistance } from "@/lib/format";
import type { OdometerFormState } from "@/lib/odometer-form";
import { CheckIcon, CloseIcon, PencilIcon } from "./icons";

type OdometerAction = (prev: OdometerFormState, formData: FormData) => Promise<OdometerFormState>;

const iconButton =
  "inline-flex size-7 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-brand-500 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-brand-400";

/** The vehicle's odometer, editable in place: pencil, type a number, Enter. */
export function OdometerQuickEdit({
  action: submit,
  odometer,
  unit,
  updatedAt,
  stale,
}: {
  action: OdometerAction;
  odometer: number;
  unit: string;
  updatedAt: string | null;
  stale: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(
    async (prev: OdometerFormState, formData: FormData) => {
      const next = await submit(prev, formData);
      if (!next.error) setEditing(false);
      return next;
    },
    {},
  );

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      {editing ? (
        <form action={action} className="flex items-center gap-1">
          <input
            name="odometer"
            inputMode="numeric"
            autoFocus
            aria-label={`Odomètre (${unit})`}
            defaultValue={state.value ?? odometer}
            onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
            className="h-9 w-32 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />
          <span>{unit}</span>
          <button type="submit" disabled={pending} aria-label="Enregistrer" className={iconButton}>
            <CheckIcon />
          </button>
          <button
            type="button"
            aria-label="Annuler"
            className={iconButton}
            onClick={() => setEditing(false)}
          >
            <CloseIcon className="size-4" />
          </button>
        </form>
      ) : (
        <>
          <span>{formatDistance(odometer, unit)}</span>
          <button
            type="button"
            aria-label="Mettre à jour l'odomètre"
            title="Mettre à jour l'odomètre"
            className={iconButton}
            onClick={() => setEditing(true)}
          >
            <PencilIcon />
          </button>
          {updatedAt && (
            <span
              className={`text-xs ${stale ? "text-amber-600 dark:text-amber-400" : "text-gray-400"}`}
            >
              mis à jour le {updatedAt}
            </span>
          )}
        </>
      )}
      {editing && state.error && (
        <p className="basis-full text-xs text-red-600 dark:text-red-400">{state.error}</p>
      )}
    </div>
  );
}
