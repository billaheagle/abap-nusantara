"use client";

import { useEffect } from "react";

/**
 * Reports one view per article per tab session. Lives on the client because
 * article pages are statically cached (ISR) — the server never sees each read.
 */
export function ViewTracker({ articleId }: { articleId: string }) {
  useEffect(() => {
    const key = `viewed:${articleId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Storage blocked (private mode etc.) — still count; the server dedupes by IP.
    }

    const body = JSON.stringify({ articleId });
    const sent = navigator.sendBeacon?.("/api/views", new Blob([body], { type: "application/json" }));
    if (!sent) {
      fetch("/api/views", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => {});
    }
  }, [articleId]);

  return null;
}
