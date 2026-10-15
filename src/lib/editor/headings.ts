/**
 * Gives every h2/h3 in a Tiptap document a stable anchor id (stored on
 * `attrs.id`, which the renderer puts on the element) and returns the list
 * for the article's table of contents. Runs server-side alongside
 * highlightCodeBlocks / addImageDimensions.
 */

interface Node {
  type: string;
  attrs?: Record<string, unknown>;
  content?: Node[];
  text?: string;
}

export interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

function textOf(node: Node): string {
  if (node.type === "text") return node.text ?? "";
  return (node.content ?? []).map(textOf).join("");
}

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "bagian"
  );
}

export function addHeadingIds<T>(doc: T): { content: T; headings: TocHeading[] } {
  const headings: TocHeading[] = [];
  const used = new Map<string, number>();

  const walk = (node: Node): Node => {
    if (node.type === "heading") {
      const level = Math.min(4, Math.max(2, Number(node.attrs?.level) || 2));
      const text = textOf(node).trim();
      const base = slugify(text);
      const n = used.get(base) ?? 0;
      used.set(base, n + 1);
      const id = n === 0 ? base : `${base}-${n + 1}`;
      if (level <= 3 && text) headings.push({ id, text, level: level as 2 | 3 });
      return { ...node, attrs: { ...node.attrs, id } };
    }
    return node.content ? { ...node, content: node.content.map(walk) } : node;
  };

  const root = doc as unknown as Node;
  if (!root || typeof root !== "object") return { content: doc, headings };
  return { content: walk(root) as unknown as T, headings };
}
