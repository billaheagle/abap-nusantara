import type { Metadata } from "next";
import { getPublishedArticles, hasPublishedArticles, tagHasPublishedArticles } from "@/features/articles/queries";
import { ArticleCard } from "@/components/ui/article-card";
import { Pagination } from "@/components/ui/pagination";
import { ArticlesFilterBar } from "@/components/article/articles-filter-bar";
import { prisma } from "@/lib/db/prisma";

export const metadata: Metadata = {
  title: "Articles",
  description: "All articles on SAP BTP, ABAP, Integration Suite/CPI, OData, CAP, and Fiori/UI5.",
};

export const revalidate = 60;

interface PageProps {
  searchParams: Promise<{ page?: string; q?: string; category?: string; tag?: string; sort?: string }>;
}

export default async function ArticlesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const sort = params.sort === "oldest" ? "oldest" : "newest";

  const [{ items, totalPages }, categories, tags] = await Promise.all([
    getPublishedArticles({ page, query: params.q, categorySlug: params.category, tagSlug: params.tag, sort }),
    prisma.category.findMany({ where: hasPublishedArticles, orderBy: { name: "asc" } }),
    prisma.tag.findMany({ where: tagHasPublishedArticles, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-16">
      <p className="text-xs font-mono font-medium text-brand uppercase tracking-wider mb-2">[ Articles ]</p>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">All articles</h1>
      <p className="text-foreground-muted mb-8">Tutorials and notes from building on SAP BTP.</p>

      <ArticlesFilterBar categories={categories} tags={tags} current={{ q: params.q, category: params.category, tag: params.tag, sort }} />

      {items.length === 0 ? (
        <p className="text-foreground-muted text-sm mt-10">No articles match your filters.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8">
          {items.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} basePath="/articles" searchParams={{ q: params.q, category: params.category, tag: params.tag, sort }} />
    </div>
  );
}
