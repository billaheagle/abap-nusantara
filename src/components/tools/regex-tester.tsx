"use client";

import { useMemo, useState } from "react";
import { CopyButton, Field, Panel } from "./primitives";

const ABAP_PATTERNS = [
  { label: "SAP material (numeric)", pattern: "^\\d{1,18}$" },
  { label: "Email", pattern: "^[\\w.+-]+@[\\w-]+\\.[\\w.-]+$" },
  { label: "IBAN (loose)", pattern: "^[A-Z]{2}\\d{2}[A-Z0-9]{11,30}$" },
  { label: "ISO date YYYY-MM-DD", pattern: "^(\\d{4})-(\\d{2})-(\\d{2})$" },
  { label: "Transport request", pattern: "^[A-Z0-9]{3}K9\\d{5}$" },
  { label: "Trim internal whitespace", pattern: "\\s{2,}" },
];

interface MatchInfo {
  match: string;
  index: number;
  groups: string[];
  named: Record<string, string>;
}

export function RegexTester() {
  const [pattern, setPattern] = useState("(\\d{4})-(\\d{2})-(\\d{2})");
  const [flags, setFlags] = useState("g");
  const [text, setText] = useState("Delivery 2026-09-03, invoice 2026-10-15 — see note 2026-11-01.");
  const [replacement, setReplacement] = useState("$3/$2/$1");

  const result = useMemo<{ matches: MatchInfo[]; error: string | null; replaced: string }>(() => {
    if (!pattern) return { matches: [], error: null, replaced: text };
    try {
      const re = new RegExp(pattern, flags.includes("g") ? flags : flags + "g");
      const matches: MatchInfo[] = [];
      let m: RegExpExecArray | null;
      let guard = 0;
      while ((m = re.exec(text)) && guard++ < 5000) {
        matches.push({
          match: m[0],
          index: m.index,
          groups: m.slice(1).map((g) => g ?? ""),
          named: { ...(m.groups ?? {}) },
        });
        if (m[0] === "") re.lastIndex++;
      }
      const singleRe = new RegExp(pattern, flags);
      const replaced = text.replace(singleRe, replacement);
      return { matches, error: null, replaced };
    } catch (e) {
      return { matches: [], error: e instanceof Error ? e.message : "Invalid pattern", replaced: text };
    }
  }, [pattern, flags, text, replacement]);

  const highlighted = useMemo(() => {
    if (result.error || result.matches.length === 0) return [{ text, hit: false }];
    const parts: { text: string; hit: boolean }[] = [];
    let cursor = 0;
    for (const m of result.matches) {
      if (m.index > cursor) parts.push({ text: text.slice(cursor, m.index), hit: false });
      parts.push({ text: m.match, hit: true });
      cursor = m.index + m.match.length;
    }
    if (cursor < text.length) parts.push({ text: text.slice(cursor), hit: false });
    return parts;
  }, [text, result]);

  return (
    <div className="space-y-5">
      <Panel>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_8rem]">
          <Field label="Pattern"><input value={pattern} onChange={(e) => setPattern(e.target.value)} spellCheck={false} className="tool-input tool-mono" /></Field>
          <Field label="Flags"><input value={flags} onChange={(e) => setFlags(e.target.value.replace(/[^gimsuy]/g, ""))} spellCheck={false} className="tool-input tool-mono" /></Field>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {ABAP_PATTERNS.map((p) => (
            <button key={p.label} type="button" onClick={() => setPattern(p.pattern)} className="rounded-md bg-surface px-2 py-1 text-[11px] text-foreground-muted hover:bg-brand-tint hover:text-brand">
              {p.label}
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="Test string">
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} spellCheck={false} className="tool-input tool-mono resize-y" />
      </Panel>

      {result.error ? (
        <Panel><p className="text-sm text-negative">{result.error}</p></Panel>
      ) : (
        <>
          <Panel title={`${result.matches.length} match${result.matches.length === 1 ? "" : "es"}`}>
            <p className="tool-output">
              {highlighted.map((p, i) =>
                p.hit ? (
                  <mark key={i} style={{ background: "rgb(224 165 39 / 0.4)", color: "inherit" }}>
                    {p.text}
                  </mark>
                ) : (
                  <span key={i}>{p.text}</span>
                ),
              )}
            </p>
            {result.matches.length > 0 && (result.matches[0].groups.length > 0 || Object.keys(result.matches[0].named).length > 0) && (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="admin-th text-left">
                      <th className="px-2 py-1.5">#</th>
                      <th className="px-2 py-1.5">Match</th>
                      <th className="px-2 py-1.5">Groups</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-[0.8125rem]">
                    {result.matches.slice(0, 50).map((m, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="px-2 py-1.5 text-foreground-muted">{i + 1}</td>
                        <td className="px-2 py-1.5">{m.match}</td>
                        <td className="px-2 py-1.5 text-foreground-muted">
                          {m.groups.map((g, gi) => `$${gi + 1}=${g}`).join("  ")}
                          {Object.entries(m.named).map(([k, v]) => `  ?<${k}>=${v}`).join("")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel title="Replace" action={<CopyButton value={result.replaced} />}>
            <Field label="Replacement (first match; $1, $2, $<name>)">
              <input value={replacement} onChange={(e) => setReplacement(e.target.value)} spellCheck={false} className="tool-input tool-mono" />
            </Field>
            <pre className="tool-output mt-3">{result.replaced}</pre>
          </Panel>
        </>
      )}

      <Panel title="ABAP note">
        <ul className="space-y-1.5 text-sm text-foreground-muted">
          <li>• ABAP 7.5x uses the <span className="font-medium text-foreground">PCRE2</span> engine (<code className="tool-code">... IN ... PCRE</code>). The classic <code className="tool-code">REGEX</code> option (POSIX) is deprecated.</li>
          <li>• Named groups <code className="tool-code">(?&lt;name&gt;…)</code>, non-greedy <code className="tool-code">*?</code> and lookarounds work the same as here.</li>
          <li>• PCRE2 adds possessive quantifiers <code className="tool-code">*+</code>, atomic groups <code className="tool-code">(?&gt;…)</code> and <code className="tool-code">\K</code> — this JavaScript tester does not.</li>
          <li>• In ABAP, <code className="tool-code">FIND ALL OCCURRENCES … RESULTS DATA(lt_res)</code> gives offset/length per match and per submatch.</li>
        </ul>
      </Panel>
    </div>
  );
}
