"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ClipboardCopy, Monitor, Smartphone, Wand2 } from "lucide-react";
import { FlowPlayer } from "@/components/flows/flow-player";
import { validateFlowAction } from "@/features/flows/actions";
import { formatFlow } from "@/lib/flows/format";
import type { FlowSpec } from "@/lib/flows/types";
import { ObjectStatus } from "./admin-ui";

export interface FlowSource {
  slug: string;
  title: string;
  status: string;
  source: string;
}

type Result = { ok: true; spec: FlowSpec } | { ok: false; error: string };

const WIDTHS = { desktop: "100%", phone: "390px" } as const;

/** A short hash of the spec, so the player remounts (and restarts) whenever it changes. */
function hash(spec: FlowSpec): string {
  const s = JSON.stringify(spec);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/**
 * Write or paste a ```flow block, see it validated as you type (the
 * importer's own schema, on the server) and play it at desktop or phone
 * width. Load an article's block to start from, format it the way the guide
 * asks, and copy it back as a markdown block.
 */
export function FlowWorkbench({ articles, initial }: { articles: FlowSource[]; initial: string }) {
  const [source, setSource] = useState(initial);
  const [result, setResult] = useState<Result | null>(null);
  const [lastGood, setLastGood] = useState<FlowSpec | null>(null);
  const [width, setWidth] = useState<keyof typeof WIDTHS>("desktop");
  const [copied, setCopied] = useState(false);
  const latest = useRef(0);

  // Validate shortly after typing stops; only the newest answer counts.
  useEffect(() => {
    const id = ++latest.current;
    const t = setTimeout(async () => {
      const r = await validateFlowAction(source);
      if (id !== latest.current) return;
      setResult(r);
      if (r.ok) setLastGood(r.spec);
    }, 400);
    return () => clearTimeout(t);
  }, [source]);

  const frames = result?.ok ? result.spec.scenarios.reduce((n, s) => n + s.frames.length, 0) : 0;

  async function copyMarkdown() {
    await navigator.clipboard.writeText("```flow\n" + source.trim() + "\n```\n");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const button =
    "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface-elevated px-3 py-1.5 text-sm font-semibold transition-colors hover:border-border-strong disabled:cursor-default disabled:opacity-50";

  return (
    <div className="grid gap-6 px-6 pb-8 sm:px-8 xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <section aria-label="Editor" className="min-w-0">
        <div className="mb-2.5 flex flex-wrap items-center gap-2">
          <select
            aria-label="Load a flow from an article"
            defaultValue=""
            onChange={(e) => {
              const a = articles.find((x) => x.slug === e.target.value);
              if (a) setSource(a.source);
            }}
            className="min-w-0 flex-1 rounded-lg border border-border bg-surface-elevated px-3 py-1.5 text-sm"
          >
            <option value="" disabled>
              Load from an article…
            </option>
            {articles.map((a) => (
              <option key={a.slug} value={a.slug}>
                {a.title}
                {a.status === "PUBLISHED" ? "" : ` (${a.status.toLowerCase()})`}
              </option>
            ))}
          </select>
          <button type="button" onClick={() => result?.ok && setSource(formatFlow(result.spec))} disabled={!result?.ok} className={button}>
            <Wand2 className="h-4 w-4" aria-hidden="true" /> Format
          </button>
          <button type="button" onClick={copyMarkdown} className={button}>
            {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <ClipboardCopy className="h-4 w-4" aria-hidden="true" />}
            {copied ? "Copied" : "Copy as markdown"}
          </button>
        </div>
        <textarea
          aria-label="Flow block JSON"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          spellCheck={false}
          className="h-[68vh] min-h-[22rem] w-full resize-y rounded-xl border border-border bg-surface-elevated p-3 font-mono text-xs leading-relaxed outline-none focus:border-brand"
        />
        <div aria-live="polite" className="mt-2 min-h-[2.5rem] text-sm">
          {!result ? (
            <span className="text-foreground-muted">Checking…</span>
          ) : result.ok ? (
            <ObjectStatus tone="positive">
              Valid: {result.spec.scenarios.length} scenario{result.spec.scenarios.length === 1 ? "" : "s"}, {frames} frames
            </ObjectStatus>
          ) : (
            <div className="rounded-lg border border-accent-red/40 bg-accent-red-tint px-3 py-2 font-mono text-xs text-accent-red">{result.error}</div>
          )}
        </div>
      </section>

      <section aria-label="Preview" className="min-w-0">
        <div className="mb-2.5 flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground-muted">Preview</span>
          {result && !result.ok && lastGood && <ObjectStatus tone="critical">showing the last valid version</ObjectStatus>}
          <span className="ml-auto inline-flex rounded-lg border border-border bg-surface-elevated p-0.5" role="group" aria-label="Preview width">
            {(["desktop", "phone"] as const).map((w) => {
              const Icon = w === "desktop" ? Monitor : Smartphone;
              return (
                <button
                  key={w}
                  type="button"
                  aria-pressed={width === w}
                  onClick={() => setWidth(w)}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${
                    width === w ? "bg-brand text-white" : "text-foreground-muted"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {w === "desktop" ? "Desktop" : "Phone (390px)"}
                </button>
              );
            })}
          </span>
        </div>
        <div className="rounded-xl border border-dashed border-border bg-surface p-3">
          <div className="mx-auto max-w-full" style={{ width: WIDTHS[width] }}>
            {lastGood ? (
              // Remount on every valid change so playback starts from the top.
              <FlowPlayer key={`${width}-${hash(lastGood)}`} spec={lastGood} />
            ) : (
              <p className="py-16 text-center text-sm text-foreground-muted">The preview appears once the block is valid.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
