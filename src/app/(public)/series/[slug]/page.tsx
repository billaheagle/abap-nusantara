import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Clock } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { hasPublishedArticles } from "@/features/articles/queries";
import { coverTone } from "@/components/brand/cover-art";
import { SeriesArt } from "@/components/brand/series-art";
import { getSetting } from "@/features/settings/queries";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getSeries(slug: string) {
  return prisma.series.findFirst({
    where: { slug, ...hasPublishedArticles },
    include: {
      articles: {
        where: { status: "PUBLISHED" },
        orderBy: { seriesOrder: "asc" },
        select: { id: true, slug: true, title: true, excerpt: true, readingTimeMin: true, seriesOrder: true },
      },
    },
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const series = await getSeries(slug);
  if (!series) notFound();
  const { brand } = await getSetting("general");
  const images = series.coverImage ? [{ url: series.coverImage, width: 1600, height: 900, alt: series.title }] : undefined;
  return {
    title: series.title,
    description: series.description ?? undefined,
    openGraph: {
      locale: "id_ID",
      siteName: [brand.name, brand.accent].filter(Boolean).join(" "),
      title: series.title,
      description: series.description ?? undefined,
      images,
    },
    twitter: { card: "summary_large_image", title: series.title, images: images?.map((i) => i.url) },
  };
}

export default async function SeriesDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const series = await getSeries(slug);
  if (!series) notFound();

  const minutes = series.articles.reduce((sum, a) => sum + a.readingTimeMin, 0);
  const first = series.articles[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="relative isolate overflow-hidden rounded-[24px] p-6 text-white sm:rounded-[28px] sm:p-10">
        <SeriesArt
          coverImage={series.coverImage}
          tone={coverTone(series.order, series.slug)}
          seed={0}
          sizes="(min-width: 1152px) 1104px, 100vw"
          className="absolute inset-0 -z-10 h-full w-full"
          scrim="side"
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white/20 px-2.5 py-1 text-[0.8125rem] font-bold backdrop-blur-md">Seri {series.order}</span>
          <span className="rounded-full bg-black/20 px-2.5 py-1 text-xs font-semibold">
            {series.articles.length} bagian, sekitar {minutes} menit baca
          </span>
        </div>
        <h1 className="display mt-16 max-w-[16ch] text-[clamp(2rem,5vw,3.4rem)] leading-[1.04] font-bold sm:mt-24">{series.title}</h1>
        {series.description && <p className="mt-3 max-w-[38ch] text-[1.0625rem] leading-relaxed opacity-90">{series.description}</p>}
        {first && (
          <Link
            href={`/articles/${first.slug}`}
            className="mt-6 inline-flex items-center gap-2 rounded-[14px] bg-white px-5 py-3 font-semibold text-ink transition-transform hover:-translate-y-px"
          >
            Mulai dari bagian 1 <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" />
          </Link>
        )}
      </header>

      <ol className="mt-8 grid gap-3">
        {series.articles.map((a, i) => (
          <li key={a.id}>
            <Link
              href={`/articles/${a.slug}`}
              className="group grid grid-cols-[2.5rem_minmax(0,1fr)] gap-4 rounded-[20px] border border-border bg-surface-elevated p-4 shadow-[var(--shadow-1)] transition-[border-color,transform] hover:-translate-y-0.5 hover:border-brand sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:items-center sm:p-5"
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-tint text-[0.9375rem] font-bold text-brand-dark tabular-nums sm:h-12 sm:w-12 sm:text-lg">
                {a.seriesOrder ?? i + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-[1.0625rem] leading-snug font-semibold tracking-[-0.01em] group-hover:text-brand-dark sm:text-lg">{a.title}</span>
                {a.excerpt && <span className="mt-1 line-clamp-2 block text-[0.90625rem] leading-snug text-foreground-muted">{a.excerpt}</span>}
              </span>
              <span className="col-start-2 inline-flex items-center gap-1.5 text-[0.8125rem] text-foreground-muted tabular-nums sm:col-start-auto">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" /> {a.readingTimeMin} menit
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
