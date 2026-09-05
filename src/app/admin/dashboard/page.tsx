import Link from "next/link";
import { getDashboardStats } from "@/features/articles/admin-queries";
import { prisma } from "@/lib/db/prisma";
import { formatDistanceToNow } from "date-fns";
import { ObjectStatus, commentStatusTone, PageHeader } from "@/components/admin/admin-ui";

export default async function AdminDashboardPage() {
  const [stats, recentComments] = await Promise.all([
    getDashboardStats(),
    prisma.comment.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, authorName: true, body: true, createdAt: true, status: true, article: { select: { title: true, slug: true } } },
    }),
  ]);

  const groups: { title: string; tiles: { label: string; value: number; href: string; hint?: string; alert?: boolean }[] }[] = [
    {
      title: "Content",
      tiles: [
        { label: "Articles", value: stats.totalArticles, href: "/admin/articles", hint: `${stats.published} published · ${stats.drafts} draft` },
        { label: "Published", value: stats.published, href: "/admin/articles?status=PUBLISHED" },
        { label: "Drafts", value: stats.drafts, href: "/admin/articles?status=DRAFT" },
      ],
    },
    {
      title: "Engagement",
      tiles: [
        { label: "Comments", value: stats.totalComments, href: "/admin/comments" },
        {
          label: "Awaiting moderation",
          value: stats.pendingComments,
          href: "/admin/comments?status=PENDING",
          alert: stats.pendingComments > 0,
        },
        { label: "Likes", value: stats.totalLikes, href: "/admin/articles?liked=1&sort=likes" },
      ],
    },
  ];

  return (
    <div className="p-6 sm:p-8">
      <PageHeader title="Overview" description="Everything happening across ABAP Nusantara at a glance." />

      <div className="space-y-8">
        {groups.map((group) => (
          <section key={group.title}>
            <h2 className="mb-3 text-sm font-semibold text-foreground-muted">{group.title}</h2>
            <div className="flex flex-wrap gap-4">
              {group.tiles.map((tile) => (
                <Link
                  key={tile.label}
                  href={tile.href}
                  className="admin-tile flex min-h-[7.5rem] w-full flex-col admin-card p-5 sm:w-60"
                >
                  <p className="text-3xl font-bold tracking-tight tabular-nums">{tile.value}</p>
                  <p className="mt-1 text-sm font-medium text-foreground-muted">{tile.label}</p>
                  {tile.hint && <p className="mt-auto pt-2 text-xs text-foreground-muted">{tile.hint}</p>}
                  {tile.alert && (
                    <span className="mt-auto pt-3">
                      <ObjectStatus tone="critical">Needs attention</ObjectStatus>
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

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
