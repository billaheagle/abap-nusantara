import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { hasPublishedArticles } from "@/features/articles/queries";

export const metadata: Metadata = { title: "Categories" };
export const revalidate = 60;

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    where: hasPublishedArticles,
    orderBy: { name: "asc" },
    include: { _count: { select: { articles: { where: { status: "PUBLISHED" } } } } },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-8">Categories</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <Link key={cat.id} href={`/categories/${cat.slug}`} className="rounded-md border border-border p-4 hover:border-brand transition-colors">
            <h2 className="font-semibold">{cat.name}</h2>
            <p className="text-sm text-foreground-muted mt-1">{cat._count.articles} articles</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
