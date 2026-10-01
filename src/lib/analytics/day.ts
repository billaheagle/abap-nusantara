import type { Granularity } from "./ranges";

/**
 * Analytics days follow the Asia/Jakarta calendar (the readership's local
 * day), stored as a UTC-midnight Date so it maps 1:1 onto a Postgres DATE.
 */
export const ANALYTICS_TZ = "Asia/Jakarta";

const DAY_MS = 86_400_000;

const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: ANALYTICS_TZ, year: "numeric", month: "2-digit", day: "2-digit" });

/** "YYYY-MM-DD" of the Jakarta calendar day containing `date`. */
export function dayKey(date: Date = new Date()): string {
  return fmt.format(date);
}

/** The Jakarta calendar day containing `date`, as a UTC-midnight Date. */
export function analyticsDay(date: Date = new Date()): Date {
  return new Date(`${dayKey(date)}T00:00:00.000Z`);
}

export function addDays(day: Date, n: number): Date {
  return new Date(day.getTime() + n * DAY_MS);
}

/** Start of the bucket (day / ISO week starting Monday / month) containing `day`. */
export function bucketStart(day: Date, granularity: Granularity): Date {
  if (granularity === "day") return day;
  if (granularity === "week") return addDays(day, -((day.getUTCDay() + 6) % 7));
  return new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), 1));
}

function nextBucket(start: Date, granularity: Granularity): Date {
  if (granularity === "day") return addDays(start, 1);
  if (granularity === "week") return addDays(start, 7);
  return new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
}

/** Bucket starts from the bucket containing `from` through the one containing `to`. */
export function bucketsBetween(from: Date, to: Date, granularity: Granularity): Date[] {
  const out: Date[] = [];
  for (let b = bucketStart(from, granularity); b <= to; b = nextBucket(b, granularity)) out.push(b);
  return out;
}
