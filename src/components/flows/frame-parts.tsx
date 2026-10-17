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

/**
 * The three panels. On a wide screen they sit side by side; on a phone they'd
 * stack into a column taller than the screen, so they become tabs over one
 * panel (sized for the longest text of any slot). A dot marks a tab whose
 * value changed at this frame, so changes aren't missed on hidden tabs.
 */
export function SlotPanels({
  slots,
  allValues,
  values,
  previous,
}: {
  slots: { title: string; note: string }[];
  /** Every value each slot can show, across all frames. */
  allValues: string[][];
  values: string[];
  /** The previous frame's values, to mark what changed. */
  previous?: string[];
}) {
  const [tab, setTab] = useState(0);
  const union = distinct(allValues.flat());
  return (
    <>
      <div className="mt-2.5 hidden gap-2 sm:grid sm:grid-cols-3">
        {slots.map((s, i) => (
          <SlotBox key={s.title} title={s.title} note={s.note} values={allValues[i]} value={values[i]} />
        ))}
      </div>
      <div className="mt-2.5 sm:hidden">
        <div role="tablist" aria-label="Isi pesan" className="mb-1.5 grid grid-cols-3 gap-1 rounded-[12px] border border-ink-border bg-ink-elevated p-1">
          {slots.map((s, i) => {
            const on = i === tab;
            const changed = !!previous && previous[i] !== values[i];
            return (
              <button
                key={s.title}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setTab(i)}
                className={`relative min-w-0 cursor-pointer truncate rounded-[9px] px-2 py-1.5 text-xs font-bold transition-colors ${
                  on ? "bg-[#2a3180] text-ink-foreground" : "text-ink-foreground-muted"
                }`}
              >
                {s.title}
                {changed && !on && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-kunyit" aria-label="berubah" />}
              </button>
            );
          })}
        </div>
        <div className="rounded-[14px] border border-ink-border bg-ink-elevated px-3 py-2.5">
          <p className="mb-1.5 text-right text-xs font-medium text-ink-foreground-muted opacity-80">
            <Stack texts={distinct(slots.map((s) => s.note))} current={slots[tab].note} render={(t) => t} />
          </p>
          <pre className="m-0 whitespace-pre-wrap font-mono text-xs leading-normal text-ink-foreground [overflow-wrap:anywhere]">
            <Stack texts={union} current={values[tab]} render={(t) => t} />
          </pre>
        </div>
      </div>
    </>
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
