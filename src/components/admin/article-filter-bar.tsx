"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Heart, Search, X } from "lucide-react";

interface Current {
  q?: string;
  status?: string;
  category?: string;
  sort?: string;
  liked?: string;
}

const STATUSES = [
  { value: "ALL", label: "All statuses" },
  { value: "PUBLISHED", label: "Published" },
  { value: "DRAFT", label: "Draft" },
  { value: "ARCHIVED", label: "Archived" },
];

const SORTS = [
  { value: "updated", label: "Updated" },
  { value: "created", label: "Created" },
  { value: "title", label: "Title A–Z" },
  { value: "status", label: "Status" },
  { value: "likes", label: "Most liked" },
];

export function ArticleFilterBar({
  categories,
  current,
}: {
  categories: { id: string; name: string }[];
  current: Current;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(current.q ?? "");

  const likedOnly = current.liked === "1";

  function apply(next: Partial<Current>) {
    const merged: Current = { ...current, ...next };
    const params = new URLSearchParams();
    if (merged.q) params.set("q", merged.q);
    if (merged.status && merged.status !== "ALL") params.set("status", merged.status);
    if (merged.category) params.set("category", merged.category);
    if (merged.sort && merged.sort !== "updated") params.set("sort", merged.sort);
    if (merged.liked === "1") params.set("liked", "1");
    const qs = params.toString();
    router.push(qs ? `/admin/articles?${qs}` : "/admin/articles");
  }

  const hasFilters = Boolean(
    current.q || (current.status && current.status !== "ALL") || current.category || likedOnly,
  );

  return (
    <div className="admin-card mb-5 flex flex-wrap items-center gap-2 p-3">
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
          placeholder="Search title, slug or excerpt…"
          className="w-full rounded-md border border-border bg-surface-elevated py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
      </form>

      <select
        value={current.status ?? "ALL"}
        onChange={(e) => apply({ status: e.target.value })}
        className="rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm"
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      <select
        value={current.category ?? ""}
        onChange={(e) => apply({ category: e.target.value })}
        className="rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm"
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <select
        value={current.sort ?? "updated"}
        onChange={(e) => apply({ sort: e.target.value })}
        className="rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm"
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>Sort: {s.label}</option>
        ))}
      </select>

      <button
        type="button"
        aria-pressed={likedOnly}
        onClick={() => apply({ liked: likedOnly ? undefined : "1" })}
        className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
          likedOnly
            ? "border-accent-red bg-accent-red-tint text-accent-red"
            : "border-border text-foreground-muted hover:border-accent-red/50"
        }`}
      >
        <Heart className={`h-3.5 w-3.5 ${likedOnly ? "fill-accent-red" : ""}`} /> Liked only
      </button>

      {hasFilters && (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            router.push("/admin/articles");
          }}
          className="inline-flex items-center gap-1 rounded-md px-2 py-2 text-xs font-medium text-foreground-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" /> Clear
        </button>
      )}
    </div>
  );
}
