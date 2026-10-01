import type { Granularity } from "@/lib/analytics/ranges";

/** Clean axis: 0 plus ~4 evenly spaced round ticks covering `max`. */
export function niceScale(max: number, count = 4): { ticks: number[]; top: number } {
  if (max <= 0) return { ticks: [0, 1, 2, 3, 4].slice(0, count + 1), top: count };
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  const niceStep = Math.max(1, Math.ceil(step)); // counts are integers
  const top = niceStep * Math.ceil(max / niceStep);
  const ticks: number[] = [];
  for (let t = 0; t <= top; t += niceStep) ticks.push(t);
  return { ticks, top };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "29 Sep" or, with weekday, "Mon, 29 Sep" — from a YYYY-MM-DD key (no TZ drift). */
export function formatDay(key: string, withWeekday = false): string {
  const d = new Date(`${key}T00:00:00Z`);
  const base = `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
  return withWeekday ? `${WEEKDAYS[d.getUTCDay()]}, ${base}` : base;
}

/**
 * Label for a bucket start key. Short form is for the x-axis, long form for
 * tooltips and the table: "Mon, 29 Sep" / "Week of 29 Sep" / "Sep 2026".
 */
export function formatBucket(key: string, granularity: Granularity, long = false): string {
  if (granularity === "day") return formatDay(key, long);
  if (granularity === "week") return long ? `Week of ${formatDay(key)}` : formatDay(key);
  const d = new Date(`${key}T00:00:00Z`);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** 1,284 / 12.9K / 4.2M */
export function compact(n: number): string {
  if (n < 10_000) return n.toLocaleString("en-US");
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 100_000 ? 1 : 0).replace(/\.0$/, "")}K`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
}
