"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Trash2, X } from "lucide-react";

/**
 * Two-step delete: the first click swaps in a "Delete X?" prompt with a solid
 * destructive button and Cancel, so a stray click never removes anything.
 *
 * `leading` holds sibling actions (e.g. Edit) shown before the trigger; they
 * are hidden while the confirm prompt is open so it has the row to itself.
 *
 * `compact` renders a small × trigger (used on tag chips) instead of the
 * standard "Delete" button.
 */
export function ConfirmDeleteButton({
  action,
  itemLabel,
  compact = false,
  leading,
}: {
  action: () => Promise<unknown>;
  itemLabel: string;
  compact?: boolean;
  leading?: ReactNode;
}) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="text-xs text-foreground-muted">Delete {itemLabel}?</span>
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(async () => { await action(); })}
          className="admin-btn admin-btn-danger"
        >
          <Trash2 /> {isPending ? "Deleting…" : "Delete"}
        </button>
        <button type="button" disabled={isPending} onClick={() => setConfirming(false)} className="admin-btn">
          Cancel
        </button>
      </span>
    );
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={`Delete ${itemLabel}`}
        title="Delete"
        className="flex h-5 w-5 items-center justify-center rounded text-foreground-muted transition-colors hover:bg-negative-tint hover:text-negative"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      {leading}
      <button type="button" onClick={() => setConfirming(true)} className="admin-btn admin-btn-negative">
        <Trash2 /> Delete
      </button>
    </span>
  );
}
