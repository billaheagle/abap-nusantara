import "server-only";
import path from "path";
import sharp from "sharp";

/**
 * Attaches the intrinsic `width`/`height` of every locally hosted image in a
 * Tiptap doc, so the renderer can lay each one out at its real aspect ratio
 * (a 429×52 button strip shouldn't sit in a 16:9 box) with no layout shift.
 */

interface Node {
  type: string;
  attrs?: Record<string, unknown>;
  content?: Node[];
}

const PUBLIC_DIR = path.join(process.cwd(), "public");
const cache = new Map<string, { width: number; height: number } | null>();

async function readDimensions(src: string): Promise<{ width: number; height: number } | null> {
  if (cache.has(src)) return cache.get(src)!;
  let result: { width: number; height: number } | null = null;
  try {
    const pathname = decodeURIComponent(src.split(/[?#]/)[0]);
    const file = path.join(PUBLIC_DIR, pathname);
    // Only ever read inside /public.
    if (file.startsWith(PUBLIC_DIR + path.sep)) {
      const meta = await sharp(file).metadata();
      if (meta.width && meta.height) result = { width: meta.width, height: meta.height };
    }
  } catch {
    // Missing/unreadable file — renderer falls back to auto sizing.
  }
  cache.set(src, result);
  return result;
}

export async function addImageDimensions(doc: unknown): Promise<unknown> {
  async function walk(node: Node): Promise<Node> {
    if (node.type === "image") {
      const src = node.attrs?.src;
      // Local paths only ("/articles/…", "/uploads/…"); not protocol-relative URLs.
      if (typeof src === "string" && src.startsWith("/") && !src.startsWith("//")) {
        const dims = await readDimensions(src);
        if (dims) return { ...node, attrs: { ...node.attrs, ...dims } };
      }
      return node;
    }
    if (!node.content) return node;
    return { ...node, content: await Promise.all(node.content.map(walk)) };
  }
  if (!doc || typeof doc !== "object") return doc;
  return walk(doc as Node);
}
