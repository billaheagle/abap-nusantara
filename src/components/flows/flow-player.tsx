"use client";

import { memo, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeftRight,
  Braces,
  Check,
  CircleCheck,
  Filter,
  Globe,
  KeyRound,
  Maximize2,
  Minus,
  Network,
  PenLine,
  Plus,
  Send,
  SlidersHorizontal,
  TriangleAlert,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { FLOW_REPLY, type FlowFrame, type FlowIcon, type FlowSpec } from "@/lib/flows/types";
import { layoutFlow, nodeAt, pathLength, pointAlong, toPathD, travelPath, type EdgeTone, type LaidNode, type Layout } from "@/lib/flows/layout";
import { Rich, SlotBox, Stack, distinct } from "./frame-parts";

/**
 * One message walking through an iFlow. The diagram is laid out from the spec
 * (lib/flows/layout.ts) at the canvas's real width; the envelope travels the
 * drawn lines between frames, leaving a trail, a card shows what an API (or
 * the sender) gets back, and the three panels below show what the message
 * carries at each frame. Scenarios (success, error cases) sit in tabs and play
 * one after another until the reader picks one. The expand button opens the
 * same player full screen, drawn larger, with zoom.
 *
 * Articles load it through LazyFlowPlayer; the home hero uses it directly.
 */

const ICONS: Record<FlowIcon, LucideIcon> = {
  send: Send,
  modifier: SlidersHorizontal,
  script: Braces,
  request: ArrowLeftRight,
  reply: Check,
  api: Globe,
  error: TriangleAlert,
  token: KeyRound,
  gateway: Network,
  sign: PenLine,
  filter: Filter,
  check: Check,
};

const STROKE: Record<EdgeTone, string> = {
  main: "#3d4596",
  api: "#2b7a72",
  iflow: "#6d55a8",
  reply: "rgb(242 182 50 / 0.55)",
  error: "rgb(240 96 104 / 0.6)",
};

/** Fill, border and icon colour per node kind, at rest. */
const NODE_STYLE: Record<LaidNode["kind"], { fill: string; stroke: string; icon: string; dash?: string }> = {
  sender: { fill: "#1b2156", stroke: "#4a52b0", icon: "#c9cdf5" },
  step: { fill: "#22286a", stroke: "#3a4294", icon: "#aab0e6" },
  api: { fill: "#123c3a", stroke: "#2b7a72", icon: "#8ce3cf" },
  iflow: { fill: "#2b2160", stroke: "#6d55a8", icon: "#cbb8ff" },
  lip: { fill: "#2b2160", stroke: "#6d55a8", icon: "#cbb8ff", dash: "4 3" },
  lane: { fill: "#2c1730", stroke: "#7a3346", icon: "#f2a7b2" },
};

const ACTIVE = { fill: "#f2b632", stroke: "#f2b632", icon: "#241800" };

const REDUCED = "(prefers-reduced-motion: reduce)";
const DWELL = 2300;
const DWELL_LAST = 3400;
/** Zoom steps in the full-screen view. */
const ZOOMS = [1, 1.25, 1.5, 1.8];

function subscribeReduced(onChange: () => void) {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function Label({ node, layout, active }: { node: LaidNode; layout: Layout; active: boolean }) {
  const rows = node.label.split("\n");
  const { size, font, lineHeight } = layout;
  const half = size / 2;
  let x = node.x;
  let y: number;
  let anchor: "middle" | "start" | "end" = "middle";
  if (node.labelSide === "above") y = node.y - half - 7 - (rows.length - 1) * lineHeight;
  else if (node.labelSide === "below") y = node.y + half + 4 + font;
  else {
    x = node.labelSide === "right" ? node.x + half + 7 : node.x - half - 7;
    anchor = node.labelSide === "right" ? "start" : "end";
    y = node.y - ((rows.length - 1) * lineHeight) / 2 + font * 0.36;
  }
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fontSize={font}
      fontWeight={600}
      className={`transition-colors duration-300 ${active ? "fill-ink-foreground" : "fill-ink-foreground-muted"}`}
    >
      {rows.map((r, i) => (
        <tspan key={i} x={x} dy={i ? lineHeight : 0}>
          {r}
        </tspan>
      ))}
    </text>
  );
}

// Memoised: a step change re-renders only the nodes whose state changed.
const Node = memo(function Node({ node, layout, state }: { node: LaidNode; layout: Layout; state: "active" | "visited" | "idle" }) {
  const Icon = ICONS[node.icon];
  const base = NODE_STYLE[node.kind];
  const look = state === "active" ? ACTIVE : base;
  const s = layout.size;
  const icon = Math.round(s * 0.46);
  const round = node.kind === "sender";
  return (
    <g>
      {state === "active" && (
        <rect
          x={node.x - s / 2 - 5}
          y={node.y - s / 2 - 5}
          width={s + 10}
          height={s + 10}
          rx={round ? (s + 10) / 2 : 15}
          fill="rgb(242 182 50 / 0.16)"
          className="flow-pulse"
        />
      )}
      <rect
        x={node.x - s / 2}
        y={node.y - s / 2}
        width={s}
        height={s}
        rx={round ? s / 2 : Math.round(s * 0.28)}
        fill={look.fill}
        stroke={state === "visited" && node.kind === "step" ? "#5560c4" : look.stroke}
        strokeWidth={1.5}
        strokeDasharray={state === "active" ? undefined : base.dash}
        style={{ transition: "fill .3s, stroke .3s" }}
      />
      <Icon x={node.x - icon / 2} y={node.y - icon / 2} width={icon} height={icon} color={state === "visited" && node.kind === "step" ? "#dfe2ff" : look.icon} strokeWidth={2} />
      <Label node={node} layout={layout} active={state === "active"} />
    </g>
  );
});

/** Lines, arrows, the exception lane and the return-path notes: redrawn only when the layout changes. */
const Backdrop = memo(function Backdrop({ layout }: { layout: Layout }) {
  const { lane } = layout;
  return (
    <>
      <defs>
        {(Object.keys(STROKE) as EdgeTone[]).map((t) => (
          <marker key={t} id={`flow-arrow-${t}`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M1,1 L7,4 L1,7" fill="none" stroke={STROKE[t]} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </marker>
        ))}
      </defs>

      {lane && (
        <g>
          <rect x={lane.x} y={lane.y} width={lane.w} height={lane.h} rx={16} fill="rgb(122 51 70 / 0.12)" stroke="rgb(240 96 104 / 0.35)" strokeDasharray="5 4" />
          {/* Header row, starting right of Error Start so the way in (straight down onto it) stays clear. */}
          <text x={lane.start.x + lane.startR + 8} y={lane.y + 16} fontSize={layout.font} fontWeight={700} className="fill-[#f2a7b2]">
            {lane.name}
          </text>
          <circle cx={lane.start.x} cy={lane.start.y} r={lane.startR} fill="#2c1730" stroke="#f06068" strokeWidth={1.5} />
          <Zap x={lane.start.x - lane.startR * 0.6} y={lane.start.y - lane.startR * 0.6} width={lane.startR * 1.2} height={lane.startR * 1.2} color="#f06068" strokeWidth={2.4} />
        </g>
      )}

      {layout.edges.map((e, i) => (
        <path
          key={i}
          d={e.d}
          fill="none"
          stroke={STROKE[e.tone]}
          strokeWidth={e.tone === "main" ? 2 : 1.6}
          strokeDasharray={e.dashed ? "5 4" : undefined}
          strokeLinejoin="round"
          markerEnd={e.arrow ? `url(#flow-arrow-${e.tone})` : undefined}
        />
      ))}
      {layout.notes.map((n) => (
        <text key={n.text} x={n.x} y={n.y} textAnchor="middle" fontSize={layout.font - 0.5} fontWeight={600} fill={STROKE[n.tone]}>
          {n.text}
        </text>
      ))}
    </>
  );
});

/**
 * The response card: an API's answer on a receiver frame, or what the sender
 * gets back on a reply frame. It goes in the canvas corner diagonally away
 * from the active node, so the node and the envelope stay in sight (on a
 * phone it spans the canvas, top or bottom), and fades in once the envelope
 * has arrived. Long bodies scroll inside the card.
 */
function ResponseCard({ frame, layout, senderLabel, delay, expanded }: { frame: FlowFrame; layout: Layout; senderLabel: string; delay: number; expanded: boolean }) {
  const response = frame.response!;
  const n = nodeAt(layout, frame.at);
  const reply = frame.at === FLOW_REPLY;
  const narrow = layout.width < 560;
  const width = narrow ? layout.width - 16 : Math.min(expanded ? 380 : 320, Math.round(layout.width * 0.46));
  const place: React.CSSProperties = n.y < layout.height / 2 ? { bottom: 8 } : { top: 8 };
  if (narrow || n.x > layout.width / 2) place.left = 8;
  else place.right = 8;

  const ok = response.status.trim().startsWith("2");
  const title = reply ? `Diterima ${senderLabel.replace(/\n/g, " ")}` : `Respons ${n.label.replace(/\n/g, " ")}`;
  return (
    <div
      className="flow-card absolute z-[3] overflow-hidden rounded-[12px] border border-[#3d4596] bg-[rgb(17_21_62/0.96)] shadow-[0_14px_32px_-10px_rgb(0_0_0/0.6)]"
      style={{ width, animationDelay: `${delay}ms`, ...place }}
    >
      <div className="flex items-center gap-2 border-b border-[#2c3378] px-2.5 py-1.5">
        <span className="min-w-0 flex-1 truncate text-[0.6875rem] font-bold text-ink-foreground">{title}</span>
        <span
          className={`shrink-0 rounded-full px-2 py-px font-mono text-[0.625rem] font-bold ${ok ? "bg-[#1d4d39] text-[#9ff0c6]" : "bg-[#5a1f2a] text-[#ffb3ba]"}`}
        >
          {response.status}
        </span>
      </div>
      <pre
        className={`m-0 overflow-auto whitespace-pre-wrap px-2.5 py-2 font-mono leading-snug text-[#dfe2ff] [overflow-wrap:anywhere] [scrollbar-width:thin] ${
          expanded ? "max-h-[22rem] text-xs" : narrow ? "max-h-[8.5rem] text-[0.6875rem]" : "max-h-[11rem] text-[0.6875rem]"
        }`}
      >
        {response.body}
      </pre>
    </div>
  );
}

interface Position {
  scenario: number;
  frame: number;
}

export function FlowPlayer({
  spec,
  caption,
  expanded = false,
  initial,
  onClose,
}: {
  spec: FlowSpec;
  caption?: React.ReactNode;
  /** Full-screen variant, rendered by the player itself in a dialog. */
  expanded?: boolean;
  initial?: Position & { paused: boolean };
  onClose?: () => void;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const envelopeRef = useRef<SVGGElement>(null);
  const trailRef = useRef<SVGPathElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [width, setWidth] = useState(0);
  const [zoom, setZoom] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Full screen draws the diagram larger and never narrower than 600px (phones
  // pan sideways); zoom then scales the drawing up further.
  const baseWidth = expanded ? Math.max(width, 600) : width || 640;
  const scale = expanded ? (width >= 900 ? 1.3 : 1.12) : 1;
  const layout = useMemo(() => layoutFlow(spec, baseWidth, scale), [spec, baseWidth, scale]);
  const z = expanded ? ZOOMS[zoom] : 1;

  const reduced = useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED).matches,
    () => false,
  );
  const [pos, setPos] = useState<Position>(initial ? { scenario: initial.scenario, frame: initial.frame } : { scenario: 0, frame: 0 });
  /** Set once the reader picks a tab or a step: playback then stays in that scenario. */
  const [pinned, setPinned] = useState(!!initial);
  const [paused, setPaused] = useState<boolean | null>(initial ? initial.paused : null);
  const [inView, setInView] = useState(expanded);
  const playing = (paused === null ? !reduced : !paused) && !open;

  const scenario = spec.scenarios[pos.scenario];
  const frames = scenario.frames;
  // Readers who ask for less motion get a still frame until they pick one.
  const frameIndex = reduced && paused === null ? Math.floor(frames.length / 2) : pos.frame;
  const frame = frames[frameIndex];
  const prev = frameIndex > 0 ? frames[frameIndex - 1] : null;

  // Every text a spot can show, so the figure is sized for the longest from the start.
  const allFrames = useMemo(() => spec.scenarios.flatMap((s) => s.frames), [spec]);
  const slotTexts = useMemo(() => spec.slots.map((_, i) => distinct(allFrames.map((f) => f.values[i]))), [spec, allFrames]);
  const captionTexts = useMemo(() => distinct(allFrames.map((f) => f.text)), [allFrames]);
  const maxFrames = Math.max(...spec.scenarios.map((s) => s.frames.length));

  const laneIds = useMemo(() => new Set(spec.exception?.steps.map((s) => s.id) ?? []), [spec]);
  const route = useMemo(() => (prev ? travelPath(layout, prev.at, frame.at) : [nodeAt(layout, frame.at)]), [layout, prev, frame.at]);
  const length = pathLength(route);
  // At rest the envelope sits on a corner of the node, below it when the label is above.
  const restOn = nodeAt(layout, frame.at);
  const corner = { x: layout.size * 0.32, y: (restOn.labelSide === "above" ? 0.56 : -0.56) * layout.size };
  const duration = reduced || length < 1 ? 0 : Math.round(Math.min(1900, Math.max(650, 420 + length * 2.6)));

  const inError = laneIds.has(frame.at) || (frame.at === FLOW_REPLY && (scenario.outcome === "error" || (prev && laneIds.has(prev.at))));
  const tone = inError ? "error" : frame.at === FLOW_REPLY ? "ok" : "request";
  const trailColor = inError ? "#f06068" : "#f2b632";
  const envelopeFill = tone === "error" ? "#ffc2c6" : tone === "ok" ? "#c5f2d9" : "#ffffff";

  // Move the envelope and draw the trail along the route.
  useEffect(() => {
    const env = envelopeRef.current;
    const trail = trailRef.current;
    if (!env) return;
    // At rest the envelope sits on the node's corner; it slides onto the line to travel.
    const place = (t: number) => {
      const p = pointAlong(route, t);
      const k = !duration ? 1 : t < 0.12 ? 1 - t / 0.12 : t > 0.88 ? (t - 0.88) / 0.12 : 0;
      env.setAttribute("transform", `translate(${(p.x + corner.x * k).toFixed(1)} ${(p.y + corner.y * k).toFixed(1)})`);
      trail?.setAttribute("stroke-dashoffset", String(1 - t));
    };
    if (!duration) {
      place(1);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      place(t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    place(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [route, duration, corner.x, corner.y]);

  // Auto-advance: through the scenario, then on to the next one unless pinned.
  // A response card gets a little longer to be read.
  useEffect(() => {
    if (!playing || !inView) return;
    const last = pos.frame === frames.length - 1;
    const t = setTimeout(
      () =>
        setPos((p) => {
          if (p.frame < frames.length - 1) return { ...p, frame: p.frame + 1 };
          return { scenario: pinned ? p.scenario : (p.scenario + 1) % spec.scenarios.length, frame: 0 };
        }),
      duration + (last ? DWELL_LAST : DWELL) + (frame.response ? 1200 : 0),
    );
    return () => clearTimeout(t);
  }, [playing, inView, pos, frames.length, duration, pinned, spec.scenarios.length, frame.response]);

  // Play only while the figure is on screen, so readers don't arrive mid-way and
  // nothing runs for a figure further down the page.
  useEffect(() => {
    if (expanded) return;
    const el = canvasRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, [expanded]);

  // Full screen can be wider than a phone: keep the active node in sight.
  const activeX = nodeAt(layout, frame.at).x;
  useEffect(() => {
    const el = canvasRef.current;
    if (!expanded || !el || el.scrollWidth <= el.clientWidth) return;
    el.scrollTo({ left: activeX * z - el.clientWidth / 2, behavior: reduced ? "auto" : "smooth" });
  }, [expanded, activeX, z, reduced]);

  // Full-screen dialog: Esc closes, the page behind doesn't scroll, focus starts on close.
  useEffect(() => {
    if (!expanded) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [expanded, onClose]);

  const visited = new Set(frames.slice(0, frameIndex).map((f) => (f.at === FLOW_REPLY ? "sender" : f.at)));
  const activeId = frame.at === FLOW_REPLY ? "sender" : frame.at;
  const end = route[route.length - 1];

  const pickScenario = (i: number) => {
    setPinned(true);
    setPos({ scenario: i, frame: 0 });
    if (paused) setPaused(false);
  };
  const togglePlay = () => {
    if (playing) setPaused(true);
    else {
      if (reduced && paused === null) setPos((p) => ({ ...p, frame: frameIndex }));
      setPaused(false);
    }
  };

  const iconButton = "grid h-[26px] w-[30px] shrink-0 cursor-pointer place-items-center rounded-[10px] border border-ink-border bg-ink-elevated text-ink-foreground-muted hover:text-ink-foreground disabled:cursor-default disabled:opacity-40";

  const figure = (
    <figure
      className={`grain relative m-0 overflow-hidden rounded-[22px] bg-ink p-3 font-sans text-ink-foreground shadow-[0_30px_60px_-20px_rgb(15_19_54/0.45),inset_0_0_0_1px_var(--ink-border)] sm:rounded-[26px] sm:p-[18px] ${
        expanded ? "min-h-full" : ""
      }`}
    >
      <div className="flex items-center gap-2 px-1 pb-3 pt-0.5">
        <span className="min-w-0 truncate font-mono text-[0.8125rem] text-ink-foreground-muted">
          <b className="font-semibold text-ink-foreground">{spec.name}</b> {spec.path}
        </span>
        {spec.status && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-positive/20 px-2.5 py-0.5 text-xs font-semibold text-[#b9f3d3] before:h-[7px] before:w-[7px] before:rounded-full before:bg-[#2fbf71] before:shadow-[0_0_0_3px_rgb(47_191_113/0.25)]">
            {spec.status}
          </span>
        )}
        <span className="ml-auto flex shrink-0 items-center gap-1.5">
          {expanded && (
            <>
              <button type="button" onClick={() => setZoom((v) => Math.max(0, v - 1))} disabled={zoom === 0} aria-label="Perkecil" className={iconButton}>
                <Minus className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button type="button" onClick={() => setZoom((v) => Math.min(ZOOMS.length - 1, v + 1))} disabled={zoom === ZOOMS.length - 1} aria-label="Perbesar" className={iconButton}>
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={togglePlay}
            aria-pressed={!playing}
            className="shrink-0 cursor-pointer rounded-[10px] border border-ink-border bg-ink-elevated px-2.5 py-1 text-xs font-semibold"
          >
            {playing ? "Jeda" : "Putar"}
          </button>
          {expanded ? (
            <button ref={closeRef} type="button" onClick={onClose} aria-label="Tutup layar penuh" className={iconButton}>
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : (
            <button type="button" onClick={() => setOpen(true)} aria-label="Lihat layar penuh" title="Lihat layar penuh" className={iconButton}>
              <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </span>
      </div>

      {spec.scenarios.length > 1 && (
        <div role="tablist" aria-label="Skenario" className="-mx-1 mb-2.5 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none]">
          {spec.scenarios.map((sc, i) => {
            const on = i === pos.scenario;
            const Icon = sc.outcome === "ok" ? CircleCheck : TriangleAlert;
            return (
              <button
                key={sc.label}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => pickScenario(i)}
                className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                  on ? "border-[#5560c4] bg-[#2a3180] text-ink-foreground" : "border-ink-border bg-transparent text-ink-foreground-muted hover:text-ink-foreground"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${sc.outcome === "ok" ? "text-[#5fd39a]" : "text-[#f2848b]"}`} aria-hidden="true" />
                {sc.label}
              </button>
            );
          })}
        </div>
      )}

      <div ref={canvasRef} className={`bg-grid-dark rounded-[18px] bg-ink-elevated ${expanded ? "overflow-auto" : "relative"}`} aria-hidden="true">
        <div className="relative" style={expanded ? { width: layout.width * z, height: layout.height * z } : undefined}>
          <div
            className="relative"
            style={expanded ? { width: layout.width, height: layout.height, transform: `scale(${z})`, transformOrigin: "0 0" } : undefined}
          >
            <svg
              viewBox={`0 0 ${layout.width} ${layout.height}`}
              width={expanded ? layout.width : undefined}
              height={expanded ? layout.height : undefined}
              className={`block transition-opacity duration-300 ${expanded ? "" : "h-auto w-full"} ${width ? "opacity-100" : "opacity-0"}`}
              fontFamily="inherit"
            >
              <Backdrop layout={layout} />

              <path
                key={`${pos.scenario}-${frameIndex}-${layout.width}`}
                ref={trailRef}
                d={toPathD(route)}
                pathLength={1}
                fill="none"
                stroke={trailColor}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="1 1"
                strokeDashoffset={0}
                opacity={0.85}
              />

              {[...layout.nodes.values()].map((n) => (
                <Node key={n.id} node={n} layout={layout} state={n.id === activeId ? "active" : visited.has(n.id) ? "visited" : "idle"} />
              ))}

              <g ref={envelopeRef} transform={`translate(${end.x + corner.x} ${end.y + corner.y})`} style={{ filter: "drop-shadow(0 4px 8px rgb(0 0 0 / 0.4))" }}>
                <rect x={-11} y={-8} width={22} height={16} rx={3} fill={envelopeFill} style={{ transition: "fill .3s" }} />
                <path d="M-10,-7 L0,1 L10,-7" fill="none" stroke="#9aa0cf" strokeWidth={1.3} strokeLinejoin="round" />
              </g>
            </svg>
            {frame.response && width > 0 && (
              <ResponseCard
                key={`${pos.scenario}-${frameIndex}`}
                frame={frame}
                layout={layout}
                senderLabel={spec.sender.label}
                delay={duration}
                expanded={expanded}
              />
            )}
          </div>
        </div>
      </div>

      <div className="mt-2.5 grid gap-2 sm:grid-cols-3">
        {spec.slots.map((s, i) => (
          <SlotBox key={s.title} title={s.title} note={s.note} values={slotTexts[i]} value={frame.values[i]} />
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-sm text-ink-foreground-muted [&_b]:font-semibold [&_b]:text-ink-foreground">
        {/* Fixed width: "10/11" is wider than "1/11" and would rewrap the caption. */}
        <span className="shrink-0 font-mono text-xs font-semibold text-kunyit" style={{ minWidth: `${2 * String(maxFrames).length + 1}ch` }}>
          {frameIndex + 1}/{frames.length}
        </span>
        <span aria-live="polite" className="min-w-0 basis-[calc(100%-2.5rem)] sm:flex-1 sm:basis-0">
          <Stack texts={captionTexts} current={frame.text} render={(t) => <Rich text={t} />} />
        </span>
        {/* As wide as the longest scenario's dots, so switching tabs doesn't rewrap the caption. */}
        <span className="ml-auto flex shrink-0 justify-end" style={{ width: maxFrames * 24 }}>
          {frames.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Langkah ${i + 1}`}
              aria-current={i === frameIndex ? "step" : undefined}
              onClick={() => {
                setPinned(true);
                setPaused(true);
                setPos((p) => ({ ...p, frame: i }));
              }}
              className="grid h-6 min-w-6 cursor-pointer place-items-center"
            >
              <span className={`block h-1.5 rounded-full transition-all ${i === frameIndex ? "w-4 bg-kunyit" : "w-1.5 bg-ink-border"}`} />
            </button>
          ))}
        </span>
      </div>

      {caption && <figcaption className="mt-3 border-t border-ink-border px-1 pb-0.5 pt-3 text-[0.84375rem]">{caption}</figcaption>}
    </figure>
  );

  return (
    <>
      {figure}
      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${spec.name}, layar penuh`}
            className="fixed inset-0 z-[90] overflow-y-auto bg-[rgb(8_10_32/0.88)] p-2 backdrop-blur-sm sm:p-6"
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <div className="mx-auto max-w-[1240px]">
              <FlowPlayer
                spec={spec}
                expanded
                initial={{ ...pos, frame: frameIndex, paused: !playing && paused !== null }}
                onClose={() => setOpen(false)}
              />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
