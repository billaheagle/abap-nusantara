/**
 * Flow types and constants with no runtime dependencies, so client code can
 * import them without pulling zod (and its eval probe, which the CSP reports)
 * into the browser bundle. Validation lives in ./schema.ts and runs on the
 * server and in the importer only.
 */

export const FLOW_LANGUAGE = "flow";

export const FLOW_ICONS = ["send", "modifier", "script", "request", "reply", "api", "error", "token", "gateway", "sign", "filter", "check"] as const;
export type FlowIcon = (typeof FLOW_ICONS)[number];

export interface FlowNode {
  label: string;
  icon: FlowIcon;
  x: number;
  y: number;
  /** "end" draws a circle; "api" and "sub" mark something outside the main process. */
  kind?: "end" | "api" | "sub";
  labelAt?: "bottom" | "top" | "right" | "left";
}

export interface FlowSlot {
  title: string;
  note: string;
}

export interface FlowStep {
  node: number;
  /** Caption for the step; **bold** marks step names. */
  text: string;
  /** One value per slot, in slot order. */
  values: [string, string, string];
}

export interface FlowSpec {
  /** iFlow ID shown in the title bar. */
  name: string;
  /** Sender address, or a short note for concept flows. */
  path: string;
  /** Deployment status chip; left out for concept flows. */
  status?: string;
  /** Canvas height in px on wide screens (phones use a bit less). */
  height?: number;
  nodes: FlowNode[];
  edges: { from: number; to: number; dashed?: boolean }[];
  slots: [FlowSlot, FlowSlot, FlowSlot];
  steps: FlowStep[];
}
