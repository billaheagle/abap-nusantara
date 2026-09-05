"use client";

import { useActionState, useRef } from "react";
import { submitCommentAction, type CommentFormState } from "@/features/comments/actions";

const initialState: CommentFormState = {};

export function CommentForm({ articleId, csrfToken, parentCommentId, onDone }: { articleId: string; csrfToken: string; parentCommentId?: string; onDone?: () => void }) {
  const [state, formAction, isPending] = useActionState(submitCommentAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await formAction(formData);
        formRef.current?.reset();
        onDone?.();
      }}
      className="space-y-3"
    >
      <input type="hidden" name="articleId" value={articleId} />
      <input type="hidden" name="csrfToken" value={csrfToken} />
      {parentCommentId && <input type="hidden" name="parentCommentId" value={parentCommentId} />}
      {/* Honeypot — hidden from real users via CSS, left unstyled-visible to naive bots that ignore CSS. */}
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="authorName" className="block text-sm font-medium mb-1">
            Name
          </label>
          <input
            id="authorName"
            name="authorName"
            required
            maxLength={60}
            className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
        </div>
        <div>
          <label htmlFor="authorEmail" className="block text-sm font-medium mb-1">
            Email <span className="text-foreground-muted font-normal">(not published)</span>
          </label>
          <input
            id="authorEmail"
            name="authorEmail"
            type="email"
            required
            maxLength={255}
            className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
        </div>
      </div>

      <div>
        <label htmlFor="body" className="block text-sm font-medium mb-1">
          Comment
        </label>
        <textarea
          id="body"
          name="body"
          required
          maxLength={2000}
          rows={parentCommentId ? 3 : 4}
          className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
      </div>

      {state.error && <p className="text-sm text-accent-red">{state.error}</p>}
      {state.success && <p className="text-sm text-brand">Thanks! Your comment is awaiting moderation.</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark transition-colors disabled:opacity-50"
      >
        {isPending ? "Submitting…" : parentCommentId ? "Reply" : "Post Comment"}
      </button>
    </form>
  );
}
