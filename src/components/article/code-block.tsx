"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { HighlightedCode } from "@/lib/editor/highlight";

const LANG_LABELS: Record<string, string> = {
  js: "JavaScript",
  javascript: "JavaScript",
  ts: "TypeScript",
  typescript: "TypeScript",
  groovy: "Groovy",
  abap: "ABAP",
  bash: "Bash",
  sh: "Shell",
  shell: "Shell",
  json: "JSON",
  xml: "XML",
  sql: "SQL",
  yaml: "YAML",
  yml: "YAML",
  html: "HTML",
  css: "CSS",
  java: "Java",
  python: "Python",
  py: "Python",
};

export function tokenStyle(color?: string, fontStyle?: number): React.CSSProperties | undefined {
  if (!color && !fontStyle) return undefined;
  return {
    color,
    fontStyle: fontStyle && fontStyle & 1 ? "italic" : undefined,
    fontWeight: fontStyle && fontStyle & 2 ? 700 : undefined,
    textDecoration: fontStyle && fontStyle & 4 ? "underline" : undefined,
  };
}

export function CodeBlock({ code, language, highlighted }: { code: string; language?: string | null; highlighted?: HighlightedCode }) {
  const [copied, setCopied] = useState(false);
  const lang = language?.trim().toLowerCase() || "";
  const label = LANG_LABELS[lang] ?? (lang ? lang.toUpperCase() : "Code");

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Fallback for non-secure contexts (e.g. LAN IP during dev).
      const ta = document.createElement("textarea");
      ta.value = code;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="code-block" style={highlighted?.bg ? { background: highlighted.bg } : undefined}>
      <div className="code-block-header">
        <span className="code-block-lang">{label}</span>
        <button type="button" onClick={copy} className="code-block-copy" aria-label={copied ? "Copied" : "Copy code"}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          <span>{copied ? "Copied!" : "Copy"}</span>
        </button>
      </div>
      <pre style={highlighted?.fg ? { color: highlighted.fg } : undefined}>
        <code>
          {highlighted
            ? highlighted.lines.map((line, i) => (
                <span key={i} className="code-line">
                  {line.map((t, j) => (
                    <span key={j} style={tokenStyle(t.color, t.fontStyle)}>
                      {t.content}
                    </span>
                  ))}
                  {"\n"}
                </span>
              ))
            : code}
        </code>
      </pre>
    </div>
  );
}
