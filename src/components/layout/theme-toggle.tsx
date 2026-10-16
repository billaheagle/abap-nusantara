"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

const KEY = "an-theme";
type Theme = "light" | "dark";

function current(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

const listeners = new Set<() => void>();

function set(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Switches between light and dark and remembers the choice. The site starts
 * light; the inline script in app/layout.tsx restores a saved dark choice
 * before paint.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, current, () => "light" as Theme);

  // React re-renders <html> on the client for some not-found pages, which
  // drops the attribute the inline script set. Put the saved choice back.
  useEffect(() => {
    if (document.documentElement.hasAttribute("data-theme")) return;
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(KEY);
    } catch {}
    set(saved === "dark" ? "dark" : "light");
  }, []);

  const next: Theme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => {
        set(next);
        try {
          localStorage.setItem(KEY, next);
        } catch {}
      }}
      aria-label={next === "dark" ? "Pakai mode gelap" : "Pakai mode terang"}
      title={next === "dark" ? "Mode gelap" : "Mode terang"}
      className={`grid place-items-center rounded-xl p-2.5 text-foreground-muted transition-colors hover:bg-surface hover:text-foreground ${className}`}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
    </button>
  );
}
