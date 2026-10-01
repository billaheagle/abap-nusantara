import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { CommentModerationRow } from "@/components/admin/comment-moderation-row";
import { CommentFilterBar } from "@/components/admin/comment-filter-bar";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/admin/admin-ui";

interface PageProps {
  searchParams: Promise<{ status?: string; q?: string; article?: string; type?: string; page?: string }>;
}

const FILTERS = ["ALL", "PENDING", "APPROVED", "REJECTED", "SPAM"] as const;
type Filter = (typeof FILTERS)[number];

const PAGE_SIZE = 10;

export default async function AdminCommentsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const filter: Filter = FILTERS.includes(sp.status as Filter) ? (sp.status as Filter) : "ALL";
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.CommentWhereInput = {
    ...(filter !== "ALL" ? { status: filter } : {}),
    ...(sp.article ? { articleId: sp.article } : {}),
    ...(sp.type === "top" ? { parentCommentId: null } : {}),
    ...(sp.type === "reply" ? { parentCommentId: { not: null } } : {}),
    ...(sp.q
      ? {
          OR: [
            { authorName: { contains: sp.q, mode: "insensitive" } },
            { authorEmail: { contains: sp.q, mode: "insensitive" } },
            { body: { contains: sp.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [comments, articles, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        article: { select: { title: true, slug: true } },
        parent: { select: { authorName: true, body: true } },
        _count: { select: { replies: true } },
      },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.article.findMany({
      where: { comments: { some: {} } },
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
    prisma.comment.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  const carriedParams = {
    status: filter === "ALL" ? undefined : filter,
    q: sp.q,
    article: sp.article,
    type: sp.type && sp.type !== "all" ? sp.type : undefined,
  };

  function tabHref(f: Filter) {
    const params = new URLSearchParams();
    if (f !== "ALL") params.set("status", f);
    if (sp.q) params.set("q", sp.q);
    if (sp.article) params.set("article", sp.article);
    if (sp.type && sp.type !== "all") params.set("type", sp.type);
    const qs = params.toString();
    return qs ? `/admin/comments?${qs}` : "/admin/comments";
  }

  return (
    <div className="p-4 sm:p-8">
      <PageHeader title="Comments" description="Search, filter and moderate reader comments." />

      <div className="admin-card mb-4 inline-flex flex-wrap gap-1 p-1 text-sm">
        {FILTERS.map((f) => (
          <a
            key={f}
            href={tabHref(f)}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
              filter === f ? "bg-brand text-white" : "text-foreground-muted hover:bg-surface"
            }`}
          >
            {f.charAt(0) + f.slice(1).toLowerCase()}
          </a>
        ))}
      </div>

      <CommentFilterBar articles={articles} current={{ status: filter, q: sp.q, article: sp.article, type: sp.type }} />

      <p className="mb-3 text-xs text-foreground-muted">
        {total === 0 ? "No matching comments" : `Showing ${rangeStart}–${rangeEnd} of ${total}`}
      </p>

      <div className="admin-card divide-y divide-border">
        {comments.map((c) => (
          <CommentModerationRow key={c.id} comment={c} />
        ))}
        {comments.length === 0 && <p className="p-6 text-sm text-foreground-muted">No comments match these filters.</p>}
      </div>

      <Pagination page={page} totalPages={totalPages} basePath="/admin/comments" searchParams={carriedParams} />
    </div>
  );
}
