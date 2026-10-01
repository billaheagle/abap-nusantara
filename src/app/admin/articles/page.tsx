import Link from "next/link";
import { format } from "date-fns";
import { Fragment } from "react";
import { Heart, Layers } from "lucide-react";
import { ArticleStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getAdminArticleList, DEFAULT_ADMIN_SORT, type AdminArticleSort } from "@/features/articles/admin-queries";
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
    series?: string;
    tag?: string;
    sort?: string;
  }>;
}

const COLUMNS = 7;
const VALID_STATUS = new Set<string>(Object.values(ArticleStatus));

export default async function AdminArticlesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const status = sp.status && VALID_STATUS.has(sp.status) ? (sp.status as ArticleStatus) : "ALL";

  const sort = (sp.sort ?? DEFAULT_ADMIN_SORT) as AdminArticleSort;
  const grouped = sort === "series";

  const [{ items, total, totalPages, pageSize }, categories, seriesList, tags] = await Promise.all([
    getAdminArticleList({
      page,
      q: sp.q,
      status,
      categoryId: sp.category,
      seriesId: sp.series,
      tagId: sp.tag,
      sort,
    }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.series.findMany({ orderBy: [{ order: "asc" }, { title: "asc" }], select: { id: true, title: true } }),
    prisma.tag.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  const carriedParams = {
    q: sp.q,
    status: status === "ALL" ? undefined : status,
    category: sp.category,
    series: sp.series,
    tag: sp.tag,
    sort: sp.sort,
  };

  return (
    <div className="p-4 sm:p-8">
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
        series={seriesList}
        tags={tags}
        current={{ q: sp.q, status, category: sp.category, series: sp.series, tag: sp.tag, sort: sp.sort }}
      />

      <p className="mb-3 text-xs text-foreground-muted">
        {total === 0 ? "No matching articles" : `Showing ${rangeStart}–${rangeEnd} of ${total}`}
      </p>

      {/* Phones: one card per article instead of a sideways-scrolling table */}
      <ul className="admin-card divide-y divide-border md:hidden">
        {items.map((article, i) => {
          const groupKey = article.series?.id ?? null;
          const startsGroup = grouped && (i === 0 || (items[i - 1].series?.id ?? null) !== groupKey);
          return (
            <Fragment key={article.id}>
              {startsGroup && (
                <li className="bg-surface/60 px-4 pb-2 pt-4">
                  {article.series ? (
                    <Link href={`/admin/articles?series=${article.series.id}`} className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand hover:underline">
                      <Layers className="h-3.5 w-3.5 shrink-0" /> {article.series.title}
                    </Link>
                  ) : (
                    <span className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Not in a series</span>
                  )}
                </li>
              )}
              <li className="space-y-2 p-4">
                <div className="flex items-start gap-2">
                  {grouped && article.seriesOrder != null && (
                    <span className="mt-0.5 inline-block min-w-[1.5rem] shrink-0 rounded bg-brand-tint px-1.5 py-0.5 text-center text-[0.6875rem] font-semibold tabular-nums text-brand">
                      {article.seriesOrder}
                    </span>
                  )}
                  <Link href={`/admin/articles/${article.id}`} className="min-w-0 break-words text-sm font-medium hover:text-brand">
                    {article.title}
                  </Link>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground-muted">
                  <ObjectStatus tone={articleStatusTone(article.status)}>{article.status}</ObjectStatus>
                  {article.category && <span>{article.category.name}</span>}
                  {!grouped && article.series && <span className="inline-flex items-center gap-1"><Layers className="h-3 w-3" /> {article.series.title}</span>}
                  <span className="inline-flex items-center gap-1 tabular-nums">
                    <Heart className={`h-3 w-3 ${article._count.likes > 0 ? "fill-accent-red text-accent-red" : ""}`} />
                    {article._count.likes}
                  </span>
                  <span>{format(article.updatedAt, "MMM d, yyyy")}</span>
                </div>
                <ArticleRowActions articleId={article.id} status={article.status} slug={article.slug} />
              </li>
            </Fragment>
          );
        })}
        {items.length === 0 && (
          <li className="px-4 py-10 text-center text-sm text-foreground-muted">
            Nothing here. Try clearing the filters, or{" "}
            <Link href="/admin/articles/new" className="text-brand hover:underline">create an article</Link>.
          </li>
        )}
      </ul>

      <div className="admin-card hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="admin-th text-left">
              <th className="px-4 py-2.5">Title</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Category</th>
              {!grouped && <th className="px-4 py-2.5">Series</th>}
              <th className="px-4 py-2.5 text-right">Likes</th>
              <th className="px-4 py-2.5">Updated</th>
              <th className="px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((article, i) => {
              const groupKey = article.series?.id ?? null;
              const startsGroup = grouped && (i === 0 || (items[i - 1].series?.id ?? null) !== groupKey);
              return (
                <Fragment key={article.id}>
                  {startsGroup && (
                    <tr className="bg-surface/60">
                      <td colSpan={COLUMNS - 1} className="px-4 pb-2 pt-4">
                        {article.series ? (
                          <Link href={`/admin/articles?series=${article.series.id}`} className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand hover:underline">
                            <Layers className="h-3.5 w-3.5" /> {article.series.title}
                          </Link>
                        ) : (
                          <span className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Not in a series</span>
                        )}
                      </td>
                    </tr>
                  )}
                  <tr className="transition-colors hover:bg-surface/70">
                    <td className={`px-4 py-3 ${grouped ? "pl-8" : ""}`}>
                      {grouped && article.seriesOrder != null && (
                        <span className="mr-2 inline-block min-w-[1.5rem] rounded bg-brand-tint px-1.5 py-0.5 text-center text-[0.6875rem] font-semibold tabular-nums text-brand">
                          {article.seriesOrder}
                        </span>
                      )}
                      <Link href={`/admin/articles/${article.id}`} className="font-medium hover:text-brand">
                        {article.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <ObjectStatus tone={articleStatusTone(article.status)}>{article.status}</ObjectStatus>
                    </td>
                    <td className="px-4 py-3 text-foreground-muted">{article.category?.name ?? "—"}</td>
                    {!grouped && <td className="px-4 py-3 text-foreground-muted">{article.series?.title ?? "—"}</td>}
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
                </Fragment>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={grouped ? COLUMNS - 1 : COLUMNS} className="px-4 py-10 text-center text-foreground-muted">
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
