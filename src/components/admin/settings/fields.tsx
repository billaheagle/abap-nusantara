"use client";

import { createContext, useContext, useId, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { ICON_NAMES, SETTINGS_ICONS, type IconName } from "@/features/settings/icons";

export const fieldClass =
  "w-full rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40";

/** Validation messages from the last save, keyed by dotted path ("hero.badge", "experience.items.0.role"). */
export const IssuesContext = createContext<Record<string, string>>({});

export function useIssue(path?: string) {
  const issues = useContext(IssuesContext);
  return path ? issues[path] : undefined;
}

export function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="admin-card p-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      {description && <p className="mt-0.5 text-xs text-foreground-muted">{description}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export function Grid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

export function TextField({
  label,
  hint,
  value,
  onChange,
  path,
  multiline,
  rows = 3,
  mono,
  placeholder,
  type = "text",
  className,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  path?: string;
  multiline?: boolean;
  rows?: number;
  mono?: boolean;
  placeholder?: string;
  type?: "text" | "url" | "email" | "tel" | "number";
  className?: string;
}) {
  const id = useId();
  const error = useIssue(path);
  const cls = `${fieldClass} ${mono ? "font-mono" : ""} ${error ? "border-negative" : ""}`;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">{label}</label>
      {multiline ? (
        <textarea id={id} rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={cls} />
      ) : (
        <input id={id} type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={cls} />
      )}
      {error ? <p className="mt-1 text-xs text-negative">{error}</p> : hint && <p className="mt-1 text-xs text-foreground-muted">{hint}</p>}
    </div>
  );
}

export function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--brand)]" />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-foreground-muted">{hint}</span>}
      </span>
    </label>
  );
}

export function IconSelect({ value, onChange }: { value: IconName; onChange: (v: IconName) => void }) {
  const id = useId();
  const Icon = SETTINGS_ICONS[value];
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">Icon</label>
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-tint text-brand">
          <Icon className="h-4 w-4" />
        </span>
        <select id={id} value={value} onChange={(e) => onChange(e.target.value as IconName)} className={fieldClass}>
          {ICON_NAMES.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

/**
 * Repeatable group editor: add / remove / reorder items of any shape. Each item
 * renders in its own bordered box; `renderItem` receives a patch setter.
 */
export function ListEditor<T>({
  items,
  onChange,
  create,
  max,
  addLabel,
  itemTitle,
  renderItem,
  empty,
  hiding,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  create: () => T;
  max: number;
  addLabel: string;
  itemTitle: (item: T, index: number) => string;
  renderItem: (item: T, set: (patch: Partial<T>) => void, index: number) => ReactNode;
  empty?: string;
  /** Adds a show/hide button per item: hidden items stay saved but aren't shown on the site. */
  hiding?: { isHidden: (item: T) => boolean; setHidden: (item: T, hidden: boolean) => T };
}) {
  const move = (from: number, to: number) => {
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {items.length === 0 && empty && (
        <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-foreground-muted">{empty}</p>
      )}
      {items.map((item, i) => {
        const hidden = hiding?.isHidden(item) ?? false;
        return (
        <div key={i} className={`rounded-md border border-border ${hidden ? "border-dashed bg-surface/20" : "bg-surface/50"}`}>
          <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
            <p className={`min-w-0 truncate text-xs font-semibold text-foreground-muted ${hidden ? "opacity-60" : ""}`}>
              <span className="font-mono">#{i + 1}</span> · {itemTitle(item, i) || "Untitled"}
              {hidden && <span className="ml-2 rounded bg-surface px-1.5 py-0.5 text-[10px] uppercase tracking-wider">Hidden</span>}
            </p>
            <div className="flex shrink-0 items-center gap-1">
              {hiding && (
                <button
                  type="button"
                  className="admin-btn admin-btn-icon"
                  onClick={() => onChange(items.map((it, j) => (j === i ? hiding.setHidden(it, !hidden) : it)))}
                  aria-pressed={hidden}
                  aria-label={hidden ? "Show on site" : "Hide from site"}
                  title={hidden ? "Show on site" : "Hide from site"}
                >
                  {hidden ? <EyeOff /> : <Eye />}
                </button>
              )}
              <button type="button" className="admin-btn admin-btn-icon" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label="Move up" title="Move up">
                <ArrowUp />
              </button>
              <button type="button" className="admin-btn admin-btn-icon" disabled={i === items.length - 1} onClick={() => move(i, i + 1)} aria-label="Move down" title="Move down">
                <ArrowDown />
              </button>
              <button type="button" className="admin-btn admin-btn-icon admin-btn-negative" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Remove" title="Remove">
                <Trash2 />
              </button>
            </div>
          </div>
          <div className="space-y-4 p-3">
            {renderItem(item, (patch) => onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it))), i)}
          </div>
        </div>
        );
      })}
      <button type="button" className="admin-btn admin-btn-brand" disabled={items.length >= max} onClick={() => onChange([...items, create()])}>
        <Plus /> {addLabel}
      </button>
    </div>
  );
}
