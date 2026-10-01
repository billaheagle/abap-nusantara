/**
 * Dashboard time ranges. Granularity scales with the range so a chart never
 * has more than ~90 points: daily up to 90 days, weekly for 6 months,
 * monthly beyond that.
 */
export type Granularity = "day" | "week" | "month";

export const ANALYTICS_RANGES = [
  { key: "7d", label: "Last 7 days", short: "7 days", days: 7, granularity: "day" },
  { key: "30d", label: "Last 30 days", short: "30 days", days: 30, granularity: "day" },
  { key: "90d", label: "Last 90 days", short: "90 days", days: 90, granularity: "day" },
  { key: "6m", label: "Last 6 months", short: "6 months", days: 182, granularity: "week" },
  { key: "1y", label: "Last 12 months", short: "12 months", days: 365, granularity: "month" },
  // All time picks day/week/month from the actual history length at query time.
  { key: "all", label: "All time", short: "all time", days: null, granularity: "month" },
] as const satisfies readonly { key: string; label: string; short: string; days: number | null; granularity: Granularity }[];

export type AnalyticsRangeKey = (typeof ANALYTICS_RANGES)[number]["key"];
export type AnalyticsRange = (typeof ANALYTICS_RANGES)[number];

export const DEFAULT_RANGE: AnalyticsRangeKey = "30d";

export function resolveRange(key: string | undefined): AnalyticsRange {
  return ANALYTICS_RANGES.find((r) => r.key === key) ?? ANALYTICS_RANGES.find((r) => r.key === DEFAULT_RANGE)!;
}

export const GRANULARITY_NOUN: Record<Granularity, string> = { day: "day", week: "week", month: "month" };
