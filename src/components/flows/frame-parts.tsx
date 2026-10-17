"use client";

import { Fragment, useEffect, useRef, useState } from "react";

/**
 * Pieces shared by the flow player and its lazy shell. Every text that can
 * appear in a spot (all frames, all scenarios) is stacked in one grid cell
 * and only the current one is visible, so each spot is as tall as its longest
 * text from the start: stepping through frames never changes the figure's
 * height, and nothing around it moves.
 */

/** "**bold** rest" → step names in bold. */
export function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <b key={i}>{part}</b> : <Fragment key={i}>{part}</Fragment>))}
    </>
  );
}

/** Distinct texts in order, so repeated values are stacked once. */
export function distinct(texts: string[]): string[] {
  return [...new Set(texts)];
}

export function Stack({ texts, current, render }: { texts: string[]; current: string; render: (text: string) => React.ReactNode }) {
  return (
    <span className="grid">
      {texts.map((t) => (
        <span key={t} className={`col-start-1 row-start-1 ${t === current ? "" : "invisible"}`} aria-hidden={t === current ? undefined : true}>
          {render(t)}
        </span>
      ))}
    </span>
  );
}

export function SlotBox({ title, note, values, value }: { title: string; note: string; values: string[]; value: string }) {
  const [flash, setFlash] = useState(false);
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current === value) return;
    prev.current = value;
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 1100);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div className="min-w-0 rounded-[14px] border border-ink-border bg-ink-elevated px-3 py-2.5">
      <p className="mb-1.5 flex justify-between gap-1.5 text-xs font-bold text-ink-foreground-muted">
        {title} <span className="text-right font-medium opacity-80">{note}</span>
      </p>
      <pre
        className={`m-0 whitespace-pre-wrap font-mono text-xs leading-normal [overflow-wrap:anywhere] transition-colors duration-500 ${
          flash ? "text-kunyit" : "text-ink-foreground"
        }`}
      >
        <Stack texts={values} current={value} render={(t) => t} />
      </pre>
    </div>
  );
}
