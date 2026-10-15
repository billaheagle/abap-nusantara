import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { hasPublishedArticles } from "@/features/articles/queries";
import { CoverArt, coverTone } from "@/components/brand/cover-art";

export const metadata: Metadata = { title: "Series" };
export const revalidate = 60;

export default async function SeriesListPage() {
  const series = await prisma.series.findMany({
    where: hasPublishedArticles,
    orderBy: { order: "asc" },
    include: { _count: { select: { articles: { where: { status: "PUBLISHED" } } } } },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="display text-[clamp(2rem,4.6vw,3.25rem)] leading-[1.05] font-bold">Seri</h1>
      <p className="mt-3 max-w-[56ch] text-[1.0625rem] text-foreground-muted">Belajar berurutan. Tiap seri dibaca dari bagian pertama, dan bisa dibaca sendiri.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {series.map((s, i) => (
          <Link
            key={s.id}
            href={`/series/${s.slug}`}
            className="group relative isolate flex min-h-[260px] flex-col overflow-hidden rounded-[24px] p-6 text-white transition-transform duration-300 hover:-translate-y-[3px] sm:min-h-[300px] sm:p-7"
          >
            <CoverArt tone={coverTone(s.order, s.slug)} seed={i} className="absolute inset-0 -z-10 h-full w-full transition-transform duration-500 group-hover:scale-[1.03]" />
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full bg-white/20 px-2.5 py-1 text-[0.8125rem] font-bold backdrop-blur-md">Seri {s.order || i + 1}</span>
              <span className="rounded-full bg-black/20 px-2.5 py-1 text-xs font-semibold">{s._count.articles} bagian</span>
            </div>
            <h2 className="mt-auto max-w-[20ch] text-[clamp(1.5rem,2.6vw,2rem)] leading-[1.12] font-bold tracking-[-0.02em]">{s.title}</h2>
            {s.description && <p className="mt-2 max-w-[48ch] text-[0.9375rem] leading-snug opacity-85">{s.description}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
}
