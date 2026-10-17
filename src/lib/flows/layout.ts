import { FLOW_REPLY, FLOW_SENDER, type FlowIcon, type FlowSpec } from "./types";

/**
 * Lays a flow spec out for a given canvas width, in CSS pixels:
 *
 *   ┌ respons ─────────────────────────────┐   top return path (sync reply)
 *   ○ sender → [step] → [step] → [step] ───┘
 *                 ↓↑                          receivers under their caller
 *               [API]
 *   ┊ EXS_HandleError  ⚡ → [step]  ┊        Exception Subprocess lane
 *   └ respons error ───────────────┘         bottom return path
 *
 * Columns are spread evenly (capped so short flows don't stretch), node size
 * and font follow the column spacing, so the same spec stays tidy from a
 * 320px phone to a desktop column. `scale` enlarges everything for the
 * full-screen view. Pure and client-safe.
 */

export interface Pt {
  x: number;
  y: number;
}

export type NodeKind = "sender" | "step" | "api" | "iflow" | "lip" | "lane";
type LabelSide = "below" | "above" | "left" | "right";

export interface LaidNode {
  id: string;
  label: string;
  icon: FlowIcon;
  kind: NodeKind;
  x: number;
  y: number;
  labelSide: LabelSide;
}

export type EdgeTone = "main" | "api" | "iflow" | "reply" | "error";

export interface Edge {
  d: string;
  tone: EdgeTone;
  dashed?: boolean;
  /** Arrow at the end of the path. */
  arrow?: boolean;
}

export interface Layout {
  width: number;
  height: number;
  size: number;
  font: number;
  lineHeight: number;
  mainY: number;
  nodes: Map<string, LaidNode>;
  edges: Edge[];
  /** Text labels on the return paths. */
  notes: { x: number; y: number; text: string; tone: EdgeTone }[];
  lane?: { x: number; y: number; w: number; h: number; name: string; start: Pt; startR: number };
  topY?: number;
  bottomY?: number;
}

const PAD = 12;
const LABEL_SLACK = 30;
/** Receiver request/response lines sit this far either side of the column. */
const LINE_GAP = 5;

const lines = (label: string) => label.split("\n");

/** Where a reply comes back from: the main path (top) or the Exception Subprocess (bottom). */
function replySources(spec: FlowSpec) {
  const laneIds = new Set(spec.exception?.steps.map((s) => s.id) ?? []);
  let top = false;
  let bottom = false;
  for (const sc of spec.scenarios) {
    sc.frames.forEach((f, i) => {
      if (f.at !== FLOW_REPLY || i === 0) return;
      if (laneIds.has(sc.frames[i - 1].at)) bottom = true;
      else top = true;
    });
  }
  return { top, bottom };
}

