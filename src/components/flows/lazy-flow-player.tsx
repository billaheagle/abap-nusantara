"use client";

import { Fragment, lazy, Suspense, useEffect, useRef, useState } from "react";
import { layoutFlow } from "@/lib/flows/layout";
import type { FlowSpec } from "@/lib/flows/types";

/**
 * Article flows sit below the fold, so the player's code (and its first
 * render) waits until the figure is about a screen away. Until then a static
 * shell with the same frame, tabs, canvas height, first-frame panels and
 * caption holds the space, so nothing jumps when the player takes over.
 */

const FlowPlayer = lazy(() => import("./flow-player").then((m) => ({ default: m.FlowPlayer })));

function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <b key={i}>{part}</b> : <Fragment key={i}>{part}</Fragment>))}
    </>
  );
}

function Shell({ spec, caption }: { spec: FlowSpec; caption?: React.ReactNode }) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  useEffect(() => {
    if (canvasRef.current) setWidth(Math.round(canvasRef.current.getBoundingClientRect().width));
  }, []);

  const frames = spec.scenarios[0].frames;
  const first = frames[0];
  return (
    <figure className="grain relative m-0 overflow-hidden rounded-[22px] bg-ink p-3 font-sans text-ink-foreground shadow-[0_30px_60px_-20px_rgb(15_19_54/0.45),inset_0_0_0_1px_var(--ink-border)] sm:rounded-[26px] sm:p-[18px]">
      <div className="flex items-center gap-2.5 px-1 pb-3 pt-0.5">
        <span className="min-w-0 truncate font-mono text-[0.8125rem] text-ink-foreground-muted">
          <b className="font-semibold text-ink-foreground">{spec.name}</b> {spec.path}
        </span>
        <span className="ml-auto shrink-0 rounded-[10px] border border-ink-border bg-ink-elevated px-2.5 py-1 text-xs font-semibold">Jeda</span>
      </div>
      {spec.scenarios.length > 1 && (
        <div className="-mx-1 mb-2.5 flex gap-1.5 overflow-hidden px-1 pb-0.5">
          {spec.scenarios.map((sc) => (
            <span
              key={sc.label}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-ink-border px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-ink-foreground-muted before:h-3.5 before:w-3.5"
            >
              {sc.label}
            </span>
          ))}
        </div>
      )}
      <div ref={canvasRef} className="bg-grid-dark rounded-[18px] bg-ink-elevated" style={{ height: layoutFlow(spec, width).height }} />
      <div className="mt-2.5 grid gap-2 sm:grid-cols-3">
        {spec.slots.map((s, i) => (
          <div key={s.title} className="min-w-0 rounded-[14px] border border-ink-border bg-ink-elevated px-3 py-2.5 sm:min-h-[5.75rem]">
            <p className="mb-1.5 flex justify-between gap-1.5 text-xs font-bold text-ink-foreground-muted">
              {s.title} <span className="text-right font-medium opacity-80">{s.note}</span>
            </p>
            <pre className="m-0 whitespace-pre-wrap font-mono text-xs leading-normal text-ink-foreground [overflow-wrap:anywhere]">{first.values[i]}</pre>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-sm text-ink-foreground-muted [&_b]:font-semibold [&_b]:text-ink-foreground">
        <span className="shrink-0 font-mono text-xs font-semibold text-kunyit">1/{frames.length}</span>
        <span className="min-w-0 basis-[calc(100%-2.5rem)] sm:flex-1 sm:basis-0">
          <Rich text={first.text} />
        </span>
        <span className="ml-auto flex h-6 shrink-0" style={{ width: frames.length * 24 }} />
      </div>
      {caption && <figcaption className="mt-3 border-t border-ink-border px-1 pb-0.5 pt-3 text-[0.84375rem]">{caption}</figcaption>}
    </figure>
  );
}

export function LazyFlowPlayer({ spec, caption }: { spec: FlowSpec; caption?: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setNear(true);
        io.disconnect();
      },
      { rootMargin: "100% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const shell = <Shell spec={spec} caption={caption} />;
  return <div ref={ref}>{near ? <Suspense fallback={shell}>{<FlowPlayer spec={spec} caption={caption} />}</Suspense> : shell}</div>;
}
