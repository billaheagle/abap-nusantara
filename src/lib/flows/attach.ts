import "server-only";
import { FLOW_LANGUAGE, parseFlow, type FlowSpec } from "./schema";

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
const flowSource = (block: Node) => block.content?.map((c) => c.text ?? "").join("") ?? "";

/** The first valid top-level ```flow block in a document, or null. */
export function firstFlowSpec(doc: unknown): FlowSpec | null {
  const root = doc as Node | null;
  for (const block of root?.content ?? []) {
    if (block.type !== "codeBlock" || block.attrs?.language !== FLOW_LANGUAGE) continue;
    const result = parseFlow(flowSource(block));
    if (result.ok) return result.spec;
  }
  return null;
}

export function attachFlowSpecs<T>(doc: T): T {
  const root = doc as unknown as Node;
  if (!root || typeof root !== "object" || !root.content) return doc;
  return {
    ...root,
    content: root.content.map((block) => {
      if (block.type !== "codeBlock" || block.attrs?.language !== FLOW_LANGUAGE) return block;
      const result = parseFlow(flowSource(block));
      return { ...block, attrs: { ...block.attrs, ...(result.ok ? { flow: result.spec } : { flowError: result.error }) } };
    }),
  } as unknown as T;
}
