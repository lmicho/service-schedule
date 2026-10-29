"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BellIcon } from "./icons";

export type BellItem = {
  ruleId: number;
  ruleName: string;
  vehicleId: number;
  vehicleName: string;
  status: "soon" | "overdue";
  remaining: string;
  estimate: string | null;
};

export function AlertBellPanel({ items }: { items: BellItem[] }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const overdue = items.some((i) => i.status === "overdue");

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Alertes d'entretien (${items.length})`}
        aria-expanded={open}
        className="relative inline-flex size-10 items-center justify-center rounded-[10px] border border-gray-300 text-gray-500 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-white"
      >
        <BellIcon />
        {items.length > 0 && (
          <span
            className={`absolute -top-1.5 -right-1.5 flex min-w-5 items-center justify-center rounded-full px-1 text-xs font-medium text-white ${
              overdue ? "bg-red-500" : "bg-amber-500"
            }`}
          >
            {items.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 z-1000 mt-2 w-72 rounded-xl border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-800 dark:bg-gray-900">
          {items.length === 0 ? (
            <p className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
              Aucune alerte. Tout est à jour.
            </p>
          ) : (
            <ul className="flex max-h-96 flex-col overflow-y-auto">
              {items.map((i) => (
                <li
                  key={i.ruleId}
                  className="rounded-lg px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                        {i.ruleName}
                      </p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {i.vehicleName}
                      </p>
                      <p
                        className={`mt-1 text-xs ${
                          i.status === "overdue"
                            ? "text-red-600 dark:text-red-400"
                            : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {i.remaining}
                      </p>
                      {i.estimate && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">{i.estimate}</p>
                      )}
                    </div>
                    <Link
                      href={`/vehicles/${i.vehicleId}/logs/new?rule=${i.ruleId}`}
                      onClick={() => setOpen(false)}
                      className="text-sm whitespace-nowrap text-brand-500 hover:text-brand-600 dark:text-brand-400"
                    >
                      Logger
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
