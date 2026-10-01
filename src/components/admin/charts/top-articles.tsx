import Link from "next/link";
import { Eye, Heart, MessageSquare } from "lucide-react";
import type { DashboardAnalytics } from "@/features/analytics/queries";

/** Horizontal bars by views; likes/comments as quiet text columns beside each. */
export function TopArticles({ items }: { items: DashboardAnalytics["topArticles"] }) {
  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-foreground-muted">No reads, likes or comments in this period yet.</p>;
  }
  const max = Math.max(1, ...items.map((a) => a.views));

  return (
    <ol className="space-y-4">
      {items.map((a, i) => (
        <li key={a.id}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <Link href={`/articles/${a.slug}`} target="_blank" className="min-w-0 truncate text-sm font-medium hover:text-brand">
              <span className="mr-1.5 text-foreground-muted tabular-nums">{i + 1}.</span>
              {a.title}
            </Link>
            <span className="flex shrink-0 items-center gap-3 text-xs tabular-nums text-foreground-muted">
              <span className="inline-flex items-center gap-1" title="Likes in period">
                <Heart className="h-3 w-3" aria-hidden="true" /> {a.likes}
                <span className="sr-only">likes</span>
              </span>
              <span className="inline-flex items-center gap-1" title="Comments in period">
                <MessageSquare className="h-3 w-3" aria-hidden="true" /> {a.comments}
                <span className="sr-only">comments</span>
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2" title={`${a.views.toLocaleString("en-US")} views`}>
            <div className="h-2.5 flex-1">
              <div
                className="h-full rounded-r bg-brand transition-[width] duration-500"
                style={{ width: `${(a.views / max) * 100}%`, minWidth: a.views > 0 ? 4 : 0 }}
              />
            </div>
            <span className="inline-flex w-14 shrink-0 items-center justify-end gap-1 text-xs font-semibold tabular-nums">
              <Eye className="h-3 w-3 text-foreground-muted" aria-hidden="true" />
              {a.views.toLocaleString("en-US")}
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}
