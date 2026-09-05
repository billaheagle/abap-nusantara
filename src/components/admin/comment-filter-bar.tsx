"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, X } from "lucide-react";

interface Current {
  status?: string;
  q?: string;
  article?: string;
  type?: string;
}

export function CommentFilterBar({
  articles,
  current,
}: {
  articles: { id: string; title: string }[];
  current: Current;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(current.q ?? "");

  function apply(next: Partial<Current>) {
    const merged: Current = { ...current, ...next };
    const params = new URLSearchParams();
    if (merged.status && merged.status !== "ALL") params.set("status", merged.status);
    if (merged.q) params.set("q", merged.q);
    if (merged.article) params.set("article", merged.article);
    if (merged.type && merged.type !== "all") params.set("type", merged.type);
    const qs = params.toString();
    router.push(qs ? `/admin/comments?${qs}` : "/admin/comments");
  }

  const hasFilters = Boolean(current.q || current.article || (current.type && current.type !== "all"));

  return (
    <div className="admin-card mb-4 flex flex-wrap items-center gap-2 p-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          apply({ q: query.trim() });
        }}
        className="relative w-full sm:w-auto sm:min-w-[220px] sm:flex-1"
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email or comment text…"
          className="w-full rounded-md border border-border bg-surface-elevated py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
      </form>

      <select
        value={current.article ?? ""}
        onChange={(e) => apply({ article: e.target.value })}
        className="max-w-[240px] rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm"
      >
        <option value="">All articles</option>
        {articles.map((a) => (
          <option key={a.id} value={a.id}>{a.title}</option>
        ))}
      </select>

      <select
        value={current.type ?? "all"}
        onChange={(e) => apply({ type: e.target.value })}
        className="rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm"
      >
        <option value="all">All comments</option>
        <option value="top">Top-level only</option>
        <option value="reply">Replies only</option>
      </select>

      {hasFilters && (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            apply({ q: undefined, article: undefined, type: undefined });
          }}
          className="inline-flex items-center gap-1 rounded-md px-2 py-2 text-xs font-medium text-foreground-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" /> Clear
        </button>
      )}
    </div>
  );
}
