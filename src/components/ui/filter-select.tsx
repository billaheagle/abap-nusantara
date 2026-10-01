"use client";

import { Fragment, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

export interface FilterOption {
  value: string;
  label: string;
  /** Rendered under a thin divider, e.g. "Not in a series". */
  separated?: boolean;
}

/**
 * Styled replacement for a native <select> in filter bars (admin and public).
 *
 * - Trigger shows an icon + current label; turns brand-tinted when a
 *   non-default value is active so applied filters are visible at a glance.
 * - Listbox with checkmark, keyboard navigation (↑ ↓ Home End Enter Esc) and
 *   an optional search box for long lists (tags, series).
 */
export function FilterSelect({
  value,
  onChange,
  options,
  icon,
  defaultValue = "",
  searchable = false,
  label,
  align = "left",
}: {
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  icon?: ReactNode;
  defaultValue?: string;
  searchable?: boolean;
  /** Accessible name for the control, e.g. "Status". */
  label: string;
  /** Which edge the panel aligns to — "right" for controls near the right edge. */
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const selected = options.find((o) => o.value === value) ?? options[0];
  const isActive = value !== defaultValue;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // On open: focus the search box (or the list for keyboard nav).
  useEffect(() => {
    if (open) (searchable ? searchRef.current : listRef.current)?.focus();
  }, [open, searchable]);

  // Keep the highlighted option in view.
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  function openMenu() {
    const i = options.findIndex((o) => o.value === value);
    setActiveIndex(i >= 0 ? i : 0);
    setOpen(true);
  }

  function close() {
    setOpen(false);
    setQuery("");
    triggerRef.current?.focus();
  }

  function choose(v: string) {
    close();
    if (v !== value) onChange(v);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(visible.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(visible.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = visible[activeIndex];
      if (opt) choose(opt.value);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Tab") {
      setOpen(false);
      setQuery("");
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${label}: ${selected?.label}`}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault();
            openMenu();
          }
        }}
        className={`filter-select-trigger ${isActive ? "is-active" : ""} ${open ? "is-open" : ""}`}
      >
        {icon && <span className="filter-select-icon">{icon}</span>}
        <span className="max-w-[11rem] truncate">{selected?.label}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 opacity-60 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className={`filter-select-panel ${align === "right" ? "align-right" : ""}`} onKeyDown={onKeyDown}>
          {searchable && (
            <div className="relative border-b border-border p-1.5">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-muted" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                placeholder={`Search ${label.toLowerCase()}…`}
                aria-controls={listId}
                aria-activedescendant={visible[activeIndex] ? `${listId}-${activeIndex}` : undefined}
                className="w-full rounded-md bg-surface py-1.5 pl-7 pr-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
            </div>
          )}
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            tabIndex={-1}
            aria-label={label}
            aria-activedescendant={visible[activeIndex] ? `${listId}-${activeIndex}` : undefined}
            className="max-h-64 overflow-y-auto p-1 focus:outline-none"
          >
            {visible.map((o, i) => {
              const isSelected = o.value === value;
              return (
                <Fragment key={o.value}>
                  {o.separated && <li role="separator" className="mx-2 my-1 border-t border-border" />}
                  <li
                    id={`${listId}-${i}`}
                    data-index={i}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIndex(i)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => choose(o.value)}
                    className={`filter-select-option ${i === activeIndex ? "is-highlighted" : ""} ${isSelected ? "is-selected" : ""}`}
                  >
                    <span className="truncate">{o.label}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </li>
                </Fragment>
              );
            })}
            {visible.length === 0 && <li className="px-3 py-2 text-sm text-foreground-muted">No matches</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
