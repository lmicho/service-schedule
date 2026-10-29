"use client";

import { useRef } from "react";
import { buttonDangerSolid, buttonOutline } from "./ui";

/**
 * Submit button that asks for confirmation in a modal first. Render it inside
 * the <form> to submit: the dialog's confirm button submits that same form.
 */
export function ConfirmSubmitButton({
  message,
  className,
  confirmLabel = "Supprimer",
  confirmClassName = buttonDangerSolid,
  children,
}: {
  message: string;
  className?: string;
  confirmLabel?: string;
  confirmClassName?: string;
  children: React.ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button type="button" className={className} onClick={() => dialog.current?.showModal()}>
        {children}
      </button>
      <dialog
        ref={dialog}
        aria-label="Confirmation"
        // Clicking the backdrop targets the dialog element itself.
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current?.close();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-gray-200 bg-white p-6 text-gray-800 shadow-lg backdrop:bg-gray-900/50 backdrop:backdrop-blur-xs dark:border-gray-800 dark:bg-gray-900 dark:text-white/90"
      >
        <p className="text-sm">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className={buttonOutline} onClick={() => dialog.current?.close()}>
            Annuler
          </button>
          <button type="submit" className={confirmClassName}>
            {confirmLabel}
          </button>
        </div>
      </dialog>
    </>
  );
}
