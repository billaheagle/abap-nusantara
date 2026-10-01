"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowDownUp, FolderTree, Search, Tag, X } from "lucide-react";
import { FilterSelect } from "@/components/ui/filter-select";

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

  const hasFilters = Boolean(current.q || current.category || current.tag || (current.sort && current.sort !== "newest"));

  return (
    <div className="space-y-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateParam("q", query.trim());
        }}
        className="flex max-w-md gap-2"
        role="search"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles…"
            aria-label="Search articles"
            className="h-[2.375rem] w-full rounded-[var(--radius-sm)] border border-border bg-surface-elevated pl-9 pr-3 text-sm transition-colors hover:border-border-strong focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/15"
          />
        </div>
        <button
          type="submit"
          className="h-[2.375rem] rounded-[var(--radius-sm)] bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          Search
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          label="Category"
          icon={<FolderTree />}
          value={current.category ?? ""}
          onChange={(v) => updateParam("category", v)}
          searchable={categories.length > 8}
          options={[{ value: "", label: "All categories" }, ...categories.map((c) => ({ value: c.slug, label: c.name }))]}
        />
        <FilterSelect
          label="Tag"
          icon={<Tag />}
          value={current.tag ?? ""}
          onChange={(v) => updateParam("tag", v)}
          searchable={tags.length > 8}
          options={[{ value: "", label: "All tags" }, ...tags.map((t) => ({ value: t.slug, label: `#${t.name}` }))]}
        />
        <FilterSelect
          label="Sort"
          icon={<ArrowDownUp />}
          value={current.sort ?? "newest"}
          defaultValue="newest"
          onChange={(v) => updateParam("sort", v === "newest" ? "" : v)}
          options={[
            { value: "newest", label: "Newest first" },
            { value: "oldest", label: "Oldest first" },
          ]}
        />
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              router.push("/articles");
            }}
            className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-2.5 py-2 text-sm font-medium text-foreground-muted transition-colors hover:bg-surface hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" /> Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
