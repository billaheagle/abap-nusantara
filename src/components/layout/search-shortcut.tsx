"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Ctrl/Cmd+K or "/" opens search, unless the reader is typing in a field. */
export function SearchShortcut() {
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
      const combo = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k";
      if (combo || (!typing && e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey)) {
        e.preventDefault();
        router.push("/search");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return null;
}
