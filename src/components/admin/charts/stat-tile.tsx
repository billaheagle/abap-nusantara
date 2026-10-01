import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { DailyPoint } from "@/features/analytics/queries";
import { compact } from "./chart-utils";

function Sparkline({ points }: { points: DailyPoint[] }) {
  const n = points.length;
  const max = Math.max(1, ...points.map((p) => p.value));
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${n === 1 ? 50 : (i / (n - 1)) * 100},${30 - (p.value / max) * 28}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-8 w-full" aria-hidden="true">
      <path d={`${d} L100,30 L0,30 Z`} fill="var(--brand)" fillOpacity={0.08} />
      <path d={d} fill="none" stroke="var(--brand)" strokeWidth={1.5} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/**
 * Stat tile: label · value · delta vs the previous period of equal length ·
 * sparkline of the current period.
 */
export function StatTile({
  label,
  total,
  previous,
  points,
  periodLabel,
}: {
  label: string;
  total: number;
  /** Previous period of equal length; null when there is none (All time). */
  previous: number | null;
  points?: DailyPoint[];
  periodLabel: string;
}) {
  const diff = previous === null ? 0 : total - previous;
  const pct = previous !== null && previous > 0 ? Math.round((diff / previous) * 100) : null;
  const tone = diff > 0 ? "text-positive" : diff < 0 ? "text-negative" : "text-foreground-muted";
  const Icon = diff > 0 ? ArrowUpRight : diff < 0 ? ArrowDownRight : Minus;
  const deltaText = diff === 0 ? "No change" : pct !== null ? `${diff > 0 ? "+" : ""}${pct}%` : `${diff > 0 ? "+" : ""}${diff}`;

  return (
    <div className="admin-card flex flex-col p-5">
      <p className="text-sm font-medium text-foreground-muted">{label}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight">{compact(total)}</p>
      {previous === null ? (
        <p className="mt-1 text-xs text-foreground-muted">{periodLabel}</p>
      ) : (
        <p className={`mt-1 inline-flex items-center gap-1 text-xs font-semibold ${tone}`}>
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          {deltaText}
          <span className="font-normal text-foreground-muted">vs previous {periodLabel}</span>
        </p>
      )}
      {points && (
        <div className="mt-auto pt-3">
          <Sparkline points={points} />
        </div>
      )}
    </div>
  );
}
