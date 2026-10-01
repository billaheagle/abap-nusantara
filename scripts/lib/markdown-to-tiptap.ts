import { marked, type Token, type Tokens } from "marked";

/**
 * Converts the Markdown subset used in abap-nusantara-content drafts into
 * the Tiptap JSON document that the admin editor and ArticleRenderer use.
 *
 * Supported: headings (h2–h4; a leading h1 is treated as the title and
 * dropped), paragraphs, bold/italic/strike/inline code/links, bullet and
 * ordered lists (nested), tables, fenced code blocks, blockquotes,
 * horizontal rules, hard breaks and images.
 *
 * Anything else (raw HTML, task lists, footnotes) is rejected with an error
 * instead of being silently dropped.
 */

export interface TiptapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
  marks?: TiptapMark[];
}

export interface ConvertOptions {
  /** Maps an image href from the Markdown to the src stored in the article. */
  resolveImage?: (href: string, alt: string) => string;
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : match;
    }
    return ENTITIES[code.toLowerCase()] ?? match;
  });
}

class Converter {
  private droppedTitle = false;

  constructor(private readonly options: ConvertOptions) {}

  document(markdown: string): TiptapNode {
    const tokens = marked.lexer(markdown, { gfm: true });
    const content = this.blocks(tokens);
    return { type: "doc", content: content.length ? content : [{ type: "paragraph" }] };
  }

  private blocks(tokens: Token[]): TiptapNode[] {
    const out: TiptapNode[] = [];
    for (const token of tokens) out.push(...this.block(token));
    return out;
  }

  private block(token: Token): TiptapNode[] {
    switch (token.type) {
      case "space":
        return [];
      case "heading": {
        const t = token as Tokens.Heading;
        if (t.depth === 1) {
          if (!this.droppedTitle) {
            this.droppedTitle = true; // the title lives in metadata, not in the body
            return [];
          }
          throw new Error(`Only one "# " heading (the title) is allowed; found another: "${t.text}"`);
        }
        const level = Math.min(4, t.depth);
        return [{ type: "heading", attrs: { level }, content: this.inline(t.tokens) }];
      }
      case "paragraph":
        return this.paragraph((token as Tokens.Paragraph).tokens);
      case "text": {
        // Tight list items wrap their inline content in a block-level "text" token.
        const t = token as Tokens.Text;
        return this.paragraph(t.tokens ?? [{ type: "text", raw: t.raw, text: t.text } as Tokens.Text]);
      }
      case "list": {
        const t = token as Tokens.List;
        if (t.items.some((i) => i.task)) throw new Error("Task lists (- [ ]) are not supported by the editor");
        const items = t.items.map((item) => {
          const content = this.blocks(item.tokens);
          return { type: "listItem", content: content.length ? content : [{ type: "paragraph" }] };
        });
        if (t.ordered) {
          const start = typeof t.start === "number" ? t.start : 1;
          return [{ type: "orderedList", attrs: { start }, content: items }];
        }
        return [{ type: "bulletList", content: items }];
      }
      case "table": {
        const t = token as Tokens.Table;
        const row = (cells: Tokens.TableCell[], cellType: "tableHeader" | "tableCell"): TiptapNode => ({
          type: "tableRow",
          content: cells.map((cell) => ({ type: cellType, content: [this.cellParagraph(cell.tokens)] })),
        });
        return [
          {
            type: "table",
            content: [row(t.header, "tableHeader"), ...t.rows.map((r) => row(r, "tableCell"))],
          },
        ];
      }
      case "code": {
        const t = token as Tokens.Code;
        const text = t.text.replace(/\n+$/, "");
        return [
          {
            type: "codeBlock",
            attrs: { language: t.lang?.trim() || null },
            ...(text ? { content: [{ type: "text", text }] } : {}),
          },
        ];
      }
      case "blockquote": {
        const content = this.blocks((token as Tokens.Blockquote).tokens);
        return [{ type: "blockquote", content: content.length ? content : [{ type: "paragraph" }] }];
      }
      case "hr":
        return [{ type: "horizontalRule" }];
      case "html":
        if (/^\s*<!--[\s\S]*-->\s*$/.test(token.raw)) return []; // author notes stay out of the article
        throw new Error(`Raw HTML is not supported: ${token.raw.trim().slice(0, 60)}`);
      default:
        throw new Error(`Unsupported Markdown block "${token.type}": ${token.raw.trim().slice(0, 60)}`);
    }
  }

