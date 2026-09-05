"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleLikeAction } from "@/features/likes/actions";

export function LikeButton({ articleId, initialLiked, initialCount }: { articleId: string; initialLiked: boolean; initialCount: number }) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
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
        className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-all hover:scale-[1.02] ${
          liked ? "border-accent-red bg-accent-red-tint text-accent-red" : "border-border hover:border-accent-red/50"
        }`}
      >
        <Heart className={`h-4 w-4 ${liked ? "fill-accent-red text-accent-red" : ""}`} />
        {count} {count === 1 ? "like" : "likes"}
      </button>
      {error && <p className="text-xs text-accent-red">{error}</p>}
    </div>
  );
}
