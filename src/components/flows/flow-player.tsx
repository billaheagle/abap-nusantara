"use client";

import { Fragment, memo, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  ArrowLeftRight,
  Braces,
  Check,
  CircleCheck,
  Filter,
  Globe,
  KeyRound,
  Network,
  PenLine,
  Send,
  SlidersHorizontal,
  TriangleAlert,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { FLOW_REPLY, type FlowIcon, type FlowSpec } from "@/lib/flows/types";
import { layoutFlow, nodeAt, pathLength, pointAlong, toPathD, travelPath, type EdgeTone, type LaidNode, type Layout } from "@/lib/flows/layout";

/**
 * One message walking through an iFlow. The diagram is laid out from the spec
 * (lib/flows/layout.ts) at the canvas's real width; the envelope travels the
 * drawn lines between frames, leaving a trail, and the three panels below show
 * what the message carries at each frame. Scenarios (success, error cases) sit
 * in tabs and play one after another until the reader picks one.
 *
 * Articles supply the spec from their ```flow block, validated on the server
 * (lib/flows/attach.ts); the home hero plays the block from its source article.
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

function subscribeReduced(onChange: () => void) {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/** "**bold** rest" → step names in bold. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <b key={i}>{part}</b> : <Fragment key={i}>{part}</Fragment>))}
    </>
  );
}

function Slot({ title, note, value }: { title: string; note: string; value: string }) {
  const [flash, setFlash] = useState(false);
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current === value) return;
    prev.current = value;
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 1100);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div className="min-w-0 rounded-[14px] border border-ink-border bg-ink-elevated px-3 py-2.5 sm:min-h-[5.75rem]">
      <p className="mb-1.5 flex justify-between gap-1.5 text-xs font-bold text-ink-foreground-muted">
        {title} <span className="text-right font-medium opacity-80">{note}</span>
      </p>
      <pre
        className={`m-0 whitespace-pre-wrap font-mono text-xs leading-normal [overflow-wrap:anywhere] transition-colors duration-500 ${
          flash ? "text-kunyit" : "text-ink-foreground"
        }`}
      >
        {value}
      </pre>
    </div>
  );
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

export function FlowPlayer({ spec, caption }: { spec: FlowSpec; caption?: React.ReactNode }) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const envelopeRef = useRef<SVGGElement>(null);
  const trailRef = useRef<SVGPathElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Laid out at a desktop width for the server render, then at the real width.
  const layout = useMemo(() => layoutFlow(spec, width || 640), [spec, width]);

  const reduced = useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED).matches,
    () => false,
  );
  const [pos, setPos] = useState({ scenario: 0, frame: 0 });
  /** Set once the reader picks a tab or a step: playback then stays in that scenario. */
  const [pinned, setPinned] = useState(false);
  const [paused, setPaused] = useState<boolean | null>(null);
  const [inView, setInView] = useState(false);
  const playing = paused === null ? !reduced : !paused;

  const scenario = spec.scenarios[pos.scenario];
  const frames = scenario.frames;
  // Readers who ask for less motion get a still frame until they pick one.
  const frameIndex = reduced && paused === null ? Math.floor(frames.length / 2) : pos.frame;
  const frame = frames[frameIndex];
  const prev = frameIndex > 0 ? frames[frameIndex - 1] : null;

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
  useEffect(() => {
    if (!playing || !inView) return;
    const last = pos.frame === frames.length - 1;
    const t = setTimeout(
      () =>
        setPos((p) => {
          if (p.frame < frames.length - 1) return { ...p, frame: p.frame + 1 };
          return { scenario: pinned ? p.scenario : (p.scenario + 1) % spec.scenarios.length, frame: 0 };
        }),
      duration + (last ? DWELL_LAST : DWELL),
    );
    return () => clearTimeout(t);
  }, [playing, inView, pos, frames.length, duration, pinned, spec.scenarios.length]);

  // Play only while the figure is on screen, so readers don't arrive mid-way and
  // nothing runs for a figure further down the page.
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

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


  return (
    <figure className="grain relative m-0 overflow-hidden rounded-[22px] bg-ink p-3 font-sans text-ink-foreground shadow-[0_30px_60px_-20px_rgb(15_19_54/0.45),inset_0_0_0_1px_var(--ink-border)] sm:rounded-[26px] sm:p-[18px]">
      <div className="flex items-center gap-2.5 px-1 pb-3 pt-0.5">
        <span className="min-w-0 truncate font-mono text-[0.8125rem] text-ink-foreground-muted">
          <b className="font-semibold text-ink-foreground">{spec.name}</b> {spec.path}
        </span>
        {spec.status && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-positive/20 px-2.5 py-0.5 text-xs font-semibold text-[#b9f3d3] before:h-[7px] before:w-[7px] before:rounded-full before:bg-[#2fbf71] before:shadow-[0_0_0_3px_rgb(47_191_113/0.25)]">
            {spec.status}
          </span>
        )}
        <button
          type="button"
          onClick={togglePlay}
          aria-pressed={!playing}
          className="ml-auto shrink-0 cursor-pointer rounded-[10px] border border-ink-border bg-ink-elevated px-2.5 py-1 text-xs font-semibold"
        >
          {playing ? "Jeda" : "Putar"}
        </button>
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

      <div ref={canvasRef} className="bg-grid-dark relative rounded-[18px] bg-ink-elevated" aria-hidden="true">
        <svg
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          className={`block h-auto w-full transition-opacity duration-300 ${width ? "opacity-100" : "opacity-0"}`}
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
      </div>

      <div className="mt-2.5 grid gap-2 sm:grid-cols-3">
        {spec.slots.map((s, i) => (
          <Slot key={s.title} title={s.title} note={s.note} value={frame.values[i]} />
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-sm text-ink-foreground-muted [&_b]:font-semibold [&_b]:text-ink-foreground">
        <span className="shrink-0 font-mono text-xs font-semibold text-kunyit">
          {frameIndex + 1}/{frames.length}
        </span>
        <span aria-live="polite" className="min-w-0 basis-[calc(100%-2.5rem)] sm:flex-1 sm:basis-0">
          <Rich text={frame.text} />
        </span>
        <span className="ml-auto flex shrink-0">
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
}
