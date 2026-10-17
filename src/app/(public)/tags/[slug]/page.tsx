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
  if (!tag) notFound();
  return { title: `#${tag.name}`, description: `Artikel dengan tag ${tag.name}.` };
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
      <p className="mb-3 inline-flex rounded-full bg-brand-tint px-3 py-1 text-sm font-semibold text-brand-dark">Tag</p>
      <h1 className="display text-[clamp(2rem,4.6vw,3.25rem)] leading-[1.05] font-bold">#{tag.name}</h1>

      {items.length === 0 ? (
        <p className="text-foreground-muted text-sm mt-10">Belum ada artikel dengan tag ini.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-[18px] md:grid-cols-2 lg:grid-cols-3 mt-10">
          {items.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} basePath={`/tags/${slug}`} />
    </div>
  );
}
