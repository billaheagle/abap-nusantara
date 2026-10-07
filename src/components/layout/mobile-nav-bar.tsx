"use client";

import { useEffect, useState } from "react";

/** Distance from the top that always shows the bar, and the scroll needed before it reacts. */
const TOP_ZONE = 64;
const THRESHOLD = 8;

/**
 * The mobile nav row slides away while scrolling down so readers get the
 * screen back, and returns on any scroll up. It moves with a transform only,
 * so the sticky header keeps its height and the article never jumps.
 */
export function MobileNavBar({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      if (y < TOP_ZONE) setHidden(false);
      else if (Math.abs(y - lastY) < THRESHOLD) return;
      else setHidden(y > lastY);
      lastY = y;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <nav
      aria-hidden={hidden || undefined}
      inert={hidden}
      className={`md:hidden mt-2 mx-auto max-w-4xl flex flex-wrap items-center justify-around gap-0.5 rounded-[21px] border border-border bg-background/80 backdrop-blur-md px-1.5 py-1.5 text-sm font-medium text-foreground-muted transition-[translate,opacity] duration-200 ease-out motion-reduce:transition-none ${
        hidden ? "pointer-events-none -translate-y-3 opacity-0" : "pointer-events-auto"
      }`}
    >
      {children}
    </nav>
  );
}
