"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

export { CopyButton } from "./copy-button";

export function Panel({ title, action, children, className = "" }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`tool-panel p-4 sm:p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title && <h2 className="text-sm font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-foreground-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-foreground-muted">{hint}</span>}
    </label>
  );
}

// Phone-layout box model of Segmented, in px: button padding (px-2.5 ×2),
// gap-1 between buttons, root padding p-1 ×2 plus a 1px border each side.
const SEG_PAD = 20;
const SEG_GAP = 4;
const SEG_FRAME = 10;

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  fill = true,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  /** On phones, stretch to the full row width (false keeps it compact, e.g. inside a panel header). */
  fill?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [template, setTemplate] = useState(`repeat(${options.length}, minmax(max-content, 1fr))`);
  const labelKey = options.map((o) => o.label).join("|");

  // Phones: fill the row with no empty space on the right. One row when every
  // label fits (spare width shared evenly); otherwise the most columns that
  // still fill every row completely (6 options → 3×2); otherwise one per row.
  // Label spans are inline + nowrap, so they report the text's natural width
  // whatever the current layout.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !fill) return;
    const measure = () => {
      const widths = [...root.querySelectorAll<HTMLElement>("[data-seg-label]")].map((l) => l.getBoundingClientRect().width);
      const n = widths.length;
      const avail = root.getBoundingClientRect().width - SEG_FRAME;
      const row = (cells: number, content: number) => content + cells * SEG_PAD + (cells - 1) * SEG_GAP;
      if (row(n, widths.reduce((a, b) => a + b, 0)) <= avail) {
        setTemplate(`repeat(${n}, minmax(max-content, 1fr))`);
        return;
      }
      const widest = Math.max(...widths);
      for (let cols = n - 1; cols >= 2; cols--) {
        if (n % cols === 0 && row(cols, cols * widest) <= avail) {
          setTemplate(`repeat(${cols}, minmax(0, 1fr))`);
          return;
        }
      }
      setTemplate("minmax(0, 1fr)");
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    return () => ro.disconnect();
  }, [fill, labelKey]);

  const layout = fill
    ? "grid w-full grid-cols-[var(--seg-cols)] sm:inline-flex sm:w-auto sm:flex-wrap"
    : "inline-flex flex-wrap";

  return (
    <div
      ref={rootRef}
      style={{ "--seg-cols": template } as CSSProperties}
      className={`${layout} gap-1 rounded-lg border border-border bg-surface-elevated p-1 text-sm`}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`whitespace-nowrap rounded-md py-1.5 font-medium transition-colors ${fill ? "px-2.5 sm:px-3" : "px-3"} ${
            value === o.value ? "bg-brand text-white" : "text-foreground-muted hover:bg-surface"
          }`}
        >
          <span data-seg-label>{o.label}</span>
        </button>
      ))}
    </div>
  );
}
