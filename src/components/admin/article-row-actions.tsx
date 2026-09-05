"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { setArticleStatusAction, deleteArticleAction } from "@/features/articles/actions";

export function ArticleRowActions({ articleId, status, slug }: { articleId: string; status: "DRAFT" | "PUBLISHED" | "ARCHIVED"; slug: string }) {
  const [isPending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <div className="flex items-center justify-end gap-2 text-xs">
      {status === "PUBLISHED" ? (
        <Link href={`/articles/${slug}`} target="_blank" className="text-brand hover:underline">
          View
        </Link>
      ) : null}
      {status !== "PUBLISHED" && (
        <button disabled={isPending} onClick={() => startTransition(() => setArticleStatusAction(articleId, "PUBLISHED"))} className="font-medium text-positive hover:underline">
          Publish
        </button>
      )}
      {status === "PUBLISHED" && (
        <button disabled={isPending} onClick={() => startTransition(() => setArticleStatusAction(articleId, "DRAFT"))} className="text-foreground-muted hover:underline">
          Unpublish
        </button>
      )}
      {confirmingDelete ? (
        <span className="flex items-center gap-1">
          <button
            disabled={isPending}
            onClick={() => startTransition(() => deleteArticleAction(articleId))}
            className="font-medium text-negative hover:underline"
          >
            Confirm
          </button>
          <button onClick={() => setConfirmingDelete(false)} className="text-foreground-muted hover:underline">
            Cancel
          </button>
        </span>
      ) : (
        <button onClick={() => setConfirmingDelete(true)} className="text-negative hover:underline">
          Delete
        </button>
      )}
    </div>
  );
}
