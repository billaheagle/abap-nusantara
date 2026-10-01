import Link from "next/link";
import { getDashboardStats } from "@/features/articles/admin-queries";
import { getDashboardAnalytics } from "@/features/analytics/queries";
import { resolveRange, GRANULARITY_NOUN } from "@/lib/analytics/ranges";
import { prisma } from "@/lib/db/prisma";
import { formatDistanceToNow } from "date-fns";
import { ObjectStatus, commentStatusTone, PageHeader } from "@/components/admin/admin-ui";
import { ViewsChart } from "@/components/admin/charts/views-chart";
import { StatTile } from "@/components/admin/charts/stat-tile";
import { TopArticles } from "@/components/admin/charts/top-articles";
import { SeriesProgress } from "@/components/admin/charts/series-progress";
import { RangeSelect } from "@/components/admin/charts/range-select";
import { formatBucket, formatDay } from "@/components/admin/charts/chart-utils";

interface PageProps {
  searchParams: Promise<{ range?: string }>;
}

export default async function AdminDashboardPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const range = resolveRange(sp.range);

  const [stats, analytics, recentComments] = await Promise.all([
    getDashboardStats(),
    getDashboardAnalytics(range),
    prisma.comment.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, authorName: true, body: true, createdAt: true, status: true, article: { select: { title: true, slug: true } } },
    }),
  ]);

  const noun = GRANULARITY_NOUN[analytics.granularity];
  const tilePeriod = range.days === null ? `Since ${formatDay(analytics.startDay)}` : range.short;

  const contentTiles: { label: string; value: number; href: string; alert?: boolean }[] = [
    { label: "Articles", value: stats.totalArticles, href: "/admin/articles" },
    { label: "Published", value: stats.published, href: "/admin/articles?status=PUBLISHED" },
    { label: "Drafts", value: stats.drafts, href: "/admin/articles?status=DRAFT" },
    { label: "Awaiting moderation", value: stats.pendingComments, href: "/admin/comments?status=PENDING", alert: stats.pendingComments > 0 },
  ];

  return (
    <div className="p-6 sm:p-8">
      <PageHeader
        title="Overview"
        description="Everything happening across ABAP Nusantara at a glance."
        action={
          <RangeSelect value={range.key} />
        }
      />

      {/* Headline numbers for the period */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Views" total={analytics.views.total} previous={analytics.views.previous} points={analytics.views.series} periodLabel={tilePeriod} />
        <StatTile label="Likes" total={analytics.likes.total} previous={analytics.likes.previous} points={analytics.likes.series} periodLabel={tilePeriod} />
        <StatTile label="Comments" total={analytics.comments.total} previous={analytics.comments.previous} points={analytics.comments.series} periodLabel={tilePeriod} />
      </div>

      {/* Views over time */}
      <section className="admin-card mt-6 p-5">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold">Views per {noun}</h2>
            <p className="text-xs text-foreground-muted">
              {range.label} · {analytics.allTimeViews.toLocaleString("en-US")} views all-time
            </p>
          </div>
        </div>
        {analytics.allTimeViews === 0 && (
          <p className="mb-4 rounded-md bg-brand-tint px-3 py-2 text-xs text-brand">
            Tracking is live — views appear here as readers open published articles. Your own visits while logged in aren&apos;t counted.
          </p>
        )}
        <ViewsChart points={analytics.views.series} granularity={analytics.granularity} />
        <details className="mt-4 text-xs">
          <summary className="cursor-pointer text-foreground-muted hover:text-foreground">View as table</summary>
          <div className="mt-2 max-h-64 overflow-y-auto rounded-md border border-border">
            <table className="w-full">
              <thead className="admin-th sticky top-0">
                <tr>
                  <th className="px-3 py-1.5 text-left capitalize">{noun}</th>
                  <th className="px-3 py-1.5 text-right">Views</th>
                  <th className="px-3 py-1.5 text-right">Likes</th>
                  <th className="px-3 py-1.5 text-right">Comments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border tabular-nums">
                {[...analytics.views.series].reverse().map((p) => {
                  const idx = analytics.views.series.findIndex((q) => q.day === p.day);
                  return (
                    <tr key={p.day}>
                      <td className="px-3 py-1.5">{formatBucket(p.day, analytics.granularity, true)}</td>
                      <td className="px-3 py-1.5 text-right">{p.value}</td>
                      <td className="px-3 py-1.5 text-right">{analytics.likes.series[idx].value}</td>
                      <td className="px-3 py-1.5 text-right">{analytics.comments.series[idx].value}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="admin-card p-5">
          <h2 className="text-sm font-semibold">Top articles</h2>
          <p className="mb-5 text-xs text-foreground-muted">By views · {range.label.toLowerCase()}</p>
          <TopArticles items={analytics.topArticles} />
        </section>
        <section className="admin-card p-5">
          <h2 className="text-sm font-semibold">Series progress</h2>
          <p className="mb-5 text-xs text-foreground-muted">Published parts per series</p>
          <SeriesProgress items={analytics.seriesProgress} />
        </section>
      </div>

      {/* Content inventory */}
      <section className="mt-10">
        <h2 className="mb-3 text-sm font-semibold text-foreground-muted">Content</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {contentTiles.map((tile) => (
            <Link key={tile.label} href={tile.href} className="admin-tile admin-card flex flex-col p-4">
              <p className="text-2xl font-bold tracking-tight">{tile.value}</p>
              <p className="mt-0.5 text-sm font-medium text-foreground-muted">{tile.label}</p>
              {tile.alert && (
                <span className="mt-2">
                  <ObjectStatus tone="critical">Needs attention</ObjectStatus>
                </span>
              )}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-sm font-semibold text-foreground-muted">Recent activity</h2>
        <div className="admin-card divide-y divide-border">
          {recentComments.length === 0 && <p className="p-4 text-sm text-foreground-muted">No comments yet.</p>}
          {recentComments.map((c) => (
            <div key={c.id} className="p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p>
                  <span className="font-medium">{c.authorName}</span> commented on{" "}
                  <Link href={`/articles/${c.article.slug}`} className="text-brand hover:underline">
                    {c.article.title}
                  </Link>
                </p>
                <ObjectStatus tone={commentStatusTone(c.status)}>{c.status}</ObjectStatus>
              </div>
              <p className="mt-0.5 line-clamp-1 text-foreground-muted">{c.body}</p>
              <p className="mt-1 text-xs text-foreground-muted">{formatDistanceToNow(c.createdAt, { addSuffix: true })}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
