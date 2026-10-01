import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedArticles, tagHasPublishedArticles } from "@/features/articles/queries";
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
  const tag = await prisma.tag.findFirst({ where: { slug, ...tagHasPublishedArticles } });
  if (!tag) return {};
  return { title: `#${tag.name}`, description: `Articles tagged with ${tag.name}.` };
}

export default async function TagPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const tag = await prisma.tag.findFirst({ where: { slug, ...tagHasPublishedArticles } });
  if (!tag) notFound();

  const page = Number(pageParam) || 1;
  const { items, totalPages } = await getPublishedArticles({ page, tagSlug: slug });

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
      <p className="text-sm font-semibold text-brand uppercase tracking-wide mb-2">Tag</p>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">#{tag.name}</h1>

      {items.length === 0 ? (
        <p className="text-foreground-muted text-sm mt-10">No articles with this tag yet.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-10">
          {items.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} basePath={`/tags/${slug}`} />
    </div>
  );
}
