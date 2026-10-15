"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowLeftRight, Braces, Check, Globe, Send, SlidersHorizontal, type LucideIcon } from "lucide-react";

/**
 * One message walking through the currency-rate iFlow from series 2.
 * Body, header and property update at every step, which is the whole point
 * of the "envelope" article: what travels, and what stays behind.
 */

interface FlowNode {
  label: React.ReactNode;
  icon: LucideIcon;
  x: number;
  y: number;
  kind?: "end" | "api";
  labelAt?: "top" | "right";
}

const NODES: FlowNode[] = [
  { label: "Postman", icon: Send, x: 8, y: 38, kind: "end" },
  { label: <>Content<br />Modifier</>, icon: SlidersHorizontal, x: 30, y: 38 },
  { label: "Request Reply", icon: ArrowLeftRight, x: 52, y: 38, labelAt: "top" },
  { label: <>Groovy<br />Script</>, icon: Braces, x: 74, y: 38 },
  { label: "Balas", icon: Check, x: 92, y: 38, kind: "end" },
  { label: "API kurs", icon: Globe, x: 52, y: 80, kind: "api", labelAt: "right" },
];

interface Step {
  node: number;
  text: React.ReactNode;
  body: string;
  header: string;
  property: string;
}

const BODY_IN = '{ "from": "USD",\n  "to": "IDR" }';
const BODY_OUT = '{ "pair": "USD/IDR",\n  "rate": 16234.5 }';
const JSON_HEADER = "Content-Type:\n application/json";
const PROPS = "base = USD\ntarget = IDR";

const STEPS: Step[] = [
  { node: 0, text: <><b>Postman</b> mengirim pasangan mata uang.</>, body: BODY_IN, header: JSON_HEADER, property: "(kosong)" },
  { node: 1, text: <><b>Content Modifier</b> menyalin nilai ke property.</>, body: BODY_IN, header: JSON_HEADER, property: PROPS },
  { node: 2, text: <><b>Request Reply</b> menyusun address dari property.</>, body: BODY_IN, header: "CamelHttpQuery:\n base=USD", property: PROPS },
  { node: 5, text: <><b>API kurs</b> menjawab. Body lama tertimpa.</>, body: '{ "rates": {\n  "IDR": 16234.5 } }', header: "CamelHttp\nResponseCode: 200", property: PROPS },
  { node: 3, text: <><b>Groovy Script</b> menyusun JSON versi sendiri.</>, body: BODY_OUT, header: JSON_HEADER, property: PROPS },
  { node: 4, text: <><b>Balasan</b> sampai. Property tidak ikut keluar.</>, body: BODY_OUT, header: JSON_HEADER, property: "(tidak terkirim)" },
];

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
        {title} <span className="font-medium opacity-80">{note}</span>
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

const REDUCED = "(prefers-reduced-motion: reduce)";

