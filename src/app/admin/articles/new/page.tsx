import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { ArticleEditorForm } from "@/components/admin/article-editor-form";

export default async function NewArticlePage() {
  const [categories, series, tags] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.series.findMany({ orderBy: { title: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col">
      <div className="border-b border-border bg-surface-elevated px-6 py-4 sm:px-8">
        <Link href="/admin/articles" className="text-xs font-medium text-brand hover:underline">
          ← Articles
        </Link>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">New article</h1>
      </div>
      <div className="flex-1">
        <ArticleEditorForm mode="create" categories={categories} series={series} tags={tags} />
      </div>
    </div>
  );
}
