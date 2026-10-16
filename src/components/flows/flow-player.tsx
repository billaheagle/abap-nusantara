"use client";

import { Fragment, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  ArrowLeftRight,
  Braces,
  Check,
  Filter,
  Globe,
  KeyRound,
  Network,
  PenLine,
  Send,
  SlidersHorizontal,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import type { FlowIcon, FlowSpec } from "@/lib/flows/schema";

/**
 * One message walking through an iFlow, step by step: the envelope moves to
 * the active step and the three panels below show what the message carries
 * there. Articles supply the spec from their ```flow block (lib/flows/schema.ts);
 * the home hero uses lib/flows/home-flow.ts.
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

const REDUCED = "(prefers-reduced-motion: reduce)";

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

export function FlowPlayer({ spec, caption }: { spec: FlowSpec; caption?: React.ReactNode }) {
  const steps = spec.steps;

  const reduced = useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED).matches,
    () => false,
  );
  const [chosen, setChosen] = useState<{ step: number; playing: boolean } | null>(null);
  const [autoStep, setAutoStep] = useState(0);

  // Readers who ask for less motion get a still frame at the middle step
  // until they pick a step or press play themselves.
  const stillStep = Math.floor(steps.length / 2);
  const playing = chosen ? chosen.playing : !reduced;
  const step = chosen && !chosen.playing ? chosen.step : reduced && !chosen ? stillStep : autoStep;

  useEffect(() => {
    if (!playing || steps.length === 0) return;
    const t = setTimeout(() => setAutoStep((s) => (s + 1) % steps.length), autoStep === steps.length - 1 ? 3400 : 2600);
    return () => clearTimeout(t);
  }, [playing, autoStep, steps.length]);

  const togglePlay = () => {
    if (playing) setChosen({ step, playing: false });
    else {
      setAutoStep(step);
      setChosen({ step, playing: true });
    }
  };

  const current = steps[step];
  const visited = new Set(steps.slice(0, step).map((s) => s.node));
  const at = spec.nodes[current.node];
  const height = spec.height ?? 210;

  return (
    <figure className="grain relative m-0 overflow-hidden rounded-[22px] bg-ink p-3 font-sans text-ink-foreground shadow-[0_30px_60px_-20px_rgb(15_19_54/0.45),inset_0_0_0_1px_var(--ink-border)] sm:rounded-[26px] sm:p-[18px]">
      <div className="flex items-center gap-2.5 px-1 pb-3.5 pt-0.5">
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
          className="ml-auto shrink-0 rounded-[10px] border border-ink-border bg-ink-elevated px-2.5 py-1 text-xs font-semibold"
        >
          {playing ? "Jeda" : "Putar"}
        </button>
      </div>

      <div
        className="bg-grid-dark relative rounded-[18px] bg-ink-elevated"
        style={{ height: `clamp(${height - 20}px, 52vw, ${height}px)` }}
        aria-hidden="true"
      >
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {spec.edges.map((e, i) => {
            const a = spec.nodes[e.from];
            const b = spec.nodes[e.to];
            return (
              <line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={e.dashed ? "#1d5f59" : "#353c88"}
                strokeWidth="2"
                strokeDasharray={e.dashed ? "5 5" : undefined}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>
        {spec.nodes.map((n, i) => {
          const on = i === current.node;
          const done = visited.has(i) && !on;
          const Icon = ICONS[n.icon];
          const side = n.labelAt ?? "bottom";
          return (
            <div key={i} className="absolute grid -translate-x-1/2 -translate-y-1/2 justify-items-center" style={{ left: `${n.x}%`, top: `${n.y}%` }}>
              <div
                className={`grid h-[38px] w-[38px] place-items-center border transition-all duration-300 sm:h-[46px] sm:w-[46px] ${
                  n.kind === "end" ? "rounded-full" : "rounded-[11px] sm:rounded-[14px]"
                } ${
                  on
                    ? "border-kunyit bg-kunyit text-[#241800] shadow-[0_0_0_6px_rgb(242_182_50/0.18),0_0_30px_rgb(242_182_50/0.45)]"
                    : n.kind === "api"
                      ? "border-[#1d5f59] bg-[#123c3a] text-[#8ce3cf]"
                      : n.kind === "sub"
                        ? "border-[#5a3f8a] bg-[#2b2160] text-[#cbb8ff]"
                        : done
                          ? "border-[#4a52b0] bg-[#22286a] text-ink-foreground"
                          : "border-[#343b8a] bg-[#22286a] text-ink-foreground-muted"
                }`}
              >
                <Icon className="h-[18px] w-[18px] sm:h-5 sm:w-5" strokeWidth={2} />
              </div>
              <span
                className={`absolute whitespace-pre text-[0.65625rem] leading-tight font-semibold transition-colors sm:text-[0.71875rem] ${
                  on ? "text-ink-foreground" : "text-ink-foreground-muted"
                } ${
                  side === "top"
                    ? "bottom-[calc(100%+6px)] text-center"
                    : side === "right"
                      ? "left-[calc(100%+8px)] top-1/2 -translate-y-1/2 text-left"
                      : side === "left"
                        ? "right-[calc(100%+8px)] top-1/2 -translate-y-1/2 text-right"
                        : "top-[calc(100%+6px)] text-center"
                }`}
              >
                {n.label}
              </span>
            </div>
          );
        })}
        <div
          className="absolute z-[2] -ml-[13px] -mt-[9.5px] h-[19px] w-[26px] rounded-[5px] bg-white shadow-[0_6px_16px_rgb(0_0_0/0.35)] transition-[left,top] duration-900 ease-[cubic-bezier(.65,0,.35,1)] before:absolute before:inset-x-0 before:top-0 before:h-[60%] before:bg-[linear-gradient(to_bottom_right,transparent_49%,#c9cdea_50%,transparent_52%),linear-gradient(to_bottom_left,transparent_49%,#c9cdea_50%,transparent_52%)]"
          style={{ left: `${at.x}%`, top: `${at.y}%` }}
        />
      </div>

      <div className="mt-2.5 grid gap-2 sm:grid-cols-3">
        {spec.slots.map((s, i) => (
          <Slot key={s.title} title={s.title} note={s.note} value={current.values[i]} />
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-sm text-ink-foreground-muted [&_b]:font-semibold [&_b]:text-ink-foreground">
        <span className="shrink-0 font-mono text-xs font-semibold text-kunyit">
          {step + 1}/{steps.length}
        </span>
        <span aria-live="polite" className="min-w-0 basis-[calc(100%-2.5rem)] sm:flex-1 sm:basis-0">
          <Rich text={current.text} />
        </span>
        <span className="ml-auto flex shrink-0">
          {steps.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Langkah ${i + 1}`}
              aria-current={i === step ? "step" : undefined}
              onClick={() => setChosen({ step: i, playing: false })}
              className="grid h-6 min-w-6 place-items-center"
            >
              <span className={`block h-1.5 rounded-full transition-all ${i === step ? "w-4 bg-kunyit" : "w-1.5 bg-ink-border"}`} />
            </button>
          ))}
        </span>
      </div>

      {caption && <figcaption className="mt-3 border-t border-ink-border px-1 pb-0.5 pt-3 text-[0.84375rem]">{caption}</figcaption>}
    </figure>
  );
}
