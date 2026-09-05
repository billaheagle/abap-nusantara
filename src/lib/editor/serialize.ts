/** Minimal, dependency-free walker over Tiptap's JSON document format. */

interface TiptapNode {
  type?: string;
  text?: string;
  content?: TiptapNode[];
}

export function extractPlainTextFromTiptap(doc: unknown): string {
  if (!doc || typeof doc !== "object") return "";
  const node = doc as TiptapNode;
  let text = node.text ?? "";
  if (node.content) {
    text += node.content.map(extractPlainTextFromTiptap).join(" ");
  }
  return text;
}
