"use client";

import { useEffect, useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { getLikeState, toggleLikeAction } from "@/features/likes/actions";

export function LikeButton({ articleId, initialCount }: { articleId: string; initialCount: number }) {
  // The page is cached, so whether this visitor liked it (their anon cookie)
  // is asked once the page has loaded.
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialCount);
  useEffect(() => {
    let live = true;
    getLikeState(articleId).then((s) => {
      if (!live) return;
      setLiked(s.liked);
      setCount(s.count);
    });
    return () => {
      live = false;
    };
  }, [articleId]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (isPending) return;
    // Optimistic update — reconciled with the server response below, and
    // rolled back to the pre-click values (not the first-render values) on error.
    const prevLiked = liked;
    const prevCount = count;
    setLiked(!prevLiked);
    setCount(prevLiked ? prevCount - 1 : prevCount + 1);
    setError(null);

    startTransition(async () => {
      const result = await toggleLikeAction(articleId);
      if (result.error) {
        setError(result.error);
        setLiked(prevLiked);
        setCount(prevCount);
        return;
      }
      setLiked(result.liked);
      setCount(result.count);
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-pressed={liked}
        className={`inline-flex items-center gap-2 rounded-full border bg-surface-elevated px-4 py-2 text-sm font-semibold transition-colors ${
          liked ? "border-accent-red bg-accent-red-tint text-accent-red" : "border-border hover:border-accent-red/50"
        }`}
      >
        <Heart className={`h-4 w-4 ${liked ? "fill-accent-red text-accent-red" : ""}`} />
        {count} suka
      </button>
      {error && <p className="text-xs text-accent-red">{error}</p>}
    </div>
  );
}
