import type { Metadata } from "next";
import { getPublishedArticles } from "@/features/articles/queries";
import { ArticleCard } from "@/components/ui/article-card";
import { Pagination } from "@/components/ui/pagination";

export const metadata: Metadata = { title: "Cari", robots: { index: false } };

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q, page: pageParam } = await searchParams;
  const page = Number(pageParam) || 1;
  const result = q ? await getPublishedArticles({ query: q, page }) : null;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
      <h1 className="display text-[clamp(2rem,4.6vw,3.25rem)] leading-[1.05] font-bold mb-2">Cari</h1>
      <form action="/search" className="max-w-md mt-6 flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Cari artikel…"
          className="min-w-0 flex-1 rounded-xl border border-border bg-surface-elevated px-3.5 py-2.5 text-[0.9375rem] focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
        />
        <button type="submit" className="rounded-xl bg-brand px-5 py-2.5 text-[0.9375rem] font-semibold text-white hover:bg-brand-dark">
          Cari
        </button>
      </form>

      {q && (
        <>
          <p className="text-sm text-foreground-muted mt-8 mb-4">
            {result?.total ?? 0} hasil untuk &ldquo;{q}&rdquo;
          </p>
          <div className="grid grid-cols-1 gap-4 sm:gap-[18px] md:grid-cols-2 lg:grid-cols-3">
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
