import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { hasPublishedArticles } from "@/features/articles/queries";

export const metadata: Metadata = { title: "Series" };
export const revalidate = 60;

export default async function SeriesListPage() {
  const series = await prisma.series.findMany({
    where: hasPublishedArticles,
    orderBy: { order: "asc" },
    include: { _count: { select: { articles: { where: { status: "PUBLISHED" } } } } },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
      <p className="mb-2 text-xs font-mono font-medium uppercase tracking-wider text-brand">[ Series ]</p>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Series</h1>
      <p className="text-foreground-muted mb-8">Multi-part learning journeys, in order.</p>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {series.map((s) => (
          <Link
            key={s.id}
            href={`/series/${s.slug}`}
            className="card-hover group flex flex-col overflow-hidden rounded-xl border border-border bg-surface-elevated"
          >
            {/* Covers are 16:9 artwork with large title text — keep the full
                frame (no cropping) and size it so the text stays sharp. */}
            <div className="relative aspect-[16/9] overflow-hidden bg-surface">
              {s.coverImage ? (
                <Image
                  src={s.coverImage}
                  alt={s.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 384px"
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-grid">
                  <span className="font-mono text-3xl font-bold text-border-strong">AN</span>
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-2 p-5">
              <h2 className="font-semibold leading-snug tracking-tight transition-colors group-hover:text-brand">{s.title}</h2>
              {s.description && <p className="text-sm leading-relaxed text-foreground-muted line-clamp-3">{s.description}</p>}
              <p className="mt-auto flex items-center justify-between pt-3 text-xs font-mono text-foreground-muted">
                <span>
                  {s._count.articles} {s._count.articles === 1 ? "article" : "articles"}
                </span>
                <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:text-brand" />
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
