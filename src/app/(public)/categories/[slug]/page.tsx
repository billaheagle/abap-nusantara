import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedArticles, hasPublishedArticles } from "@/features/articles/queries";
import { ArticleCard } from "@/components/ui/article-card";
import { Pagination } from "@/components/ui/pagination";
import { prisma } from "@/lib/db/prisma";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findFirst({ where: { slug, ...hasPublishedArticles } });
  if (!category) return {};
  return { title: category.name, description: category.description ?? `Articles in ${category.name}.` };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const category = await prisma.category.findFirst({ where: { slug, ...hasPublishedArticles } });
  if (!category) notFound();

  const page = Number(pageParam) || 1;
  const { items, totalPages } = await getPublishedArticles({ page, categorySlug: slug });

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
      <p className="text-sm font-semibold text-brand uppercase tracking-wide mb-2">Category</p>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{category.name}</h1>
      {category.description && <p className="text-foreground-muted mt-3 max-w-2xl">{category.description}</p>}

      {items.length === 0 ? (
        <p className="text-foreground-muted text-sm mt-10">No articles in this category yet.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-10">
          {items.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} basePath={`/categories/${slug}`} />
    </div>
  );
}
