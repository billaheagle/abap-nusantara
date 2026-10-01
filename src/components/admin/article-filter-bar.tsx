"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowUpDown, CircleDot, Folder, Hash, Layers, Search, X } from "lucide-react";
import { FilterSelect } from "@/components/ui/filter-select";

interface Current {
  q?: string;
  status?: string;
  category?: string;
  series?: string;
  tag?: string;
  sort?: string;
}

const STATUSES = [
  { value: "ALL", label: "All statuses" },
  { value: "PUBLISHED", label: "Published" },
  { value: "DRAFT", label: "Draft" },
  { value: "ARCHIVED", label: "Archived" },
];

// Must match DEFAULT_ADMIN_SORT in features/articles/admin-queries.ts.
const DEFAULT_SORT = "series";

const SORTS = [
  { value: "series", label: "Grouped by series" },
  { value: "updated", label: "Updated" },
  { value: "created", label: "Created" },
  { value: "title", label: "Title A–Z" },
  { value: "status", label: "Status" },
  { value: "likes", label: "Most liked" },
];

export function ArticleFilterBar({
  categories,
  series,
  tags,
  current,
}: {
  categories: { id: string; name: string }[];
  series: { id: string; title: string }[];
  tags: { id: string; name: string }[];
  current: Current;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(current.q ?? "");

  function apply(next: Partial<Current>) {
    const merged: Current = { ...current, ...next };
    const params = new URLSearchParams();
    if (merged.q) params.set("q", merged.q);
    if (merged.status && merged.status !== "ALL") params.set("status", merged.status);
    if (merged.category) params.set("category", merged.category);
    if (merged.series) params.set("series", merged.series);
    if (merged.tag) params.set("tag", merged.tag);
    if (merged.sort && merged.sort !== DEFAULT_SORT) params.set("sort", merged.sort);
    const qs = params.toString();
    router.push(qs ? `/admin/articles?${qs}` : "/admin/articles");
  }

  const hasFilters = Boolean(
    current.q || (current.status && current.status !== "ALL") || current.category || current.series || current.tag,
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

      <FilterSelect
        label="Status"
        icon={<CircleDot />}
        value={current.status ?? "ALL"}
        defaultValue="ALL"
        onChange={(v) => apply({ status: v })}
        options={STATUSES}
      />

      <FilterSelect
        label="Category"
        icon={<Folder />}
        value={current.category ?? ""}
        onChange={(v) => apply({ category: v })}
        options={[{ value: "", label: "All categories" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
      />

      <FilterSelect
        label="Series"
        icon={<Layers />}
        value={current.series ?? ""}
        onChange={(v) => apply({ series: v })}
        searchable={series.length > 6}
        options={[
          { value: "", label: "All series" },
          ...series.map((x) => ({ value: x.id, label: x.title })),
          { value: "none", label: "Not in a series", separated: true },
        ]}
      />

      <FilterSelect
        label="Tag"
        icon={<Hash />}
        value={current.tag ?? ""}
        onChange={(v) => apply({ tag: v })}
        searchable={tags.length > 6}
        options={[{ value: "", label: "All tags" }, ...tags.map((t) => ({ value: t.id, label: t.name }))]}
      />

      <FilterSelect
        label="Sort"
        icon={<ArrowUpDown />}
        value={current.sort ?? DEFAULT_SORT}
        defaultValue={DEFAULT_SORT}
        onChange={(v) => apply({ sort: v })}
        options={SORTS}
      />

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
