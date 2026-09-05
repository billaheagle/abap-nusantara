import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

export const metadata: Metadata = { title: "Tags" };
export const revalidate = 60;

export default async function TagsIndexPage() {
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { articles: true } } },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-8">Tags</h1>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Link
            key={tag.id}
            href={`/tags/${tag.slug}`}
            className="rounded-md bg-surface px-3 py-1.5 text-sm text-foreground-muted hover:bg-brand-tint hover:text-brand transition-colors"
          >
            #{tag.name} <span className="text-xs">({tag._count.articles})</span>
          </Link>
        ))}
        {tags.length === 0 && <p className="text-sm text-foreground-muted">No tags yet.</p>}
      </div>
    </div>
  );
}
