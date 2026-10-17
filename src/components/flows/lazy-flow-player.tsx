"use client";

import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Maximize2 } from "lucide-react";
import { layoutFlow } from "@/lib/flows/layout";
import type { FlowSpec } from "@/lib/flows/types";
import { Rich, SlotBox, distinct } from "./frame-parts";

/**
 * Article flows sit below the fold, so the player's code (and its first
 * render) waits until the figure is about a screen away. Until then a static
 * shell built from the same parts (frame, tabs, canvas height, panels sized
 * for their longest text, caption) holds the space, so nothing jumps when the
 * player takes over.
 */

/**
 * After a deploy, a page that was already open can ask for a chunk of the
 * previous build that no longer exists. Try once more, then settle for the
 * shell (with a reload hint) instead of letting the error take the page down.
 */
const FlowPlayer = lazy(() =>
  import("./flow-player")
    .catch(() => import("./flow-player"))
    .then((m) => ({ default: m.FlowPlayer }))
    .catch(() => ({ default: (props: { spec: FlowSpec; caption?: React.ReactNode }) => <Shell {...props} failed /> })),
);

function Shell({ spec, caption, failed = false }: { spec: FlowSpec; caption?: React.ReactNode; failed?: boolean }) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  useEffect(() => {
    if (canvasRef.current) setWidth(Math.round(canvasRef.current.getBoundingClientRect().width));
  }, []);

  const allFrames = useMemo(() => spec.scenarios.flatMap((s) => s.frames), [spec]);
  const frames = spec.scenarios[0].frames;
  const first = frames[0];
  const maxFrames = Math.max(...spec.scenarios.map((s) => s.frames.length));
  const captionTexts = distinct(allFrames.map((f) => f.text));
  const iconButton = "grid h-[26px] w-[30px] shrink-0 place-items-center rounded-[10px] border border-ink-border bg-ink-elevated text-ink-foreground-muted";

  return (
    <figure className="grain relative m-0 overflow-hidden rounded-[22px] bg-ink p-3 font-sans text-ink-foreground shadow-[0_30px_60px_-20px_rgb(15_19_54/0.45),inset_0_0_0_1px_var(--ink-border)] sm:rounded-[26px] sm:p-[18px]">
      <div className="flex items-center gap-2 px-1 pb-3 pt-0.5">
        <span className="min-w-0 truncate font-mono text-[0.8125rem] text-ink-foreground-muted">
          <b className="font-semibold text-ink-foreground">{spec.name}</b> {spec.path}
        </span>
        {spec.status && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-positive/20 px-2.5 py-0.5 text-xs font-semibold text-[#b9f3d3] before:h-[7px] before:w-[7px] before:rounded-full before:bg-[#2fbf71]">
            {spec.status}
          </span>
        )}
        <span className="ml-auto flex shrink-0 items-center gap-1.5">
          <span className="shrink-0 rounded-[10px] border border-ink-border bg-ink-elevated px-2.5 py-1 text-xs font-semibold">Jeda</span>
          <span className={iconButton}>
            <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </span>
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
          <SlotBox key={s.title} title={s.title} note={s.note} values={distinct(allFrames.map((f) => f.values[i]))} value={first.values[i]} />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-sm text-ink-foreground-muted [&_b]:font-semibold [&_b]:text-ink-foreground">
        <span className="shrink-0 font-mono text-xs font-semibold text-kunyit" style={{ minWidth: `${2 * String(maxFrames).length + 1}ch` }}>
          1/{frames.length}
        </span>
        <span className="min-w-0 basis-[calc(100%-2.5rem)] sm:flex-1 sm:basis-0">
          <span className="grid">
            {captionTexts.map((t) => (
              <span key={t} className={`col-start-1 row-start-1 ${t === first.text ? "" : "invisible"}`}>
                <Rich text={t} />
              </span>
            ))}
          </span>
        </span>
        <span className="ml-auto flex h-6 shrink-0" style={{ width: maxFrames * 24 }} />
      </div>
      {failed ? (
        <figcaption className="mt-3 border-t border-ink-border px-1 pb-0.5 pt-3 text-[0.84375rem]">
          Animasi tidak bisa dimuat.{" "}
          <button type="button" onClick={() => window.location.reload()} className="cursor-pointer font-semibold text-ink-foreground underline decoration-kunyit underline-offset-[3px]">
            Muat ulang halaman
          </button>
        </figcaption>
      ) : (
        caption && <figcaption className="mt-3 border-t border-ink-border px-1 pb-0.5 pt-3 text-[0.84375rem]">{caption}</figcaption>
      )}
    </figure>
  );
}

/**
 * `when="near"` (articles): load as the figure approaches the screen.
 * `when="idle"` (the home hero, on screen from the start): load once the page
 * has finished loading and the browser is idle.
 */
export function LazyFlowPlayer({ spec, caption, when = "near" }: { spec: FlowSpec; caption?: React.ReactNode; when?: "near" | "idle" }) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    if (when !== "idle") return;
    let idle = 0;
    const start = () => {
      idle = "requestIdleCallback" in window ? window.requestIdleCallback(() => setNear(true), { timeout: 2000 }) : Number(setTimeout(() => setNear(true), 300));
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => {
      window.removeEventListener("load", start);
      if ("cancelIdleCallback" in window) window.cancelIdleCallback(idle);
      else clearTimeout(idle);
    };
  }, [when]);

  useEffect(() => {
    const el = ref.current;
    if (!el || when === "idle") return;
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
  }, [when]);

  const shell = <Shell spec={spec} caption={caption} />;
  return <div ref={ref}>{near ? <Suspense fallback={shell}>{<FlowPlayer spec={spec} caption={caption} />}</Suspense> : shell}</div>;
}
