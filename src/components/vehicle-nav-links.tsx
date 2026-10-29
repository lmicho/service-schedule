"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CarIcon, PlusIcon } from "./icons";

type NavVehicle = { id: number; name: string; retired: boolean };

export function VehicleNavLinks({ vehicles }: { vehicles: NavVehicle[] }) {
  const pathname = usePathname();
  const activeVehicles = vehicles.filter((v) => !v.retired);
  const retiredVehicles = vehicles.filter((v) => v.retired);

  const item = (v: NavVehicle) => {
    const href = `/vehicles/${v.id}`;
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return (
      <li key={v.id}>
        <Link
          href={href}
          aria-current={active ? "page" : undefined}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
            active
              ? "bg-brand-50 text-brand-500 dark:bg-brand-500/12 dark:text-brand-400"
              : v.retired
                ? "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
          }`}
        >
          <CarIcon
            className={`size-5 shrink-0 ${active ? "text-brand-500 dark:text-brand-400" : "text-gray-500 dark:text-gray-400"}`}
          />
          <span className="truncate">{v.name}</span>
        </Link>
      </li>
    );
  };

  return (
    <nav aria-label="Véhicules" className="mt-6 pb-6">
      <h3 className="mb-4 text-xs leading-5 text-gray-400 uppercase">Mes véhicules</h3>
      <ul className="flex flex-col gap-1">
        {activeVehicles.map(item)}
        <li>
          <Link
            href="/vehicles/new"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
          >
            <PlusIcon className="size-5 shrink-0" />
            Ajouter
          </Link>
        </li>
      </ul>
      {retiredVehicles.length > 0 && (
        <>
          <h3 className="mt-6 mb-4 text-xs leading-5 text-gray-400 uppercase">Retirés</h3>
          <ul className="flex flex-col gap-1">{retiredVehicles.map(item)}</ul>
        </>
      )}
    </nav>
  );
}
