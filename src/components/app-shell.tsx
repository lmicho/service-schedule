"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { CarIcon, CloseIcon, MenuIcon } from "./icons";
import { SidebarNav } from "./sidebar-nav";
import { ThemeToggle } from "./theme-toggle";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-lg bg-brand-500 text-white">
        <CarIcon className="size-5" />
      </span>
      <span className="text-lg font-semibold text-gray-800 dark:text-white/90">
        Service Schedule
      </span>
    </Link>
  );
}

export function AppShell({
  vehicleNav,
  alertBell,
  children,
}: {
  vehicleNav: React.ReactNode;
  alertBell: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {open && (
        <div
          className="fixed inset-0 z-99 bg-gray-900/50 backdrop-blur-xs xl:hidden"
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-999 flex h-screen w-72.5 flex-col border-r border-gray-200 bg-white px-5 transition-transform duration-300 xl:static xl:translate-x-0 dark:border-gray-800 dark:bg-gray-900 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-2 py-8">
          <Logo />
          {/* Server-rendered slot: close the mobile drawer when a panel link is clicked */}
          <div
            onClick={(e) => {
              if ((e.target as HTMLElement).closest("a")) setOpen(false);
            }}
          >
            {alertBell}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Suspense fallback={null}>
            <SidebarNav onNavigate={() => setOpen(false)} />
          </Suspense>
          {/* Server-rendered slot: close the mobile drawer when one of its links is clicked */}
          <div
            onClick={(e) => {
              if ((e.target as HTMLElement).closest("a")) setOpen(false);
            }}
          >
            {vehicleNav}
          </div>
        </div>
      </aside>

      <div className="relative flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
        <header className="sticky top-0 z-50 flex w-full shrink-0 items-center justify-between gap-2 border-b border-gray-200 bg-white px-3 py-3 sm:gap-4 xl:px-6 xl:py-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label="Afficher le menu"
              className="inline-flex size-10 items-center justify-center rounded-[10px] border border-gray-300 text-gray-500 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 xl:hidden dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-white"
            >
              {open ? <CloseIcon /> : <MenuIcon />}
            </button>
            <div className="xl:hidden">
              <Logo />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </header>

        <main className="mx-auto w-full max-w-(--breakpoint-2xl) flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
