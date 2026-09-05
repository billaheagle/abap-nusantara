"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

interface FilterOption {
  slug: string;
  name: string;
}

export function ArticlesFilterBar({
  categories,
  tags,
  current,
}: {
  categories: FilterOption[];
  tags: FilterOption[];
  current: { q?: string; category?: string; tag?: string; sort?: string };
}) {
  const router = useRouter();
  const [query, setQuery] = useState(current.q ?? "");

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams();
    if (current.q) params.set("q", current.q);
    if (current.category) params.set("category", current.category);
    if (current.tag) params.set("tag", current.tag);
    if (current.sort) params.set("sort", current.sort);
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`/articles?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateParam("q", query);
        }}
        className="flex gap-2 max-w-md"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles…"
            className="w-full rounded-md border border-border pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
        </div>
        <button type="submit" className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">
          Search
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <select
          value={current.category ?? ""}
          onChange={(e) => updateParam("category", e.target.value)}
          className="rounded-md border border-border px-3 py-1.5 bg-background"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
        <select
          value={current.tag ?? ""}
          onChange={(e) => updateParam("tag", e.target.value)}
          className="rounded-md border border-border px-3 py-1.5 bg-background"
        >
          <option value="">All tags</option>
          {tags.map((t) => (
            <option key={t.slug} value={t.slug}>#{t.name}</option>
          ))}
        </select>
        <select
          value={current.sort ?? "newest"}
          onChange={(e) => updateParam("sort", e.target.value)}
          className="rounded-md border border-border px-3 py-1.5 bg-background"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>
    </div>
  );
}
