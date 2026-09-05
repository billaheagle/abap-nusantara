import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getArticleForEdit } from "@/features/articles/admin-queries";
import { ArticleEditorForm } from "@/components/admin/article-editor-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditArticlePage({ params }: PageProps) {
  const { id } = await params;
  const [article, categories, series, tags] = await Promise.all([
    getArticleForEdit(id),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.series.findMany({ orderBy: { title: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!article) notFound();

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-elevated px-6 py-4 sm:px-8">
        <div>
          <Link href="/admin/articles" className="text-xs font-medium text-brand hover:underline">
            ← Articles
          </Link>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">Edit article</h1>
        </div>
        {article.status === "PUBLISHED" && (
          <Link
            href={`/articles/${article.slug}`}
            target="_blank"
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:border-brand hover:text-brand"
          >
            View live ↗
          </Link>
        )}
      </div>
      <div className="flex-1">
      <ArticleEditorForm
        mode="edit"
        articleId={article.id}
        categories={categories}
        series={series}
        tags={tags}
        initial={{
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          contentJson: article.contentJson,
          coverImage: article.coverImage,
          repoUrl: article.repoUrl,
          status: article.status,
          seriesId: article.seriesId,
          seriesOrder: article.seriesOrder,
          categoryId: article.categoryId,
          tagIds: article.tags.map((t) => t.tagId),
        }}
      />
      </div>
    </div>
  );
}
