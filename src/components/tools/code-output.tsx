"use client";

import { useEffect, useMemo, useState } from "react";
import type { HighlighterCore } from "shiki/core";
import { tokenStyle } from "@/components/article/code-block";
import { CODE_THEME } from "@/lib/editor/highlight-theme";

/**
 * Syntax-highlighted output for the developer tools.
 *
 * Articles are highlighted on the server, but tool output changes on every
 * keystroke in the browser, so this tokenizes client-side. The highlighter is
 * a fine-grained Shiki core build (only the languages below + the same theme
 * as articles), loaded lazily on first use and shared by every block. It uses
 * Shiki's JavaScript regex engine rather than the Oniguruma WASM build, which
 * the production CSP (no 'wasm-unsafe-eval') would block.
 */

export type CodeLang = "abap" | "groovy" | "json" | "xml";

// Above this size, tokenizing on every keystroke gets sluggish — show plain text.
const MAX_HIGHLIGHT_CHARS = 50_000;

let highlighterPromise: Promise<HighlighterCore> | null = null;

function loadHighlighter() {
  highlighterPromise ??= (async () => {
    const [{ createHighlighterCore }, { createJavaScriptRegexEngine }] = await Promise.all([
      import("shiki/core"),
      import("shiki/engine/javascript"),
    ]);
    return createHighlighterCore({
      themes: [import("shiki/themes/dark-plus.mjs")],
      langs: [
        import("shiki/langs/abap.mjs"),
        import("shiki/langs/groovy.mjs"),
        import("shiki/langs/json.mjs"),
        import("shiki/langs/xml.mjs"),
      ],
      engine: createJavaScriptRegexEngine({ forgiving: true }),
    });
  })();
  return highlighterPromise;
}

function useHighlighter() {
  const [highlighter, setHighlighter] = useState<HighlighterCore | null>(null);
  useEffect(() => {
    let alive = true;
    loadHighlighter()
      .then((h) => alive && setHighlighter(h))
      .catch(() => {
        // Stay on plain text if the grammar chunks fail to load.
        highlighterPromise = null;
      });
    return () => {
      alive = false;
    };
  }, []);
  return highlighter;
}

export function CodeOutput({ code, lang, className = "" }: { code: string; lang: CodeLang; className?: string }) {
  const highlighter = useHighlighter();

  const lines = useMemo(() => {
    if (!highlighter || code.length > MAX_HIGHLIGHT_CHARS) return null;
    try {
      return highlighter.codeToTokens(code, { lang, theme: CODE_THEME }).tokens;
    } catch {
      return null;
    }
  }, [highlighter, code, lang]);

  return (
    <pre className={`tool-output ${className}`}>
      {lines
        ? lines.map((line, i) => (
            <span key={i}>
              {line.map((t, j) => (
                <span key={j} style={tokenStyle(t.color, t.fontStyle || undefined)}>
                  {t.content}
                </span>
              ))}
              {i < lines.length - 1 && "\n"}
            </span>
          ))
        : code}
    </pre>
  );
}
