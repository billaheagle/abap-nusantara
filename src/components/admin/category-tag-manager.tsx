"use client";

import { useActionState, useState } from "react";
import slugify from "slugify";
import {
  createCategoryAction, updateCategoryAction, deleteCategoryAction,
  createTagAction, deleteTagAction, type SimpleFormState,
} from "@/features/taxonomy/actions";

const initialState: SimpleFormState = {};

interface CategoryItem { id: string; name: string; slug: string; description: string | null; _count: { articles: number } }
interface TagItem { id: string; name: string; slug: string; _count: { articles: number } }

export function CategoryManager({ items }: { items: CategoryItem[] }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [touched, setTouched] = useState(false);
  const [state, formAction, isPending] = useActionState(createCategoryAction, initialState);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <form action={formAction} className="grid gap-3 admin-card p-4 sm:grid-cols-3">
        <input name="name" required placeholder="Name" value={name}
          onChange={(e) => { setName(e.target.value); if (!touched) setSlug(slugify(e.target.value, { lower: true, strict: true })); }}
          className="rounded-md border border-border px-3 py-2 text-sm" />
        <input name="slug" required placeholder="slug" value={slug} onChange={(e) => { setTouched(true); setSlug(e.target.value); }}
          className="rounded-md border border-border px-3 py-2 text-sm font-mono" />
        <button type="submit" disabled={isPending} className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50">
          Add category
        </button>
        <input name="description" placeholder="Description (optional)" className="sm:col-span-3 rounded-md border border-border px-3 py-2 text-sm" />
        {state.fieldErrors?.slug && <p className="text-xs text-negative sm:col-span-3">{state.fieldErrors.slug}</p>}
      </form>

      <div className="admin-card divide-y divide-border">
        {items.map((c) => (
          <div key={c.id} className="p-3 flex items-center justify-between gap-4">
            {editingId === c.id ? (
              <EditCategoryInline item={c} onDone={() => setEditingId(null)} />
            ) : (
              <>
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-foreground-muted">/{c.slug} · {c._count.articles} articles</p>
                </div>
                <div className="flex gap-3 text-xs">
                  <button onClick={() => setEditingId(c.id)} className="text-brand hover:underline">Edit</button>
                  <form action={deleteCategoryAction.bind(null, c.id)}>
                    <button type="submit" className="text-negative hover:underline">Delete</button>
                  </form>
                </div>
              </>
            )}
          </div>
        ))}
        {items.length === 0 && <p className="p-4 text-sm text-foreground-muted">No categories yet.</p>}
      </div>
    </div>
  );
}

function EditCategoryInline({ item, onDone }: { item: CategoryItem; onDone: () => void }) {
  const action = updateCategoryAction.bind(null, item.id);
  const [state, formAction, isPending] = useActionState(action, initialState);
  return (
    <form action={async (fd) => { await formAction(fd); onDone(); }} className="flex flex-1 gap-2 items-center flex-wrap">
      <input name="name" defaultValue={item.name} required className="rounded-md border border-border px-2 py-1 text-sm flex-1 min-w-[120px]" />
      <input name="slug" defaultValue={item.slug} required className="rounded-md border border-border px-2 py-1 text-sm font-mono flex-1 min-w-[120px]" />
      <input name="description" defaultValue={item.description ?? ""} className="hidden" />
      <button type="submit" disabled={isPending} className="text-xs text-brand hover:underline">Save</button>
      {state.fieldErrors?.slug && <p className="w-full text-xs text-negative">{state.fieldErrors.slug}</p>}
    </form>
  );
}

export function TagManager({ items }: { items: TagItem[] }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [touched, setTouched] = useState(false);
  const [state, formAction, isPending] = useActionState(createTagAction, initialState);

  return (
    <div className="space-y-6">
      <form action={formAction} className="flex flex-wrap gap-3 admin-card p-4">
        <input name="name" required placeholder="Name" value={name}
          onChange={(e) => { setName(e.target.value); if (!touched) setSlug(slugify(e.target.value, { lower: true, strict: true })); }}
          className="rounded-md border border-border px-3 py-2 text-sm flex-1 min-w-[140px]" />
        <input name="slug" required placeholder="slug" value={slug} onChange={(e) => { setTouched(true); setSlug(e.target.value); }}
          className="rounded-md border border-border px-3 py-2 text-sm font-mono flex-1 min-w-[140px]" />
        <button type="submit" disabled={isPending} className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50">
          Add tag
        </button>
        {state.fieldErrors?.slug && <p className="w-full text-xs text-negative">{state.fieldErrors.slug}</p>}
      </form>

      <div className="flex flex-wrap gap-2">
        {items.map((t) => (
          <div key={t.id} className="flex items-center gap-2 rounded-md border border-border bg-surface-elevated px-3 py-1.5 text-sm">
            #{t.name} <span className="text-xs text-foreground-muted">({t._count.articles})</span>
            <form action={deleteTagAction.bind(null, t.id)}>
              <button type="submit" className="text-xs text-negative hover:underline">×</button>
            </form>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-foreground-muted">No tags yet.</p>}
      </div>
    </div>
  );
}
