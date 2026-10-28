"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CarIcon, GridIcon } from "./icons";

const items = [
  { href: "/", label: "Tableau de bord", icon: GridIcon, exact: true },
  { href: "/vehicles", label: "Véhicules", icon: CarIcon, exact: false },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigation principale">
      <h3 className="mb-4 text-xs leading-5 text-gray-400 uppercase">Menu</h3>
      <ul className="flex flex-col gap-1">
        {items.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                  active
                    ? "bg-brand-50 text-brand-500 dark:bg-brand-500/12 dark:text-brand-400"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                }`}
              >
                <Icon
                  className={`size-6 ${active ? "text-brand-500 dark:text-brand-400" : "text-gray-500 dark:text-gray-400"}`}
                />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
