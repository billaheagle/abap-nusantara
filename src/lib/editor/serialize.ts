/** Minimal, dependency-free walker over Tiptap's JSON document format. */

interface TiptapNode {
  type?: string;
  attrs?: { language?: unknown };
  text?: string;
  content?: TiptapNode[];
}

export function extractPlainTextFromTiptap(doc: unknown): string {
  if (!doc || typeof doc !== "object") return "";
  const node = doc as TiptapNode;
  // A ```flow block is data for an animation, not reading material.
  if (node.type === "codeBlock" && node.attrs?.language === "flow") return "";
  let text = node.text ?? "";
  if (node.content) {
    text += node.content.map(extractPlainTextFromTiptap).join(" ");
  }
  return text;
}
