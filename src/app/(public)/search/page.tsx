import type { Metadata } from "next";
import { getPublishedArticles } from "@/features/articles/queries";
import { ArticleCard } from "@/components/ui/article-card";
import { Pagination } from "@/components/ui/pagination";

export const metadata: Metadata = { title: "Search", robots: { index: false } };

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q, page: pageParam } = await searchParams;
  const page = Number(pageParam) || 1;
  const result = q ? await getPublishedArticles({ query: q, page }) : null;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Search</h1>
      <form action="/search" className="max-w-md mt-6 flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search articles…"
          className="flex-1 rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
        <button type="submit" className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">
          Search
        </button>
      </form>

      {q && (
        <>
          <p className="text-sm text-foreground-muted mt-8 mb-4">
            {result?.total ?? 0} result{result?.total === 1 ? "" : "s"} for &ldquo;{q}&rdquo;
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {result?.items.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
          {result && <Pagination page={page} totalPages={result.totalPages} basePath="/search" searchParams={{ q }} />}
        </>
      )}
    </div>
  );
}
