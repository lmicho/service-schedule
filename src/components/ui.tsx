const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50";

export const buttonPrimary = `${buttonBase} bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600`;

export const buttonOutline = `${buttonBase} bg-white text-gray-700 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/3 dark:hover:text-gray-300`;

export const linkMuted =
  "text-sm text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400";

export function Card({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-gray-200 bg-white p-5 md:p-6 dark:border-gray-800 dark:bg-white/3 ${className}`}
    >
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-4">
          {title && (
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">{title}</h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 dark:border-gray-800 dark:bg-white/3">
      <div className="flex size-12 items-center justify-center rounded-xl bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-white/90">
        {icon}
      </div>
      <div className="mt-5">
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
        <h4 className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">{value}</h4>
      </div>
    </div>
  );
}

export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
      {children}
    </span>
  );
}

export function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-title-lg font-semibold text-gray-800 dark:text-white/90">{children}</h1>
  );
}

export const th = "px-3 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400";
export const td = "px-3 py-3 text-sm text-gray-800 dark:text-white/90";
export const tableWrap = "-mx-3 overflow-x-auto";
export const tr = "border-b border-gray-100 last:border-0 dark:border-gray-800";
