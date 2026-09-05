import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { ArticleCard } from "@/components/ui/article-card";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getSeries(slug: string) {
  return prisma.series.findUnique({
    where: { slug },
    include: {
      articles: {
        where: { status: "PUBLISHED" },
        orderBy: { seriesOrder: "asc" },
        select: {
          id: true, slug: true, title: true, excerpt: true, coverImage: true, readingTimeMin: true, publishedAt: true, updatedAt: true,
          series: { select: { title: true, slug: true } },
          category: { select: { name: true, slug: true } },
          tags: { select: { tag: { select: { name: true, slug: true } } } },
        },
      },
    },
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const series = await getSeries(slug);
  if (!series) return {};
  return { title: series.title, description: series.description ?? undefined };
}

export default async function SeriesDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const series = await getSeries(slug);
  if (!series) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
      <p className="text-sm font-semibold text-accent-red uppercase tracking-wide mb-2">Series</p>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{series.title}</h1>
      {series.description && <p className="text-foreground-muted mt-3 max-w-2xl">{series.description}</p>}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-10">
        {series.articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}