function subscribeReduced(onChange: () => void) {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export function IflowPlayer({ articleHref, articleTitle }: { articleHref?: string; articleTitle?: string }) {
  const reduced = useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED).matches,
    () => false,
  );
  const [chosen, setChosen] = useState<{ step: number; playing: boolean } | null>(null);
  const [autoStep, setAutoStep] = useState(0);

  // Readers who ask for less motion get a still frame at the most telling
  // step until they pick a step or press play themselves.
  const playing = chosen ? chosen.playing : !reduced;
  const step = chosen && !chosen.playing ? chosen.step : reduced && !chosen ? 3 : autoStep;

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => setAutoStep((s) => (s + 1) % STEPS.length), autoStep === STEPS.length - 1 ? 3200 : 2200);
    return () => clearTimeout(t);
  }, [playing, autoStep]);

  const togglePlay = () => {
    if (playing) setChosen({ step, playing: false });
    else {
      setAutoStep(step);
      setChosen({ step, playing: true });
    }
  };

  const current = STEPS[step];
  const visited = new Set(STEPS.slice(0, step).map((s) => s.node));
  const at = NODES[current.node];

  return (
    <figure className="grain relative m-0 overflow-hidden rounded-[22px] bg-ink p-3 text-ink-foreground shadow-[0_30px_60px_-20px_rgb(15_19_54/0.45),inset_0_0_0_1px_var(--ink-border)] sm:rounded-[26px] sm:p-[18px]">
      <div className="flex items-center gap-2.5 px-1 pb-3.5 pt-0.5">
        <span className="min-w-0 truncate font-mono text-[0.8125rem] text-ink-foreground-muted">
          <b className="font-semibold text-ink-foreground">Kurs_Mata_Uang</b> /http/fx/latest
        </span>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-positive/20 px-2.5 py-0.5 text-xs font-semibold text-[#b9f3d3] before:h-[7px] before:w-[7px] before:rounded-full before:bg-[#2fbf71] before:shadow-[0_0_0_3px_rgb(47_191_113/0.25)]">
          Started
        </span>
        <button
          type="button"
          onClick={togglePlay}
          aria-pressed={!playing}
          className="ml-auto shrink-0 rounded-[10px] border border-ink-border bg-ink-elevated px-2.5 py-1 text-xs font-semibold"
        >
          {playing ? "Jeda" : "Putar"}
        </button>
      </div>

      <div className="bg-grid-dark relative h-[190px] rounded-[18px] bg-ink-elevated sm:h-[210px]" aria-hidden="true">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <line x1="8" y1="38" x2="92" y2="38" stroke="#353c88" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          <line x1="52" y1="38" x2="52" y2="80" stroke="#1d5f59" strokeWidth="2" strokeDasharray="5 5" vectorEffect="non-scaling-stroke" />
        </svg>
        {NODES.map((n, i) => {
          const on = i === current.node;
          const done = visited.has(i) && !on;
          const Icon = n.icon;
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
                      : done
                        ? "border-[#4a52b0] bg-[#22286a] text-ink-foreground"
                        : "border-[#343b8a] bg-[#22286a] text-ink-foreground-muted"
                }`}
              >
                <Icon className="h-[18px] w-[18px] sm:h-5 sm:w-5" strokeWidth={2} />
              </div>
              <span
                className={`absolute whitespace-nowrap text-center text-[0.65625rem] leading-tight font-semibold transition-colors sm:text-[0.71875rem] ${
                  on ? "text-ink-foreground" : "text-ink-foreground-muted"
                } ${
                  n.labelAt === "top"
                    ? "bottom-[calc(100%+6px)]"
                    : n.labelAt === "right"
                      ? "left-[calc(100%+10px)] top-1/2 -translate-y-1/2 text-left"
                      : "top-[calc(100%+6px)]"
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
        <Slot title="Body" note="ikut terkirim" value={current.body} />
        <Slot title="Header" note="ikut terkirim" value={current.header} />
        <Slot title="Property" note="tinggal di iFlow" value={current.property} />
      </div>

      <div className="mt-3 flex items-center gap-3 px-1 text-sm text-ink-foreground-muted [&_b]:font-semibold [&_b]:text-ink-foreground">
        <span className="shrink-0 font-mono text-xs font-semibold text-kunyit">
          {step + 1}/{STEPS.length}
        </span>
        <span aria-live="polite" className="min-w-0">
          {current.text}
        </span>
        <span className="ml-auto flex shrink-0 gap-1">
          {STEPS.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Langkah ${i + 1}`}
              aria-current={i === step ? "step" : undefined}
              onClick={() => setChosen({ step: i, playing: false })}
              className={`h-1.5 rounded-full transition-all ${i === step ? "w-4 bg-kunyit" : "w-1.5 bg-ink-border"}`}
            />
          ))}
        </span>
      </div>

      {articleHref && articleTitle && (
        <figcaption className="mt-3 border-t border-ink-border px-1 pb-0.5 pt-3 text-[0.84375rem]">
          Satu pesan melewati iFlow dari{" "}
          <Link href={articleHref} className="font-semibold text-ink-foreground underline decoration-kunyit underline-offset-[3px]">
            {articleTitle}
          </Link>
          .
        </figcaption>
      )}
    </figure>
  );
}