  /** A paragraph's images become block-level image nodes between text paragraphs. */
  private paragraph(tokens: Token[]): TiptapNode[] {
    const out: TiptapNode[] = [];
    let pending: Token[] = [];
    const flush = () => {
      const content = this.inline(pending);
      if (content.length) out.push({ type: "paragraph", content });
      pending = [];
    };
    for (const token of tokens) {
      if (token.type === "image") {
        flush();
        out.push(this.image(token as Tokens.Image));
      } else {
        pending.push(token);
      }
    }
    flush();
    return out;
  }

  private cellParagraph(tokens: Token[]): TiptapNode {
    if (tokens.some((t) => t.type === "image")) throw new Error("Images inside table cells are not supported");
    const content = this.inline(tokens);
    return content.length ? { type: "paragraph", content } : { type: "paragraph" };
  }

  private image(token: Tokens.Image): TiptapNode {
    const alt = decodeEntities(token.text);
    const src = this.options.resolveImage ? this.options.resolveImage(token.href, alt) : token.href;
    return { type: "image", attrs: { src, alt, title: token.title ?? null } };
  }

  private inline(tokens: Token[] | undefined, marks: TiptapMark[] = []): TiptapNode[] {
    const out: TiptapNode[] = [];
    const push = (text: string, extra: TiptapMark[] = marks) => {
      if (!text) return;
      const last = out[out.length - 1];
      // Merge adjacent text nodes with identical marks.
      if (last?.type === "text" && JSON.stringify(last.marks ?? []) === JSON.stringify(extra)) {
        last.text += text;
        return;
      }
      out.push(extra.length ? { type: "text", text, marks: extra } : { type: "text", text });
    };

    for (const token of tokens ?? []) {
      switch (token.type) {
        case "text": {
          const t = token as Tokens.Text;
          if (t.tokens?.length) out.push(...this.inline(t.tokens, marks));
          else push(decodeEntities(t.text));
          break;
        }
        case "escape":
          push((token as Tokens.Escape).text);
          break;
        case "strong":
          out.push(...this.inline((token as Tokens.Strong).tokens, [...marks, { type: "bold" }]));
          break;
        case "em":
          out.push(...this.inline((token as Tokens.Em).tokens, [...marks, { type: "italic" }]));
          break;
        case "del":
          out.push(...this.inline((token as Tokens.Del).tokens, [...marks, { type: "strike" }]));
          break;
        case "codespan":
          // Tiptap's code mark excludes other marks, so it is applied on its own.
          push((token as Tokens.Codespan).text, [{ type: "code" }]);
          break;
        case "link": {
          const t = token as Tokens.Link;
          const link: TiptapMark = { type: "link", attrs: { href: t.href } };
          out.push(...this.inline(t.tokens, [...marks.filter((m) => m.type !== "link"), link]));
          break;
        }
        case "br":
          out.push({ type: "hardBreak" });
          break;
        case "image":
          throw new Error("Images must stand on their own line (not inside links, headings or list text)");
        case "html":
          throw new Error(`Inline HTML is not supported: ${token.raw}`);
        default:
          throw new Error(`Unsupported inline Markdown "${token.type}": ${token.raw}`);
      }
    }
    return out;
  }
}

export function markdownToTiptap(markdown: string, options: ConvertOptions = {}): TiptapNode {
  return new Converter(options).document(markdown);
}
