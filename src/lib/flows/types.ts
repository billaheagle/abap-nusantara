/**
 * Flow types and constants with no runtime dependencies, so client code can
 * import them without pulling zod (and its eval probe, which the CSP reports)
 * into the browser bundle. Validation lives in ./schema.ts and runs on the
 * server and in the importer only.
 *
 * A spec describes the iFlow's shape (sender, main steps, the systems it
 * calls, its Exception Subprocess) and one or more scenarios that walk a
 * message through it. The player lays everything out itself, so authors never
 * position anything by hand.
 */

export const FLOW_LANGUAGE = "flow";

export const FLOW_ICONS = ["send", "modifier", "script", "request", "reply", "api", "error", "token", "gateway", "sign", "filter", "check"] as const;
export type FlowIcon = (typeof FLOW_ICONS)[number];

/** Frame targets that aren't node ids: the message leaving the sender, and the reply arriving back. */
export const FLOW_SENDER = "sender";
export const FLOW_REPLY = "reply";

export interface FlowStep {
  id: string;
  /** Short label under the node; break lines with \n (about 10 characters per line). */
  label: string;
  icon: FlowIcon;
  /** Id of the receiver this step calls (Request Reply, Process Call, ProcessDirect). */
  calls?: string;
}

export interface FlowReceiver {
  id: string;
  label: string;
  icon: FlowIcon;
  /** api: a system outside CPI. iflow: another iFlow over ProcessDirect. lip: a Local Integration Process. */
  kind: "api" | "iflow" | "lip";
  /** A receiver can call one more receiver (a gateway calling the API, a LIP fetching a token). */
  calls?: string;
}

export interface FlowException {
  /** Exception Subprocess name shown on its lane, e.g. EXS_HandleError. */
  name: string;
  steps: Omit<FlowStep, "calls">[];
}

export interface FlowSlot {
  title: string;
  note: string;
}

export interface FlowFrame {
  /** A step, receiver or exception step id, or "sender" / "reply". */
  at: string;
  /** Caption for the frame; **bold** marks step names. */
  text: string;
  /** One value per slot, in slot order. */
  values: [string, string, string];
}

export interface FlowScenario {
  /** Tab label, e.g. "Sukses" or "Order tidak ada (404)". */
  label: string;
  outcome: "ok" | "error";
  frames: FlowFrame[];
}

export interface FlowSpec {
  /** iFlow ID shown in the title bar. */
  name: string;
  /** Sender address, or a short note for concept flows. */
  path: string;
  /** Deployment status chip; left out for concept flows. */
  status?: string;
  sender: { label: string; icon: FlowIcon };
  steps: FlowStep[];
  receivers?: FlowReceiver[];
  exception?: FlowException;
  slots: [FlowSlot, FlowSlot, FlowSlot];
  scenarios: FlowScenario[];
}
