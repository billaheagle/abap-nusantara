"use client";

import { useTransition } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { moderateCommentAction, deleteCommentAction } from "@/features/comments/actions";
import { ObjectStatus, commentStatusTone } from "@/components/admin/admin-ui";

interface CommentRow {
  id: string;
  authorName: string;
  authorEmail: string;
  body: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SPAM";
  createdAt: Date;
  parentCommentId: string | null;
  article: { title: string; slug: string };
  parent: { authorName: string; body: string } | null;
  _count: { replies: number };
}

function initials(name: string) {
  return name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "?";
}

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

export function CommentModerationRow({ comment }: { comment: CommentRow }) {
  const [isPending, startTransition] = useTransition();

  function setStatus(status: CommentRow["status"]) {
    const formData = new FormData();
    formData.set("id", comment.id);
    formData.set("status", status);
    startTransition(() => moderateCommentAction(formData));
  }

  const replyCount = comment._count.replies;

  return (
    <div className="p-4">
      {/* Who + when + status */}
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-tint text-xs font-semibold text-brand">
            {initials(comment.authorName)}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight">{comment.authorName}</p>
            <p className="truncate text-xs text-foreground-muted">
              {comment.authorEmail} · {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
            </p>
          </div>
        </div>
        <ObjectStatus tone={commentStatusTone(comment.status)}>{comment.status}</ObjectStatus>
      </div>

      {/* What it's attached to */}
      <p className="mt-2 text-xs text-foreground-muted">
        <span className="font-medium text-foreground">Article:</span>{" "}
        <Link href={`/articles/${comment.article.slug}`} className="text-brand hover:underline">
          {comment.article.title}
        </Link>
        {comment.parentCommentId ? (
          <span> · reply in a thread</span>
        ) : replyCount > 0 ? (
          <span> · thread starter · {replyCount} {replyCount === 1 ? "reply" : "replies"}</span>
        ) : (
          <span> · top-level comment</span>
        )}
      </p>

      {/* Parent context, only when this is a reply */}
      {comment.parent && (
        <div className="mt-2 rounded-md border-l-2 border-brand/40 bg-brand-tint/40 py-1.5 pl-3 pr-2 text-xs text-foreground-muted">
          ↳ In reply to <span className="font-medium text-foreground">{comment.parent.authorName}</span>:{" "}
          <span className="italic">“{truncate(comment.parent.body, 140)}”</span>
        </div>
      )}

      {/* The comment itself — the thing being moderated */}
      <p className="mt-2.5 border-l-2 border-brand pl-3 text-[0.9375rem] leading-relaxed text-foreground whitespace-pre-wrap">
        {comment.body}
      </p>

      {/* Moderation actions */}
      <div className="mt-3 flex flex-wrap gap-4 text-xs font-medium">
        {comment.status !== "APPROVED" && (
          <button disabled={isPending} onClick={() => setStatus("APPROVED")} className="text-positive hover:underline">
            Approve
          </button>
        )}
        {comment.status !== "REJECTED" && (
          <button disabled={isPending} onClick={() => setStatus("REJECTED")} className="text-foreground-muted hover:underline">
            Reject
          </button>
        )}
        {comment.status !== "SPAM" && (
          <button disabled={isPending} onClick={() => setStatus("SPAM")} className="text-critical hover:underline">
            Mark as spam
          </button>
        )}
        <button
          disabled={isPending}
          onClick={() => startTransition(() => deleteCommentAction(comment.id))}
          className="text-negative hover:underline"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