export function layoutFlow(spec: FlowSpec, width: number, scale = 1): Layout {
  const receivers = spec.receivers ?? [];
  const laneSteps = spec.exception?.steps ?? [];
  const cols = Math.max(1 + spec.steps.length, laneSteps.length ? laneSteps.length + 2 : 0);

  const avail = width - 2 * (PAD + LABEL_SLACK * scale);
  const spacing = cols > 1 ? Math.min(avail / (cols - 1), 150 * scale) : 0;
  const x0 = (width - spacing * (cols - 1)) / 2;
  const colX = (i: number) => x0 + i * spacing;

  const size = Math.round(Math.min(42 * scale, Math.max(30, spacing * 0.6)));
  const font = (spacing < 62 ? 10 : 11.5) * (scale > 1 ? scale * 0.92 : 1);
  const lineHeight = Math.round(font * 1.25);
  const labelBlock = 2 * lineHeight + 4;

  const returns = replySources(spec);
  const anyCalls = spec.steps.some((s) => s.calls);

  let y = PAD;
  const topY = returns.top ? (y += 12) : undefined;
  if (topY !== undefined) y += 8;
  const mainY = y + (anyCalls ? labelBlock + 2 : 0) + size / 2;
  const mainBottom = mainY + size / 2 + 4 + labelBlock;

  const nodes = new Map<string, LaidNode>();
  nodes.set(FLOW_SENDER, { id: FLOW_SENDER, label: spec.sender.label, icon: spec.sender.icon, kind: "sender", x: colX(0), y: mainY, labelSide: "below" });
  spec.steps.forEach((s, i) =>
    nodes.set(s.id, { id: s.id, label: s.label, icon: s.icon, kind: "step", x: colX(i + 1), y: mainY, labelSide: s.calls ? "above" : "below" }),
  );

  // Receivers: depth 1 under the calling step, deeper ones under their calling receiver.
  const edges: Edge[] = [];
  const rowY = (depth: number) => mainBottom + 14 + size / 2 + (depth - 1) * (size + 26);
  let deepest = 0;
  const place = (callerId: string, to: string | undefined, depth: number) => {
    const r = receivers.find((x) => x.id === to);
    if (!r) return;
    const caller = nodes.get(callerId)!;
    nodes.set(r.id, { id: r.id, label: r.label, icon: r.icon, kind: r.kind, x: caller.x, y: rowY(depth), labelSide: "right" });
    deepest = Math.max(deepest, depth);
    place(r.id, r.calls, depth + 1);
  };
  spec.steps.forEach((s) => place(s.id, s.calls, 1));

  // Receiver labels go right unless a neighbour or the canvas edge is in the way.
  for (const n of nodes.values()) {
    if (n.kind !== "api" && n.kind !== "iflow" && n.kind !== "lip") continue;
    const widest = Math.max(...lines(n.label).map((l) => l.length)) * font * 0.6;
    const neighbourRight = [...nodes.values()].some((m) => m !== n && m.y === n.y && Math.abs(m.x - (n.x + spacing)) < 1);
    if (neighbourRight || n.x + size / 2 + 7 + widest > width - 4) n.labelSide = "left";
  }

  let bottom = deepest ? rowY(deepest) + size / 2 + 6 : mainBottom;

  let lane: Layout["lane"];
  if (spec.exception) {
    const top = bottom + 22;
    // A header row for the subprocess name, then the Error Start row.
    const laneY = top + 34 + size / 2;
    const left = colX(1) - size / 2 - 16;
    const right = Math.min(width - PAD / 2, colX(Math.max(cols - 1, laneSteps.length + 1)) + size / 2 + 16);
    const h = laneY + size / 2 + 4 + labelBlock + 4 - top;
    lane = { x: left, y: top, w: right - left, h, name: spec.exception.name, start: { x: colX(1), y: laneY }, startR: Math.round(size * 0.24) };
    laneSteps.forEach((s, i) =>
      nodes.set(s.id, { id: s.id, label: s.label, icon: s.icon, kind: "lane", x: colX(i + 2), y: laneY, labelSide: "below" }),
    );
    bottom = top + h;
  }

  const bottomY = returns.bottom && lane ? bottom + 14 : undefined;
  const height = Math.ceil((bottomY !== undefined ? bottomY + 16 : bottom) + PAD);

  // Static edges.
  const half = size / 2;
  const seq = [nodes.get(FLOW_SENDER)!, ...spec.steps.map((s) => nodes.get(s.id)!)];
  for (let i = 1; i < seq.length; i++) {
    edges.push({ d: `M${seq[i - 1].x + half + 3},${mainY}H${seq[i].x - half - 4}`, tone: "main", arrow: true });
  }
  for (const n of nodes.values()) {
    if (n.kind !== "api" && n.kind !== "iflow" && n.kind !== "lip") continue;
    const caller = [...nodes.values()].find((m) => (spec.steps.find((s) => s.id === m.id)?.calls ?? receivers.find((r) => r.id === m.id)?.calls) === n.id)!;
    const tone: EdgeTone = n.kind === "api" ? "api" : "iflow";
    const from = caller.y + half + 3;
    const to = n.y - half - 4;
    edges.push({ d: `M${n.x - LINE_GAP},${from}V${to}`, tone, dashed: true, arrow: true });
    edges.push({ d: `M${n.x + LINE_GAP},${to + 1}V${from - 1}`, tone, dashed: true, arrow: true });
  }
  if (lane) {
    const laneSeq = laneSteps.map((s) => nodes.get(s.id)!);
    edges.push({ d: `M${lane.start.x + lane.startR + 3},${lane.start.y}H${laneSeq[0].x - half - 4}`, tone: "error", arrow: true });
    for (let i = 1; i < laneSeq.length; i++) {
      edges.push({ d: `M${laneSeq[i - 1].x + half + 3},${lane.start.y}H${laneSeq[i].x - half - 4}`, tone: "error", arrow: true });
    }
  }

  const sender = nodes.get(FLOW_SENDER)!;
  const notes: Layout["notes"] = [];
  if (topY !== undefined) {
    const last = seq[seq.length - 1];
    const out = Math.min(last.x + half + 9, width - 3);
    edges.push({ d: `M${last.x + half + 3},${mainY}H${out}V${topY}H${sender.x}V${mainY - half - 4}`, tone: "reply", dashed: true, arrow: true });
    notes.push({ x: (sender.x + out) / 2, y: topY - 5, text: "respons", tone: "reply" });
  }
  if (bottomY !== undefined && lane) {
    const last = nodes.get(laneSteps[laneSteps.length - 1].id)!;
    const out = Math.min(last.x + half + 9, width - 3);
    const inX = sender.x - half - 10;
    edges.push({ d: `M${last.x + half + 3},${last.y}H${out}V${bottomY}H${inX}V${mainY}H${sender.x - half - 4}`, tone: "error", dashed: true, arrow: true });
    notes.push({ x: (inX + out) / 2, y: bottomY + 13, text: "respons error", tone: "error" });
  }

  return { width, height, size, font, lineHeight, mainY, nodes, edges, notes, lane, topY, bottomY };
}

