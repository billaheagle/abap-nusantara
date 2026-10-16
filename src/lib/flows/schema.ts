import { z } from "zod";

/**
 * Animated message flows inside articles.
 *
 * An article carries its flow as a fenced code block with the language
 * `flow` whose body is JSON matching `flowSpecSchema`. The block sits where
 * the animation should appear (usually right before "## Langkah"). The
 * importer validates it, the renderer draws it, and it never counts towards
 * reading time.
 *
 * Coordinates are percentages of the canvas. Steps point at a node by index;
 * step text may use **bold** for step names.
 */

export const FLOW_LANGUAGE = "flow";

export const FLOW_ICONS = ["send", "modifier", "script", "request", "reply", "api", "error", "token", "gateway", "sign", "filter", "check"] as const;
export type FlowIcon = (typeof FLOW_ICONS)[number];

const short = (max: number) => z.string().min(1).max(max);
const percent = z.number().min(0).max(100);
const slot = z.object({ title: short(30), note: short(30) }).strict();

export const flowSpecSchema = z
  .object({
    /** iFlow ID shown in the title bar. */
    name: short(60),
    /** Sender address, or a short note for concept flows. */
    path: z.string().max(60),
    /** Deployment status chip; leave out for concept flows. */
    status: short(20).optional(),
    /** Canvas height in px on wide screens (phones use a bit less). */
    height: z.number().int().min(160).max(320).optional(),
    nodes: z
      .array(
        z
          .object({
            label: short(40),
            icon: z.enum(FLOW_ICONS),
            x: percent,
            y: percent,
            /** "end" draws a circle; "api" and "sub" mark something outside the main process. */
            kind: z.enum(["end", "api", "sub"]).optional(),
            labelAt: z.enum(["bottom", "top", "right", "left"]).optional(),
          })
          .strict(),
      )
      .min(2)
      .max(8),
    edges: z.array(z.object({ from: z.number().int().min(0), to: z.number().int().min(0), dashed: z.boolean().optional() }).strict()).max(16),
    slots: z.tuple([slot, slot, slot]),
    steps: z
      .array(
        z
          .object({
            node: z.number().int().min(0),
            text: short(220),
            /** One value per slot, in slot order. */
            values: z.tuple([z.string().max(400), z.string().max(400), z.string().max(400)]),
          })
          .strict(),
      )
      .min(1)
      .max(12),
  })
  .strict()
  .superRefine((spec, ctx) => {
    const n = spec.nodes.length;
    spec.edges.forEach((e, i) => {
      if (e.from >= n || e.to >= n) ctx.addIssue({ code: "custom", path: ["edges", i], message: `points at a node that doesn't exist (there are ${n})` });
    });
    spec.steps.forEach((s, i) => {
      if (s.node >= n) ctx.addIssue({ code: "custom", path: ["steps", i, "node"], message: `node ${s.node} doesn't exist (there are ${n})` });
    });
  });

export type FlowSpec = z.infer<typeof flowSpecSchema>;
export type FlowNode = FlowSpec["nodes"][number];

/** Parses a ```flow block body; the error names the first problem and where it is. */
export function parseFlow(source: string): { ok: true; spec: FlowSpec } | { ok: false; error: string } {
  let data: unknown;
  try {
    data = JSON.parse(source);
  } catch (e) {
    return { ok: false, error: `not valid JSON: ${(e as Error).message}` };
  }
  const result = flowSpecSchema.safeParse(data);
  if (result.success) return { ok: true, spec: result.data };
  const issue = result.error.issues[0];
  const where = issue.path.length ? issue.path.join(".") : "(root)";
  return { ok: false, error: `${where}: ${issue.message}` };
}
