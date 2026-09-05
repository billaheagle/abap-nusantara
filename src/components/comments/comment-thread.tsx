"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { CommentForm } from "@/components/comments/comment-form";

export interface CommentNode {
  id: string;
  authorName: string;
  body: string;
  createdAt: Date;
  replies: CommentNode[];
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function CommentItem({ comment, articleId, csrfToken, depth }: { comment: CommentNode; articleId: string; csrfToken: string; depth: number }) {
  const [replying, setReplying] = useState(false);
  const canNestFurther = depth < 4;

  const nested = depth > 0;

  return (
    <li className="flex gap-2 sm:gap-3">
      <div
        className={`flex shrink-0 items-center justify-center rounded-full bg-brand-tint font-semibold text-brand ${
          nested ? "h-7 w-7 text-[0.6875rem]" : "h-9 w-9 text-xs"
        }`}
      >
        {initials(comment.authorName)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="rounded-md border border-border bg-surface-elevated px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{comment.authorName}</span>
            <span className="text-xs text-foreground-muted">{formatDistanceToNow(comment.createdAt, { addSuffix: true })}</span>
          </div>
          <p className="mt-1 text-sm whitespace-pre-wrap break-words">{comment.body}</p>
        </div>

        {canNestFurther && (
          <button type="button" onClick={() => setReplying((v) => !v)} className="mt-1 text-xs font-medium text-brand hover:underline">
            {replying ? "Cancel" : "Reply"}
          </button>
        )}

        {replying && (
          <div className="mt-2">
            <CommentForm articleId={articleId} csrfToken={csrfToken} parentCommentId={comment.id} onDone={() => setReplying(false)} />
          </div>
        )}

        {comment.replies.length > 0 && (
          <ul className="mt-3 space-y-3 border-l border-border pl-2 sm:pl-4">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} articleId={articleId} csrfToken={csrfToken} depth={depth + 1} />
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

export function CommentThread({ comments, articleId, csrfToken }: { comments: CommentNode[]; articleId: string; csrfToken: string }) {
  if (comments.length === 0) {
    return <p className="text-sm text-foreground-muted">No comments yet — be the first to share your thoughts.</p>;
  }
  return (
    <ul className="space-y-5">
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} articleId={articleId} csrfToken={csrfToken} depth={0} />
      ))}
    </ul>
  );
}