const isReceiver = (n: LaidNode) => n.kind === "api" || n.kind === "iflow" || n.kind === "lip";

/** Where a frame's target sits; "reply" is the sender again. */
export function nodeAt(layout: Layout, at: string): LaidNode {
  return layout.nodes.get(at === FLOW_REPLY ? FLOW_SENDER : at)!;
}

/**
 * The route the envelope travels from one frame's target to the next, along
 * the drawn lines: down the left line to a receiver and back up the right one,
 * along the main row, into the Exception Subprocess, and round the return
 * paths for a reply.
 */
export function travelPath(layout: Layout, from: string, to: string): Pt[] {
  const half = layout.size / 2;
  const a = nodeAt(layout, from);
  const pts: Pt[] = [{ x: a.x, y: a.y }];
  const add = (x: number, y: number) => {
    const last = pts[pts.length - 1];
    if (Math.abs(last.x - x) > 0.5 || Math.abs(last.y - y) > 0.5) pts.push({ x, y });
  };
  const { mainY } = layout;

  // A new message starts at the sender: no travel.
  if (to === FLOW_SENDER) return [{ x: a.x, y: a.y }];

  // Leaving a receiver: climb back up the response line to the main row.
  const rise = () => {
    if (isReceiver(a)) {
      add(a.x + LINE_GAP, a.y);
      add(a.x + LINE_GAP, mainY);
    }
  };

  if (a.kind === "lane") {
    const b = nodeAt(layout, to);
    if (to === FLOW_REPLY && layout.bottomY !== undefined) {
      const out = Math.min(a.x + half + 9, layout.width - 3);
      add(out, a.y);
      add(out, layout.bottomY);
      add(b.x - half - 10, layout.bottomY);
      add(b.x - half - 10, mainY);
    } else {
      add(b.x, a.y);
    }
    add(b.x, b.y);
    return pts;
  }

  const b = nodeAt(layout, to);

  if (b.kind === "lane" && layout.lane) {
    // Into the Exception Subprocess: drop below everything, across to Error Start.
    // Step aside first when a label or another node sits below, so the line crosses neither:
    // receivers go to the side without their label, main steps to the right along their edge.
    const entryY = layout.lane.y - 11;
    const blocked = [...layout.nodes.values()].some((n) => n !== a && n.kind !== "lane" && Math.abs(n.x - a.x) < 1 && n.y > a.y);
    if (blocked || a.labelSide === "below") {
      const side = isReceiver(a) && a.labelSide === "right" ? -1 : 1;
      add(a.x + side * (half + 10), a.y);
      add(a.x + side * (half + 10), entryY);
    } else {
      add(a.x, entryY);
    }
    add(layout.lane.start.x, entryY);
    add(layout.lane.start.x, layout.lane.start.y);
    add(b.x, b.y);
    return pts;
  }

  if (to === FLOW_REPLY && layout.topY !== undefined) {
    rise();
    const last = [...layout.nodes.values()].filter((n) => n.kind === "step").at(-1)!;
    const out = Math.min(last.x + half + 9, layout.width - 3);
    add(last.x, mainY);
    add(out, mainY);
    add(out, layout.topY);
    add(b.x, layout.topY);
    add(b.x, b.y);
    return pts;
  }

  if (isReceiver(b) && Math.abs(a.x - b.x) < 1 && isReceiver(a)) {
    // Up or down one receiver chain.
    const side = b.y > a.y ? -LINE_GAP : LINE_GAP;
    add(a.x + side, a.y);
    add(b.x + side, b.y);
    add(b.x, b.y);
    return pts;
  }

  rise();
  if (isReceiver(b)) {
    add(b.x - LINE_GAP, mainY);
    add(b.x - LINE_GAP, b.y);
    add(b.x, b.y);
  } else {
    add(b.x, mainY);
  }
  return pts;
}

export function pathLength(pts: Pt[]): number {
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  return len;
}

/** The point `t` (0–1) of the way along a polyline. */
export function pointAlong(pts: Pt[], t: number): Pt {
  if (pts.length === 1) return pts[0];
  let left = pathLength(pts) * Math.min(1, Math.max(0, t));
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    if (left <= seg || i === pts.length - 1) {
      const k = seg ? Math.min(1, left / seg) : 1;
      return { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * k, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * k };
    }
    left -= seg;
  }
  return pts[pts.length - 1];
}

export const toPathD = (pts: Pt[]) => pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join("");
