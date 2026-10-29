/** A label/value pair for a <dl> on a read-only view. */
export function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="mt-1 font-medium text-gray-800 dark:text-white/90">{children}</dd>
    </div>
  );
}
