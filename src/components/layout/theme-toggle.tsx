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
 * Switches between light and dark. The first choice is saved; until then the
 * site follows the system setting (the inline script in app/layout.tsx sets
 * the starting value before paint).
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, current, () => "light" as Theme);

  // Follow the system setting while the reader hasn't picked one.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      let saved: string | null = null;
      try {
        saved = localStorage.getItem(KEY);
      } catch {}
      if (saved !== "light" && saved !== "dark") set(mq.matches ? "dark" : "light");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
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
