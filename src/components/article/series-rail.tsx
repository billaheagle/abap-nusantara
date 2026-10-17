"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";

export interface SeriesRailItem {
  id: string;
  slug: string;
  title: string;
  order: number;
}

/** How many parts either side of the current one the compact rail shows. */
const AROUND = 2;

/**
 * The series timeline: read parts in indigo, the current one in turmeric,
 * the rest outlined. In the sticky sidebar it starts compact (the current
 * part and two either side) so the sidebar fits the screen without its own
 * scrollbar; a button shows every part. Below the article it starts open.
 */
export function SeriesRail({
  title,
  href,
  items,
  currentId,
  compact = false,
}: {
  title: string;
  href: string;
  items: SeriesRailItem[];
  currentId: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(!compact);
  const current = items.findIndex((a) => a.id === currentId);

  // A window of 2·AROUND+1 parts around the current one, shifted at the ends.
  const size = Math.min(items.length, 2 * AROUND + 1);
  const start = Math.min(Math.max(0, current - AROUND), items.length - size);
  const visible = open ? items : items.slice(start, start + size);
  const hidden = items.length - visible.length;

  return (
    <div className="rounded-[18px] border border-border bg-surface-elevated p-3.5">
      <Link href={href} className="block px-1 text-sm font-bold leading-snug hover:text-brand-dark">
        {title}
      </Link>
      <ol className="mt-3 grid">
        {visible.map((a) => {
          const i = items.indexOf(a);
          const state = a.id === currentId ? "cur" : i < current ? "done" : "todo";
          const isNext = i === current + 1;
          const isLast = a === visible[visible.length - 1];
          return (
            <li
              key={a.id}
              className={`relative pb-2.5 last:pb-0 ${isLast ? "" : "before:absolute before:left-[10.5px] before:top-6 before:bottom-0 before:w-px before:bg-border"}`}
            >
              <Link
                href={`/articles/${a.slug}`}
                aria-current={state === "cur" ? "page" : undefined}
                className={`group/part grid grid-cols-[22px_minmax(0,1fr)] gap-2.5 text-[0.8125rem] leading-snug ${
                  state === "cur" ? "font-semibold text-foreground" : "text-foreground-muted"
                }`}
              >
                <span
                  className={`relative z-[1] grid h-[22px] w-[22px] place-items-center rounded-full text-[0.6875rem] font-bold tabular-nums ${
                    state === "cur"
                      ? "bg-kunyit text-[#241800] shadow-[0_0_0_4px_rgb(242_182_50/0.2)]"
                      : state === "done"
                        ? "bg-brand text-white"
                        : "border border-border-strong bg-surface-elevated"
                  }`}
                >
                  {a.order}
                </span>
                <span className="pt-0.5">
                  <span className={state === "cur" ? "" : "transition-colors group-hover/part:text-brand-dark"}>{a.title}</span>
                  {isNext && <span className="mt-0.5 block text-xs font-semibold text-brand-dark">Berikutnya →</span>}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
      {(hidden > 0 || (compact && open && items.length > size)) && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="mt-2.5 flex w-full cursor-pointer items-center justify-center gap-1 rounded-[10px] px-2 py-1.5 text-xs font-semibold text-foreground-muted transition-colors hover:bg-surface hover:text-foreground"
        >
          {open ? (
            <>
              Ringkas <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
            </>
          ) : (
            <>
              Tampilkan semua {items.length} bagian <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
