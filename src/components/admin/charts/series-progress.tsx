import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import type { DashboardAnalytics } from "@/features/analytics/queries";

/** One meter per series: published parts out of all parts. */
export function SeriesProgress({ items }: { items: DashboardAnalytics["seriesProgress"] }) {
  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-foreground-muted">No series yet.</p>;
  }

  return (
    <ul className="space-y-4">
      {items.map((s) => {
        const pct = s.total ? (s.published / s.total) * 100 : 0;
        const done = s.total > 0 && s.published === s.total;
        return (
          <li key={s.id}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <Link href={`/admin/articles?series=${s.id}`} className="min-w-0 truncate text-sm font-medium hover:text-brand">
                {s.title}
              </Link>
              <span className="shrink-0 text-xs tabular-nums text-foreground-muted">
                <span className="font-semibold text-foreground">{s.published}</span>/{s.total} published
              </span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-brand-tint"
              role="meter"
              aria-valuemin={0}
              aria-valuemax={s.total}
              aria-valuenow={s.published}
              aria-label={`${s.title}: ${s.published} of ${s.total} parts published`}
            >
              <div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1 text-xs text-foreground-muted">
              {done ? (
                <span className="inline-flex items-center gap-1 text-positive">
                  <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Complete
                </span>
              ) : s.total === 0 ? (
                "No parts yet"
              ) : (
                `${s.drafts} draft${s.drafts === 1 ? "" : "s"} in progress`
              )}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
