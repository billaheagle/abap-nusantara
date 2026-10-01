import { bundledLanguages, bundledLanguagesAlias, codeToTokens } from "shiki";
import { CODE_THEME } from "./highlight-theme";

/**
 * Server-side syntax highlighting for article code blocks.
 *
 * We tokenize with Shiki (VS Code's own TextMate grammars + the Dark+ theme)
 * and attach plain token data to each codeBlock node. The client renderer
 * turns those tokens into <span>s, so stored content still never goes
 * through an HTML string — and Shiki's grammars never reach the browser.
 */

export interface HighlightToken {
  content: string;
  color?: string;
  fontStyle?: number;
}

export interface HighlightedCode {
  lines: HighlightToken[][];
  bg?: string;
  fg?: string;
}

interface Node {
  type: string;
  attrs?: Record<string, unknown>;
  content?: Node[];
  text?: string;
}

function resolveLang(lang: unknown): string {
  if (typeof lang !== "string") return "text";
  const l = lang.trim().toLowerCase();
  if (l in bundledLanguages || l in bundledLanguagesAlias) return l;
  return "text";
}

async function highlight(code: string, lang: unknown): Promise<HighlightedCode> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await codeToTokens(code, { lang: resolveLang(lang) as any, theme: CODE_THEME });
  return {
    bg: result.bg,
    fg: result.fg,
    lines: result.tokens.map((line) =>
      line.map((t) => ({ content: t.content, color: t.color, fontStyle: t.fontStyle || undefined })),
    ),
  };
}

/** Returns a copy of the Tiptap doc with `attrs.highlighted` on every codeBlock. */
export async function highlightCodeBlocks(doc: unknown): Promise<unknown> {
  async function walk(node: Node): Promise<Node> {
    if (node.type === "codeBlock") {
      const code = node.content?.map((c) => c.text ?? "").join("") ?? "";
      try {
        return { ...node, attrs: { ...node.attrs, highlighted: await highlight(code, node.attrs?.language) } };
      } catch {
        return node;
      }
    }
    if (!node.content) return node;
    return { ...node, content: await Promise.all(node.content.map(walk)) };
  }
  if (!doc || typeof doc !== "object") return doc;
  return walk(doc as Node);
}
