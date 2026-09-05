import Link from "next/link";
import { format } from "date-fns";
import { Heart } from "lucide-react";
import { ArticleStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getAdminArticleList, type AdminArticleSort } from "@/features/articles/admin-queries";
import { ArticleRowActions } from "@/components/admin/article-row-actions";
import { ArticleFilterBar } from "@/components/admin/article-filter-bar";
import { Pagination } from "@/components/ui/pagination";
import { ObjectStatus, articleStatusTone, PageHeader } from "@/components/admin/admin-ui";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: string;
    category?: string;
    sort?: string;
    liked?: string;
  }>;
}

const VALID_STATUS = new Set<string>(Object.values(ArticleStatus));

export default async function AdminArticlesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const status = sp.status && VALID_STATUS.has(sp.status) ? (sp.status as ArticleStatus) : "ALL";
  const likedOnly = sp.liked === "1";

  const [{ items, total, totalPages, pageSize }, categories] = await Promise.all([
    getAdminArticleList({
      page,
      q: sp.q,
      status,
      categoryId: sp.category,
      sort: sp.sort as AdminArticleSort | undefined,
      likedOnly,
    }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  const carriedParams = {
    q: sp.q,
    status: status === "ALL" ? undefined : status,
    category: sp.category,
    sort: sp.sort,
    liked: likedOnly ? "1" : undefined,
  };

  return (
    <div className="p-6 sm:p-8">
      <PageHeader
        title="Articles"
        description="Search, filter and manage every post."
        action={
          <Link
            href="/admin/articles/new"
            className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            Create article
          </Link>
        }
      />

      <ArticleFilterBar
        categories={categories}
        current={{ q: sp.q, status, category: sp.category, sort: sp.sort, liked: sp.liked }}
      />

      <p className="mb-3 text-xs text-foreground-muted">
        {total === 0 ? "No matching articles" : `Showing ${rangeStart}–${rangeEnd} of ${total}`}
      </p>

      <div className="admin-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="admin-th text-left">
              <th className="px-4 py-2.5">Title</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Category</th>
              <th className="px-4 py-2.5">Series</th>
              <th className="px-4 py-2.5 text-right">Likes</th>
              <th className="px-4 py-2.5">Updated</th>
              <th className="px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((article) => (
              <tr key={article.id} className="transition-colors hover:bg-surface/70">
                <td className="px-4 py-3">
                  <Link href={`/admin/articles/${article.id}`} className="font-medium hover:text-brand">
                    {article.title}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <ObjectStatus tone={articleStatusTone(article.status)}>{article.status}</ObjectStatus>
                </td>
                <td className="px-4 py-3 text-foreground-muted">{article.category?.name ?? "—"}</td>
                <td className="px-4 py-3 text-foreground-muted">{article.series?.title ?? "—"}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  <span className="inline-flex items-center gap-1 text-foreground-muted">
                    <Heart
                      className={`h-3.5 w-3.5 ${article._count.likes > 0 ? "fill-accent-red text-accent-red" : ""}`}
                    />
                    {article._count.likes}
                  </span>
                </td>
                <td className="px-4 py-3 text-foreground-muted">{format(article.updatedAt, "MMM d, yyyy")}</td>
                <td className="px-4 py-3">
                  <ArticleRowActions articleId={article.id} status={article.status} slug={article.slug} />
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-foreground-muted">
                  Nothing here. Try clearing the filters, or{" "}
                  <Link href="/admin/articles/new" className="text-brand hover:underline">create an article</Link>.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} basePath="/admin/articles" searchParams={carriedParams} />
    </div>
  );
}
