"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import slugify from "slugify";
import { TiptapEditor } from "@/components/editor/tiptap-editor";
import { CoverImageField } from "@/components/admin/cover-image-field";
import { createArticleAction, updateArticleAction, type ArticleFormState } from "@/features/articles/actions";

interface Option { id: string; name?: string; title?: string }

interface ArticleEditorFormProps {
  mode: "create" | "edit";
  articleId?: string;
  categories: Option[];
  series: Option[];
  tags: Option[];
  initial?: {
    title: string;
    slug: string;
    excerpt: string | null;
    contentJson: unknown;
    coverImage: string | null;
    repoUrl: string | null;
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    seriesId: string | null;
    seriesOrder: number | null;
    categoryId: string | null;
    tagIds: string[];
  };
}

const initialState: ArticleFormState = {};

const fieldClass =
  "w-full rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="admin-card p-5">
      <h2 className="mb-4 text-sm font-semibold">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export function ArticleEditorForm({ mode, articleId, categories, series, tags, initial }: ArticleEditorFormProps) {
  const action = mode === "create" ? createArticleAction : updateArticleAction.bind(null, articleId!);
  const [state, formAction, isPending] = useActionState(action, initialState);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [contentJson, setContentJson] = useState<unknown>(initial?.contentJson ?? { type: "doc", content: [{ type: "paragraph" }] });
  const [selectedTags, setSelectedTags] = useState<string[]>(initial?.tagIds ?? []);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value, { lower: true, strict: true }));
  }

  function toggleTag(id: string) {
    setSelectedTags((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  }

  return (
    <form action={formAction} className="flex min-h-full flex-col">
      <div className="grid flex-1 gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {/* Main column */}
        <div className="min-w-0 space-y-6">
          <Section title="Article">
            <div>
              <label htmlFor="title" className="mb-1 block text-sm font-medium">Title</label>
              <input
                id="title"
                name="title"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className={`${fieldClass} text-lg font-medium`}
              />
              {state.fieldErrors?.title && <p className="mt-1 text-xs text-negative">{state.fieldErrors.title}</p>}
            </div>

            <div>
              <label htmlFor="slug" className="mb-1 block text-sm font-medium">Slug</label>
              <input
                id="slug"
                name="slug"
                required
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                className={`${fieldClass} font-mono`}
              />
              {state.fieldErrors?.slug && <p className="mt-1 text-xs text-negative">{state.fieldErrors.slug}</p>}
            </div>

            <div>
              <label htmlFor="excerpt" className="mb-1 block text-sm font-medium">Excerpt</label>
              <textarea id="excerpt" name="excerpt" defaultValue={initial?.excerpt ?? ""} rows={2} maxLength={300} className={fieldClass} />
            </div>
          </Section>

          <Section title="Content">
            <input type="hidden" name="contentJson" value={JSON.stringify(contentJson)} />
            <TiptapEditor initialContent={initial?.contentJson} onChange={setContentJson} />
            {state.fieldErrors?.contentJson && <p className="text-xs text-negative">{state.fieldErrors.contentJson}</p>}
          </Section>
        </div>

        {/* Settings column */}
        <div className="space-y-6">
          <Section title="Publishing">
            <div>
              <label htmlFor="status" className="mb-1 block text-sm font-medium">Status</label>
              <select id="status" name="status" defaultValue={initial?.status ?? "DRAFT"} className={fieldClass}>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            <div>
              <label htmlFor="categoryId" className="mb-1 block text-sm font-medium">Category</label>
              <select id="categoryId" name="categoryId" defaultValue={initial?.categoryId ?? ""} className={fieldClass}>
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="seriesId" className="mb-1 block text-sm font-medium">Series</label>
              <select id="seriesId" name="seriesId" defaultValue={initial?.seriesId ?? ""} className={fieldClass}>
                <option value="">Standalone (no series)</option>
                {series.map((s) => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="seriesOrder" className="mb-1 block text-sm font-medium">Order in series</label>
              <input id="seriesOrder" name="seriesOrder" type="number" min={1} defaultValue={initial?.seriesOrder ?? ""} className={fieldClass} />
            </div>

            <div>
              <label htmlFor="repoUrl" className="mb-1 block text-sm font-medium">Repository URL</label>
              <input id="repoUrl" name="repoUrl" type="url" defaultValue={initial?.repoUrl ?? ""} placeholder="https://github.com/you/repo" className={fieldClass} />
              {state.fieldErrors?.repoUrl && <p className="mt-1 text-xs text-negative">{state.fieldErrors.repoUrl}</p>}
            </div>
          </Section>

          <Section title="Media">
            <CoverImageField name="coverImage" defaultValue={initial?.coverImage} />
          </Section>

          <Section title="Tags">
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <label
                  key={tag.id}
                  className={`cursor-pointer rounded-md border px-2 py-1 text-xs transition-colors ${
                    selectedTags.includes(tag.id)
                      ? "border-brand bg-brand-tint text-brand"
                      : "border-border text-foreground-muted hover:border-brand/50"
                  }`}
                >
                  <input
                    type="checkbox"
                    name="tagIds"
                    value={tag.id}
                    checked={selectedTags.includes(tag.id)}
                    onChange={() => toggleTag(tag.id)}
                    className="hidden"
                  />
                  #{tag.name}
                </label>
              ))}
              {tags.length === 0 && <p className="text-xs text-foreground-muted">No tags yet.</p>}
            </div>
          </Section>
        </div>
      </div>

      {/* Fiori object-page footer toolbar */}
      <div className="admin-footer-bar flex flex-wrap items-center justify-end gap-3 px-6 py-3 sm:px-8">
        {state.error && <p className="mr-auto text-sm text-negative">{state.error}</p>}
        <Link href="/admin/articles" className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-surface">
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-brand px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
        >
          {isPending ? "Saving…" : mode === "create" ? "Create article" : "Save"}
        </button>
      </div>
    </form>
  );
}
