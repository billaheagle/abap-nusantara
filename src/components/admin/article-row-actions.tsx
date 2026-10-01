"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Eye, Pencil, Send, EyeOff, Trash2 } from "lucide-react";
import { setArticleStatusAction, deleteArticleAction } from "@/features/articles/actions";

export function ArticleRowActions({ articleId, status, slug }: { articleId: string; status: "DRAFT" | "PUBLISHED" | "ARCHIVED"; slug: string }) {
  const [isPending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (confirmingDelete) {
    return (
      <div className="flex flex-wrap items-center gap-1.5 md:justify-end">
        <span className="mr-1 text-xs text-foreground-muted">Delete this article?</span>
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => deleteArticleAction(articleId))}
          className="admin-btn admin-btn-danger"
        >
          <Trash2 /> {isPending ? "Deleting…" : "Delete"}
        </button>
        <button type="button" onClick={() => setConfirmingDelete(false)} className="admin-btn">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 md:justify-end">
      {status === "PUBLISHED" && (
        <Link href={`/articles/${slug}`} target="_blank" className="admin-btn" title="View on site">
          <Eye /> View
        </Link>
      )}
      <Link href={`/admin/articles/${articleId}`} className="admin-btn admin-btn-brand">
        <Pencil /> Edit
      </Link>
      {status !== "PUBLISHED" ? (
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => setArticleStatusAction(articleId, "PUBLISHED"))}
          className="admin-btn admin-btn-positive"
        >
          <Send /> Publish
        </button>
      ) : (
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => setArticleStatusAction(articleId, "DRAFT"))}
          className="admin-btn admin-btn-critical"
        >
          <EyeOff /> Unpublish
        </button>
      )}
      <button
        type="button"
        onClick={() => setConfirmingDelete(true)}
        className="admin-btn admin-btn-negative admin-btn-icon"
        aria-label="Delete article"
        title="Delete"
      >
        <Trash2 />
      </button>
    </div>
  );
}
