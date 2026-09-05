import Link from "next/link";

export function Pagination({ page, totalPages, basePath, searchParams = {} }: { page: number; totalPages: number; basePath: string; searchParams?: Record<string, string | undefined> }) {
  if (totalPages <= 1) return null;

  function hrefFor(targetPage: number) {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    params.set("page", String(targetPage));
    return `${basePath}?${params.toString()}`;
  }

  return (
    <nav className="flex items-center justify-center gap-2 pt-10" aria-label="Pagination">
      <Link
        href={hrefFor(Math.max(1, page - 1))}
        aria-disabled={page <= 1}
        className={`px-4 py-2 text-sm font-medium rounded-full border border-border ${page <= 1 ? "pointer-events-none opacity-40" : "hover:border-brand hover:text-brand"}`}
      >
        Previous
      </Link>
      <span className="text-sm font-mono text-foreground-muted px-3">
        {page} / {totalPages}
      </span>
      <Link
        href={hrefFor(Math.min(totalPages, page + 1))}
        aria-disabled={page >= totalPages}
        className={`px-4 py-2 text-sm font-medium rounded-full border border-border ${page >= totalPages ? "pointer-events-none opacity-40" : "hover:border-brand hover:text-brand"}`}
      >
        Next
      </Link>
    </nav>
  );
}
