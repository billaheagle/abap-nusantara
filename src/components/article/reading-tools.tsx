"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { TocHeading } from "@/lib/editor/headings";

/** The element whose scroll position counts as reading progress. */
const BODY_ID = "article-body";
const SIZE_KEY = "an-read-size";
const SIZES = [16, 17, 18, 19, 20, 21, 22, 23];
const DEFAULT_SIZE = 19;

// ---- Shared scroll progress (one listener for every subscriber) ---------

let progress = 0;
const listeners = new Set<() => void>();

function measure() {
  const el = document.getElementById(BODY_ID);
  if (!el) return;
  const r = el.getBoundingClientRect();
  const total = r.height - window.innerHeight * 0.5;
  const next = Math.min(1, Math.max(0, -r.top / Math.max(1, total)));
  if (next !== progress) {
    progress = next;
    listeners.forEach((l) => l());
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
  }
  measure();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    }
  };
}

function useProgress() {
  return useSyncExternalStore(subscribe, () => progress, () => 0);
}

/** Thin turmeric bar across the top of the window. */
export function ReadingProgressBar() {
  const p = useProgress();
  return (
    <div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-50 h-[3px] origin-left bg-kunyit"
      style={{ transform: `scaleX(${p})` }}
    />
  );
}

/**
 * A heading counts as reached once its top passes this line. Anchor jumps
 * stop headings at html { scroll-padding-top: 6rem } (96px), so the line sits
 * a little below that.
 */
const SPY_LINE = 120;

/** Table of contents that highlights the section being read. */
export function ArticleToc({ headings }: { headings: TocHeading[] }) {
  const [active, setActive] = useState(headings[0]?.id);
  // While a clicked link is scrolling into place, keep its highlight steady.
  const lockUntil = useRef(0);

  useEffect(() => {
    const els = headings.map((h) => document.getElementById(h.id)).filter((el): el is HTMLElement => !!el);
    if (els.length === 0) return;
    const onScroll = () => {
      if (Date.now() < lockUntil.current) return;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      let current = els[0].id;
      for (const el of els) if (el.getBoundingClientRect().top <= SPY_LINE) current = el.id;
      // A short last section may never reach the line; the end of the page means it's being read.
      if (atBottom && els[els.length - 1].getBoundingClientRect().top < window.innerHeight) current = els[els.length - 1].id;
      setActive(current);
    };
    const onScrollEnd = () => {
      lockUntil.current = 0;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scrollend", onScrollEnd);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scrollend", onScrollEnd);
    };
  }, [headings]);

  return (
    <ol className="grid gap-0.5">
      {headings.map((h) => (
        <li key={h.id}>
          <a
            href={`#${h.id}`}
            onClick={() => {
              setActive(h.id);
              // Released early by scrollend where supported.
              lockUntil.current = Date.now() + 1200;
            }}
            aria-current={active === h.id ? "location" : undefined}
            className={`block rounded-[10px] py-[7px] pr-3 text-sm leading-snug text-foreground-muted transition-colors hover:bg-surface hover:text-foreground aria-[current=location]:bg-surface-elevated aria-[current=location]:font-semibold aria-[current=location]:text-foreground aria-[current=location]:shadow-[var(--shadow-1)] ${
              h.level === 3 ? "pl-6" : "pl-3"
            }`}
          >
            {h.text}
          </a>
        </li>
      ))}
    </ol>
  );
}

// ---- Text size -----------------------------------------------------------

// Shared by the sidebar and the phone toolbar, remembered per browser.
let textSize: number | null = null;
const sizeListeners = new Set<() => void>();

function applySize(px: number) {
  document.documentElement.style.setProperty("--read-size", `${px / 16}rem`);
}

function readTextSize(): number {
  if (textSize === null) {
    let saved = DEFAULT_SIZE;
    try {
      saved = Number(localStorage.getItem(SIZE_KEY)) || DEFAULT_SIZE;
    } catch {}
    textSize = SIZES.includes(saved) ? saved : DEFAULT_SIZE;
  }
  return textSize;
}

function subscribeSize(listener: () => void) {
  sizeListeners.add(listener);
  applySize(readTextSize());
  return () => {
    sizeListeners.delete(listener);
    if (sizeListeners.size === 0) document.documentElement.style.removeProperty("--read-size");
  };
}

function useTextSize() {
  const size = useSyncExternalStore(subscribeSize, readTextSize, () => DEFAULT_SIZE);

  const change = (step: -1 | 1) => {
    const next = SIZES[Math.min(SIZES.length - 1, Math.max(0, SIZES.indexOf(size) + step))];
    textSize = next;
    applySize(next);
    try {
      localStorage.setItem(SIZE_KEY, String(next));
    } catch {}
    sizeListeners.forEach((l) => l());
  };

  return { change, min: size === SIZES[0], max: size === SIZES[SIZES.length - 1] };
}

function timeLeft(p: number, minutes: number) {
  if (p >= 0.98) return "Selesai dibaca";
  return `Sisa ${Math.max(1, Math.round(minutes * (1 - p)))} menit`;
}

/** A−/A+ and minutes left. `rail` sits in the desktop sidebar; `bar` floats at the bottom on phones. */
export function ReaderControls({ minutes, variant }: { minutes: number; variant: "rail" | "bar" }) {
  const p = useProgress();
  const { change, min, max } = useTextSize();

  const buttons = (cls: string) => (
    <>
      <button type="button" onClick={() => change(-1)} disabled={min} aria-label="Kecilkan teks" className={cls}>
        A−
      </button>
      <button type="button" onClick={() => change(1)} disabled={max} aria-label="Besarkan teks" className={cls}>
        A+
      </button>
    </>
  );

  if (variant === "bar") {
    return (
      <div
        role="toolbar"
        aria-label="Pengaturan baca"
        className="glass sticky bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] z-30 mx-auto mt-6 flex w-max max-w-[calc(100%-2rem)] items-center gap-1 rounded-2xl border border-border p-1.5 shadow-[var(--shadow-2)] lg:hidden"
      >
        {buttons("rounded-[11px] px-3 py-2 text-sm font-semibold transition-colors hover:bg-surface disabled:opacity-40")}
        <span className="whitespace-nowrap px-2 text-[0.8125rem] text-foreground-muted tabular-nums">{timeLeft(p, minutes)}</span>
      </div>
    );
  }

  return (
    <div className="grid gap-2.5">
      <p className="text-[0.8125rem] font-bold text-foreground-muted">Ukuran teks</p>
      <div className="flex gap-1.5">
        {buttons(
          "flex-1 rounded-[10px] border border-border bg-surface-elevated py-2 font-semibold transition-colors hover:border-border-strong disabled:opacity-40",
        )}
      </div>
      <p className="text-[0.84375rem] text-foreground-muted tabular-nums">{timeLeft(p, minutes)}</p>
    </div>
  );
}
