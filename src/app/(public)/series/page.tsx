import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db/prisma";

export const metadata: Metadata = { title: "Series" };
export const revalidate = 60;

export default async function SeriesListPage() {
  const series = await prisma.series.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { articles: { where: { status: "PUBLISHED" } } } } },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Series</h1>
      <p className="text-foreground-muted mb-8">Multi-part learning journeys, in order.</p>

      <div className="grid gap-6 sm:grid-cols-2">
        {series.map((s) => (
          <Link key={s.id} href={`/series/${s.slug}`} className="flex gap-4 rounded-md border border-border p-4 hover:border-brand transition-colors">
            <div className="relative h-20 w-28 shrink-0 rounded-md overflow-hidden bg-surface">
              {s.coverImage ? (
                <Image src={s.coverImage} alt={s.title} fill className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-brand/30 font-bold">AN</div>
              )}
            </div>
            <div>
              <h2 className="font-semibold">{s.title}</h2>
              {s.description && <p className="text-sm text-foreground-muted line-clamp-2 mt-1">{s.description}</p>}
              <p className="text-xs text-foreground-muted mt-2">{s._count.articles} articles</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
