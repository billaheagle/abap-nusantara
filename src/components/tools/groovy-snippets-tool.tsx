"use client";

import { useMemo, useState } from "react";
import { CopyButton, Panel } from "./primitives";
import { CodeOutput } from "./code-output";
import { GROOVY_CATEGORIES, GROOVY_SNIPPETS } from "@/lib/tools/groovy-snippets";

export function GroovySnippetsTool() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("All");

  const snippets = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return GROOVY_SNIPPETS.filter((s) => {
      if (cat !== "All" && s.category !== cat) return false;
      if (!needle) return true;
      return [s.title, s.description, s.code, s.category].some((v) => v.toLowerCase().includes(needle));
    });
  }, [q, cat]);

  return (
    <div className="space-y-5">
      <Panel>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search snippets — 'header', 'json', 'exception', 'mpl'…" className="tool-input" />
        <div className="mt-3 flex flex-wrap gap-1.5 text-sm">
          {["All", ...GROOVY_CATEGORIES].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${cat === c ? "bg-brand text-white" : "bg-surface text-foreground-muted hover:bg-brand-tint hover:text-brand"}`}
            >
              {c}
            </button>
          ))}
        </div>
      </Panel>

      <div className="space-y-4">
        {snippets.map((s) => (
          <Panel key={s.title} title={s.title} action={<CopyButton value={s.code} />}>
            <p className="mb-2 text-sm text-foreground-muted">{s.description}</p>
            <CodeOutput code={s.code} lang="groovy" />
          </Panel>
        ))}
        {snippets.length === 0 && <p className="text-sm text-foreground-muted">No snippets match.</p>}
      </div>
    </div>
  );
}
