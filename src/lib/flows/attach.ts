import "server-only";
import { FLOW_LANGUAGE, parseFlow } from "./schema";

interface Node {
  type: string;
  attrs?: Record<string, unknown>;
  content?: Node[];
  text?: string;
}

/**
 * Validates every top-level ```flow block on the server and attaches the
 * result, `attrs.flow` (the spec) or `attrs.flowError`, so the client
 * renderer can draw it without shipping the validator. Runs alongside
 * highlightCodeBlocks / addImageDimensions.
 */
export function attachFlowSpecs<T>(doc: T): T {
  const root = doc as unknown as Node;
  if (!root || typeof root !== "object" || !root.content) return doc;
  return {
    ...root,
    content: root.content.map((block) => {
      if (block.type !== "codeBlock" || block.attrs?.language !== FLOW_LANGUAGE) return block;
      const result = parseFlow(block.content?.map((c) => c.text ?? "").join("") ?? "");
      return { ...block, attrs: { ...block.attrs, ...(result.ok ? { flow: result.spec } : { flowError: result.error }) } };
    }),
  } as unknown as T;
}
