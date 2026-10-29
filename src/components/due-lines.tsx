import type { DueEstimate, DueResult, Threshold } from "@/lib/due";
import { describeDueParts, describeEstimate, dueLinesToShow } from "@/lib/format";

const note = "text-xs text-gray-500 dark:text-gray-400";

/**
 * The next-due lines of a rule. Both limits are shown, separated by "ou", while
 * neither is reached; once one is, only that one (see dueLinesToShow). The
 * estimate belongs to the distance line, so it sits right under it.
 */
export function DueLines({
  due,
  unit,
  leading,
  estimate,
}: {
  due: DueResult;
  unit: string;
  leading: Threshold | null;
  estimate?: DueEstimate | null;
}) {
  const parts = describeDueParts(due, unit);
  const show = dueLinesToShow(due, leading);
  const distance = show.distance ? parts.distance : null;
  const time = show.time ? parts.time : null;
  if (!distance && !time) return <span className="text-gray-500">—</span>;

  return (
    <>
      {distance && <div>{distance}</div>}
      {distance && estimate && <div className={note}>{describeEstimate(estimate)}</div>}
      {show.or && <div className={note}>ou</div>}
      {time && <div>{time}</div>}
    </>
  );
}
