import Link from "next/link";

export interface TabItem {
  id: string;
  label: string;
  /** Shown instead of `label` on narrow screens. */
  shortLabel?: string;
  count: number;
  href: string;
}

/** Tabs as plain links (the tab lives in the URL), so they work without client JS. */
export function TabNav({ tabs, active }: { tabs: TabItem[]; active: string }) {
  return (
    <nav aria-label="Sections" className="flex gap-6">
      {tabs.map((tab) => {
        const current = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            scroll={false}
            aria-current={current ? "page" : undefined}
            className={`relative flex items-center gap-2 py-2 text-sm font-medium whitespace-nowrap ${
              current
                ? "text-brand-500 dark:text-brand-400"
                : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
            }`}
          >
            {/* Not a border: in dark mode a global rule forces every border color. */}
            {current && (
              <span
                aria-hidden
                className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-500 dark:bg-brand-400"
              />
            )}
            {tab.shortLabel ? (
              <>
                <span className="sm:hidden">{tab.shortLabel}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </>
            ) : (
              tab.label
            )}
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-white/10 dark:text-gray-300">
              {tab.count}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
