"use client";

import Link from "next/link";
import { useId, useState } from "react";

const LENGTH = 10;

/** A pocket version of the ALPHA tool, so the home page shows what a tool does instead of describing it. */
export function AlphaTry() {
  const [mode, setMode] = useState<"in" | "out">("in");
  const [value, setValue] = useState("4711");
  const inputId = useId();

  const v = value.trim();
  let pad = "";
  let shown = v;
  if (v && mode === "in") {
    if (/^\d+$/.test(v) && v.length <= LENGTH) pad = "0".repeat(LENGTH - v.length);
    else shown = v.toUpperCase().slice(0, LENGTH);
  } else if (v && /^\d+$/.test(v)) {
    shown = v.replace(/^0+/, "") || "0";
  }

  const choose = (m: "in" | "out") => {
    setMode(m);
    setValue(m === "in" ? "4711" : "0000004711");
  };

  return (
    <div className="flex flex-col gap-3.5 rounded-[24px] bg-ink p-6 text-ink-foreground">
      <h3 className="text-[1.375rem] font-bold tracking-[-0.02em]">ALPHA converter</h3>
      <p className="text-[0.9375rem] text-ink-foreground-muted">Sama seperti CONVERSION_EXIT_ALPHA_INPUT dan _OUTPUT.</p>
      <div role="group" aria-label="Arah konversi" className="flex gap-1 self-start rounded-xl bg-ink-elevated p-1">
        {(["in", "out"] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => choose(m)}
            className="rounded-[9px] px-3 py-1.5 text-[0.8125rem] font-semibold text-ink-foreground-muted aria-pressed:bg-ink-foreground aria-pressed:text-ink"
          >
            {m === "in" ? "Input" : "Output"}
          </button>
        ))}
      </div>
      <div className="grid gap-1.5">
        <label htmlFor={inputId} className="text-[0.8125rem] font-semibold text-ink-foreground-muted">
          Nomor (panjang {LENGTH})
        </label>
        <input
          id={inputId}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          className="w-full min-w-0 rounded-xl border border-ink-border bg-ink-elevated px-3.5 py-3 font-mono text-lg text-ink-foreground focus:border-kunyit focus:shadow-[0_0_0_4px_rgb(242_182_50/0.15)] focus:outline-none"
        />
      </div>
      <output aria-live="polite" className="rounded-xl bg-ink-elevated px-3.5 py-3 font-mono text-[1.375rem] font-semibold tracking-wide text-kunyit [overflow-wrap:anywhere]">
        {v ? (
          <>
            <span className="text-[#8a91c9]">{pad}</span>
            {shown}
          </>
        ) : (
          <span className="text-[#8a91c9]">Ketik nomor</span>
        )}
      </output>
      <Link href="/tools/alpha-converter" className="text-sm font-semibold text-ink-foreground underline decoration-kunyit underline-offset-[3px]">
        Buka versi lengkap, termasuk mode batch
      </Link>
    </div>
  );
}
