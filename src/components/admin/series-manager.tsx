"use client";

import { useActionState, useState } from "react";
import slugify from "slugify";
import { createSeriesAction, updateSeriesAction, deleteSeriesAction, type SimpleFormState } from "@/features/series/actions";

interface SeriesItem { id: string; title: string; slug: string; description: string | null; coverImage: string | null; order: number; _count: { articles: number } }

const initialState: SimpleFormState = {};

function SeriesForm({ mode, item, onDone }: { mode: "create" | "edit"; item?: SeriesItem; onDone?: () => void }) {
  const action = mode === "create" ? createSeriesAction : updateSeriesAction.bind(null, item!.id);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [title, setTitle] = useState(item?.title ?? "");
  const [slug, setSlug] = useState(item?.slug ?? "");
  const [touched, setTouched] = useState(mode === "edit");

  return (
    <form
      action={async (fd) => {
        await formAction(fd);
        onDone?.();
      }}
      className="grid gap-3 sm:grid-cols-2"
    >
      <div>
        <input name="title" required placeholder="Title" value={title}
          onChange={(e) => { setTitle(e.target.value); if (!touched) setSlug(slugify(e.target.value, { lower: true, strict: true })); }}
          className="w-full rounded-md border border-border px-3 py-2 text-sm" />
      </div>
      <div>
        <input name="slug" required placeholder="slug" value={slug} onChange={(e) => { setTouched(true); setSlug(e.target.value); }}
          className="w-full rounded-md border border-border px-3 py-2 text-sm font-mono" />
        {state.fieldErrors?.slug && <p className="mt-1 text-xs text-negative">{state.fieldErrors.slug}</p>}
      </div>
      <div className="sm:col-span-2">
        <textarea name="description" placeholder="Description" defaultValue={item?.description ?? ""} rows={2} className="w-full rounded-md border border-border px-3 py-2 text-sm" />
      </div>
      <input name="coverImage" placeholder="Cover image URL" defaultValue={item?.coverImage ?? ""} className="w-full rounded-md border border-border px-3 py-2 text-sm" />
      <input name="order" type="number" placeholder="Order" defaultValue={item?.order ?? 0} className="w-full rounded-md border border-border px-3 py-2 text-sm" />
      <div className="sm:col-span-2">
        <button type="submit" disabled={isPending} className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50">
          {isPending ? "Saving…" : mode === "create" ? "Add series" : "Save"}
        </button>
      </div>
    </form>
  );
}

export function SeriesManager({ items }: { items: SeriesItem[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <div className="admin-card p-5">
        <h2 className="mb-3 text-sm font-semibold">Add new series</h2>
        <SeriesForm mode="create" />
      </div>

      <div className="admin-card divide-y divide-border">
        {items.map((s) => (
          <div key={s.id} className="p-4">
            {editingId === s.id ? (
              <SeriesForm mode="edit" item={s} onDone={() => setEditingId(null)} />
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-sm">{s.title}</p>
                  <p className="text-xs text-foreground-muted">/{s.slug} · {s._count.articles} articles</p>
                </div>
                <div className="flex gap-3 text-xs">
                  <button onClick={() => setEditingId(s.id)} className="text-brand hover:underline">Edit</button>
                  <form action={deleteSeriesAction.bind(null, s.id)}>
                    <button type="submit" className="text-negative hover:underline">Delete</button>
                  </form>
                </div>
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && <p className="p-4 text-sm text-foreground-muted">No series yet.</p>}
      </div>
    </div>
  );
}
