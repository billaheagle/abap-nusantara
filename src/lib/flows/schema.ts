import { z } from "zod";
import { FLOW_ICONS, FLOW_REPLY, FLOW_SENDER, type FlowSpec } from "./types";

export { FLOW_ICONS, FLOW_LANGUAGE, type FlowIcon, type FlowSpec } from "./types";

/**
 * Animated message flows inside articles.
 *
 * An article carries its flow as a fenced code block with the language
 * `flow` whose body is JSON matching `flowSpecSchema`. The block sits where
 * the animation should appear (usually right before "## Langkah"). The
 * importer validates it, the renderer draws it, and it never counts towards
 * reading time.
 *
 * The spec names the parts (sender, steps, receivers, Exception Subprocess);
 * the player lays them out. Frames point at a part by id, or at "sender" /
 * "reply"; frame text may use **bold** for step names.
 *
 * Server and importer only: zod must not reach the browser bundle. Client
 * code imports types and constants from ./types.
 */

const short = (max: number) => z.string().min(1).max(max);
const id = z.string().regex(/^[a-z][a-zA-Z0-9_-]{0,23}$/, "lowercase letter first, then letters, digits, - or _ (max 24)");
const icon = z.enum(FLOW_ICONS);
const slot = z.object({ title: short(30), note: short(30) }).strict();
const value = z.string().max(400);

const step = z.object({ id, label: short(30), icon, calls: id.optional() }).strict();

export const flowSpecSchema = z
  .object({
    name: short(60),
    path: z.string().max(60),
    status: short(20).optional(),
    sender: z.object({ label: short(30), icon }).strict(),
    steps: z.array(step).min(1).max(6),
    receivers: z
      .array(z.object({ id, label: short(30), icon, kind: z.enum(["api", "iflow", "lip"]), calls: id.optional() }).strict())
      .max(4)
      .optional(),
    exception: z
      .object({ name: short(40), steps: z.array(z.object({ id, label: short(30), icon }).strict()).min(1).max(3) })
      .strict()
      .optional(),
    slots: z.tuple([slot, slot, slot]),
    scenarios: z
      .array(
        z
          .object({
            label: short(32),
            outcome: z.enum(["ok", "error"]),
            frames: z
              .array(
                z
                  .object({
                    at: z.string(),
                    text: short(240),
                    values: z.tuple([value, value, value]),
                    response: z.object({ status: short(24), body: z.string().max(700) }).strict().optional(),
                  })
                  .strict(),
              )
              .min(2)
              .max(14),
          })
          .strict(),
      )
      .min(1)
      .max(4),
  })
  .strict()
  .superRefine((spec, ctx) => {
    const receivers = spec.receivers ?? [];
    const laneSteps = spec.exception?.steps ?? [];
    const all = [...spec.steps.map((s) => s.id), ...receivers.map((r) => r.id), ...laneSteps.map((s) => s.id)];
    const issue = (path: (string | number)[], message: string) => ctx.addIssue({ code: "custom", path, message });

    all.forEach((x, i) => {
      if (all.indexOf(x) !== i) issue([], `id "${x}" is used twice`);
      if (x === FLOW_SENDER || x === FLOW_REPLY) issue([], `"${x}" is reserved and can't be an id`);
    });

    // Every receiver hangs under exactly one caller, which decides where it's drawn.
    const callers = new Map<string, number>();
    const callTargets = [...spec.steps.map((s, i) => ({ path: ["steps", i, "calls"], to: s.calls })), ...receivers.map((r, i) => ({ path: ["receivers", i, "calls"], to: r.calls }))];
    for (const { path, to } of callTargets) {
      if (!to) continue;
      if (!receivers.some((r) => r.id === to)) issue(path, `"${to}" isn't a receiver`);
      callers.set(to, (callers.get(to) ?? 0) + 1);
    }
    receivers.forEach((r, i) => {
      const count = callers.get(r.id) ?? 0;
      if (count !== 1) issue(["receivers", i], `"${r.id}" must be called by exactly one step or receiver (found ${count})`);
      if (r.calls === r.id) issue(["receivers", i, "calls"], "a receiver can't call itself");
    });
    // ...and that chain has to start at a step (no receivers calling each other in a loop).
    const reached = new Set<string>();
    for (const s of spec.steps) {
      for (let to = s.calls; to && !reached.has(to); to = receivers.find((r) => r.id === to)?.calls) reached.add(to);
    }
    receivers.forEach((r, i) => {
      if (!reached.has(r.id)) issue(["receivers", i], `"${r.id}" isn't reached from any step`);
    });

    spec.scenarios.forEach((sc, s) =>
      sc.frames.forEach((f, i) => {
        if (f.at !== FLOW_SENDER && f.at !== FLOW_REPLY && !all.includes(f.at)) {
          issue(["scenarios", s, "frames", i, "at"], `"${f.at}" isn't a step, receiver, exception step, "sender" or "reply"`);
        }
      }),
    );
  });

/** Parses a ```flow block body; the error names the first problem and where it is. */
export function parseFlow(source: string): { ok: true; spec: FlowSpec } | { ok: false; error: string } {
  let data: unknown;
  try {
    data = JSON.parse(source);
  } catch (e) {
    return { ok: false, error: `not valid JSON: ${(e as Error).message}` };
  }
  const result = flowSpecSchema.safeParse(data);
  if (result.success) return { ok: true, spec: result.data satisfies FlowSpec };
  const issue = result.error.issues[0];
  const where = issue.path.length ? issue.path.join(".") : "(root)";
  return { ok: false, error: `${where}: ${issue.message}` };
}
