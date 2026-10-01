"use client";

import { useRef, useState } from "react";
import type { DailyPoint } from "@/features/analytics/queries";
import type { Granularity } from "@/lib/analytics/ranges";
import { formatBucket, niceScale } from "./chart-utils";

const H = 220; // plot height in px

/**
 * Single-series area chart (views per day). The SVG stretches to the card
 * width (preserveAspectRatio="none" + non-scaling strokes); everything that
 * must not distort — dots, labels, tooltip — is positioned in HTML on top.
 */
export function ViewsChart({ points, granularity }: { points: DailyPoint[]; granularity: Granularity }) {
  const [hover, setHover] = useState<number | null>(null);
  const plotRef = useRef<HTMLDivElement>(null);

  const max = Math.max(0, ...points.map((p) => p.value));
  const { ticks, top } = niceScale(max);
  const n = points.length;
  const x = (i: number) => (n === 1 ? 50 : (i / (n - 1)) * 100); // percent
  const y = (v: number) => (1 - v / top) * 100; // percent

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.value)}`).join(" ");
  const area = `${line} L${x(n - 1)},100 L${x(0)},100 Z`;

  const last = n - 1;
  const active = hover ?? null;

  function onPointer(e: React.PointerEvent) {
    const rect = plotRef.current?.getBoundingClientRect();
    if (!rect) return;
    const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    setHover(Math.round(frac * (n - 1)));
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") setHover((h) => Math.max(0, (h ?? last) - 1));
    else if (e.key === "ArrowRight") setHover((h) => Math.min(last, (h ?? last) + 1));
    else if (e.key === "Escape") setHover(null);
    else return;
    e.preventDefault();
  }

  // First / middle / last — deduped, since with 1–2 points they coincide.
  const labelIdx = [...new Set([0, Math.floor((n - 1) / 2), n - 1])];

  return (
    <div className="flex gap-3">
      {/* Y axis ticks */}
      <div className="relative w-8 shrink-0 text-right text-[0.6875rem] tabular-nums text-foreground-muted" style={{ height: H }}>
        {ticks.map((t) => (
          <span key={t} className="absolute right-0 -translate-y-1/2" style={{ top: `${y(t)}%` }}>
            {t.toLocaleString("en-US")}
          </span>
        ))}
      </div>

      <div className="min-w-0 flex-1">
        <div
          ref={plotRef}
          className="relative cursor-crosshair outline-none focus-visible:ring-2 focus-visible:ring-brand/40 rounded-sm"
          style={{ height: H }}
          tabIndex={0}
          role="img"
          aria-label={`Views per ${granularity}, ${n} ${granularity}s. Total ${points.reduce((s, p) => s + p.value, 0)}. Use arrow keys to inspect each ${granularity}.`}
          onPointerMove={onPointer}
          onPointerLeave={() => setHover(null)}
          onKeyDown={onKey}
          onBlur={() => setHover(null)}
        >
          {/* gridlines */}
          {ticks.map((t) => (
            <div key={t} className="absolute inset-x-0 border-t border-border" style={{ top: `${y(t)}%` }} />
          ))}

          <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path d={area} fill="var(--brand)" fillOpacity={0.1} />
            <path d={line} fill="none" stroke="var(--brand)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </svg>

          {/* crosshair */}
          {active !== null && (
            <div className="pointer-events-none absolute inset-y-0 border-l border-foreground-muted/50" style={{ left: `${x(active)}%` }} />
          )}

          {/* end marker (latest day) + hover marker, ringed in the surface colour */}
          {[last, ...(active !== null && active !== last ? [active] : [])].map((i) => (
            <span
              key={i}
              className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand ring-2 ring-surface-elevated"
              style={{ left: `${x(i)}%`, top: `${y(points[i].value)}%` }}
            />
          ))}

          {/* tooltip */}
          {active !== null && (
            <div
              className="pointer-events-none absolute z-10 rounded-md border border-border bg-surface-elevated px-3 py-2 shadow-lg"
              style={{
                left: `${x(active)}%`,
                top: `calc(${y(points[active].value)}% - 10px)`,
                transform: `translate(${x(active) > 70 ? "-100%" : x(active) < 30 ? "0" : "-50%"}, -100%)`,
              }}
            >
              <p className="text-base font-semibold leading-tight tabular-nums">{points[active].value.toLocaleString("en-US")}</p>
              <p className="mt-0.5 flex items-center gap-1.5 whitespace-nowrap text-xs text-foreground-muted">
                <span className="inline-block h-0.5 w-3 rounded bg-brand" /> views · {formatBucket(points[active].day, granularity, true)}
              </p>
            </div>
          )}
        </div>

        {/* X axis */}
        <div className="relative mt-2 h-4 text-[0.6875rem] text-foreground-muted">
          {labelIdx.map((i, k) => (
            <span
              key={i}
              className="absolute whitespace-nowrap"
              style={{ left: `${x(i)}%`, transform: k === 0 ? "none" : k === labelIdx.length - 1 ? "translateX(-100%)" : "translateX(-50%)" }}
            >
              {formatBucket(points[i].day, granularity)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
