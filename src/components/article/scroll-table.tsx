"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Horizontal scroller for article tables. When the table is wider than the
 * space available, a soft shadow appears on the edge(s) that still hide
 * content, so readers can tell it scrolls (mostly on phones).
 */
export function ScrollTable({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      setEdges({ left: el.scrollLeft > 1, right: el.scrollLeft < max - 1 });
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="table-scroll" data-shadow-left={edges.left} data-shadow-right={edges.right}>
      <div ref={ref} className="table-scroll-inner" tabIndex={edges.left || edges.right ? 0 : undefined}>
        {children}
      </div>
    </div>
  );
}
