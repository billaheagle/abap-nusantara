"use client";

import { useMemo, useState } from "react";
import { CopyButton, Field, Panel, Segmented } from "./primitives";
import { COMMON_FIELDS, convertAlphaBatch, type AlphaMode } from "@/lib/tools/alpha";

export function AlphaConverter() {
  const [mode, setMode] = useState<AlphaMode>("input");
  const [length, setLength] = useState(10);
  const [text, setText] = useState("4711\n000000000000004711\nABC123\n1000000");

  const rows = useMemo(() => convertAlphaBatch(text, mode, length), [text, mode, length]);
  const allOut = rows.map((r) => r.result).join("\n");

  return (
    <div className="space-y-5">
      <Panel>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <span className="mb-1 block text-xs font-medium text-foreground-muted">Direction</span>
            <Segmented<AlphaMode>
              value={mode}
              onChange={setMode}
              options={[
                { value: "input", label: "ALPHA input (add zeros)" },
                { value: "output", label: "ALPHA output (strip zeros)" },
                { value: "numc", label: "NUMC pad" },
              ]}
            />
          </div>
          <Field label="Field length">
            <input
              type="number"
              min={1}
              max={100}
              value={length}
              onChange={(e) => setLength(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
              className="tool-input w-24"
            />
          </Field>
          <select
            onChange={(e) => e.target.value && setLength(Number(e.target.value))}
            value=""
            className="tool-input w-auto"
          >
            <option value="">Common fields…</option>
            {COMMON_FIELDS.map((f) => (
              <option key={f.label} value={f.length}>{f.label}</option>
            ))}
          </select>
        </div>
        <p className="mt-3 text-xs text-foreground-muted">
          {mode === "input"
            ? "Purely numeric values are right-justified and zero-padded to the field length. Values containing letters are passed through untouched — exactly like CONVERSION_EXIT_ALPHA_INPUT."
            : mode === "output"
              ? "Leading zeros are removed from purely numeric values. Alphanumeric values are left as-is."
              : "Non-digits are stripped, then the value is left-padded with zeros to the field length (overflow is truncated from the left)."}
        </p>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Values (one per line)">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            spellCheck={false}
            className="tool-input tool-mono resize-y"
          />
        </Panel>
        <Panel title="Result" action={<CopyButton value={allOut} label="Copy all" />}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="admin-th text-left">
                  <th className="py-1.5 pr-3">Input</th>
                  <th className="py-1.5 pr-3">Output</th>
                  <th className="py-1.5">Note</th>
                </tr>
              </thead>
              <tbody className="font-mono text-[0.8125rem]">
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="py-1.5 pr-3 text-foreground-muted">{r.raw || "∅"}</td>
                    <td className="py-1.5 pr-3">{r.result || "∅"}</td>
                    <td className="py-1.5 font-sans text-xs text-foreground-muted">{r.note ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
