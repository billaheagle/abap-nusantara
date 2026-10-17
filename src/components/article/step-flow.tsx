"use client";

import { useState } from "react";
import { Check, Copy, GitBranch } from "lucide-react";
import { parseStepFlow, stepType, type StepRow } from "@/lib/editor/step-flow";
import { copyToClipboard } from "./code-block";

/**
 * A ```text sketch of iFlow steps (see lib/editor/step-flow.ts) drawn as a
 * step list: one rail per nesting level, a dot coloured by step type, the
 * step name in mono with its prefix tinted, notes beside it (under it on a
 * phone), router branches indented. Copy still gives the original text.
 */

const TONE: Record<string, string> = {
  script: "#4f5bd5",
  modifier: "#0f8a7a",
  call: "#c27c0e",
  process: "#7c4dcc",
  router: "#d0611b",
  store: "#1f8f4e",
  split: "#0e7c9a",
  sign: "#c03a7b",
  error: "#d1434e",
  event: "#7a8094",
  step: "#7a8094",
};

const INDENT = 22;
const BRANCH = "#c27c0e";

function Name({ name }: { name: string }) {
  const { tone, title } = stepType(name);
  const cut = name.indexOf("_");
  if (cut < 0 || name.startsWith("End_")) return <span className="font-semibold text-foreground">{name}</span>;
  return (
    <span className="font-semibold text-foreground" title={title}>
      <span style={{ color: TONE[tone] }}>{name.slice(0, cut + 1)}</span>
      {name.slice(cut + 1)}
    </span>
  );
}

function Marker({ row }: { row: StepRow }) {
  if (row.kind === "branch") return <GitBranch className="h-3.5 w-3.5" style={{ color: BRANCH }} aria-hidden="true" />;
  if (row.kind === "event" || row.kind === "more")
    return <span className="block h-2.5 w-2.5 rounded-full border-2 border-foreground-muted bg-surface-elevated" aria-hidden="true" />;
  const { tone } = stepType(row.name);
  return <span className="block h-2.5 w-2.5 rounded-[3px]" style={{ background: TONE[tone] }} aria-hidden="true" />;
}

function Row({ row, last }: { row: StepRow; last: boolean }) {
  const left = 12 + row.depth * INDENT;
  return (
    <li
      className={`relative ${row.kind === "section" ? "border-t border-dashed border-border pt-3" : ""}`}
      style={{ paddingLeft: left + 18, marginTop: row.kind === "section" ? "0.75rem" : 0, listStyle: "none" }}
    >
      {/* Rails for this level and every level above it. */}
      {Array.from({ length: row.depth + 1 }, (_, d) => (
        <span
          key={d}
          aria-hidden="true"
          className="absolute w-px bg-border-strong"
          style={{ left: 12 + d * INDENT + 4.5, top: d === row.depth && row.kind === "section" ? "50%" : 0, bottom: last && d === row.depth ? "50%" : 0 }}
        />
      ))}
      <span className="absolute grid h-[1.6rem] w-2.5 place-items-center" style={{ left: left - (row.kind === "branch" ? 2 : 0) }}>
        <Marker row={row} />
      </span>
      <div className="flex min-h-[1.6rem] flex-wrap items-baseline gap-x-2.5 gap-y-0.5 py-[0.2rem]">
        {row.kind === "branch" ? (
          <span className="font-sans text-[0.8125rem] font-semibold" style={{ color: BRANCH }}>
            {row.name}
          </span>
        ) : row.kind === "event" && !row.name.startsWith("End_") ? (
          <span className="font-semibold text-foreground-muted">{row.name}</span>
        ) : row.kind === "more" ? (
          <span className="text-foreground-muted">…</span>
        ) : (
          <Name name={row.name} />
        )}
        {row.note && (
          <span className="min-w-0 basis-full text-[0.78rem] leading-snug text-foreground-muted [overflow-wrap:anywhere] sm:basis-auto sm:flex-1">
            {row.note}
          </span>
        )}
      </div>
    </li>
  );
}

export function StepFlow({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const rows = parseStepFlow(code);

  async function copy() {
    await copyToClipboard(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="my-6 overflow-hidden rounded-[16px] border border-border bg-surface-elevated shadow-[var(--shadow-1)]">
      <div className="flex items-center justify-between border-b border-border bg-surface px-3.5 py-2 font-sans">
        <span className="text-xs font-semibold text-foreground-muted">Urutan step</span>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Teks tersalin" : "Salin teks"}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-foreground-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          <span>{copied ? "Tersalin" : "Salin"}</span>
        </button>
      </div>
      <ol className="m-0 px-2 py-2.5 font-mono text-[0.8125rem] leading-relaxed sm:px-3" style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
        {rows.map((r, i) => (
          <Row key={i} row={r} last={i === rows.length - 1 || rows[i + 1].depth < r.depth || rows[i + 1].kind === "section"} />
        ))}
      </ol>
    </div>
  );
}
