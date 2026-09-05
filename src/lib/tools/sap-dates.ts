/** Pure date/time conversion helpers for the SAP Date & Time Converter. */

export type Interpret = "utc" | "local";
export type Zone = "UTC" | "Local";

export interface ParseResult {
  detected: string;
  instant: Date;
  hasDate: boolean;
  hasTime: boolean;
}

const pad = (n: number, w = 2) => String(Math.abs(n)).padStart(w, "0");

export function parseSapInput(raw: string, interpret: Interpret): ParseResult | { error: string } {
  const v = raw.trim();
  if (!v) return { error: "Enter a value above." };

  const build = (c: { y: number; mo: number; d: number; h: number; mi: number; s: number; ms: number }): Date =>
    interpret === "local"
      ? new Date(c.y, c.mo - 1, c.d, c.h, c.mi, c.s, c.ms)
      : new Date(Date.UTC(c.y, c.mo - 1, c.d, c.h, c.mi, c.s, c.ms));

  if (/^\d{8}$/.test(v)) {
    const inst = build({ y: +v.slice(0, 4), mo: +v.slice(4, 6), d: +v.slice(6, 8), h: 0, mi: 0, s: 0, ms: 0 });
    return check(inst, "SAP date · YYYYMMDD", true, false);
  }
  if (/^\d{6}$/.test(v)) {
    const now = new Date();
    const inst = build({
      y: now.getFullYear(),
      mo: now.getMonth() + 1,
      d: now.getDate(),
      h: +v.slice(0, 2),
      mi: +v.slice(2, 4),
      s: +v.slice(4, 6),
      ms: 0,
    });
    return check(inst, "SAP time · HHMMSS (today's date assumed)", false, true);
  }
  if (/^\d{14}(\.\d{1,7})?$/.test(v)) {
    const [d, frac] = v.split(".");
    const ms = frac ? Math.round(Number(`0.${frac}`) * 1000) : 0;
    const inst = build({
      y: +d.slice(0, 4),
      mo: +d.slice(4, 6),
      d: +d.slice(6, 8),
      h: +d.slice(8, 10),
      mi: +d.slice(10, 12),
      s: +d.slice(12, 14),
      ms,
    });
    return check(inst, frac ? "SAP timestampL · YYYYMMDDHHMMSS.fffffff" : "SAP timestamp · YYYYMMDDHHMMSS", true, true);
  }
  if (/^-?\d{9,10}$/.test(v)) return check(new Date(Number(v) * 1000), "Unix epoch · seconds", true, true);
  if (/^-?\d{12,13}$/.test(v)) return check(new Date(Number(v)), "Unix epoch · milliseconds", true, true);

  const parsed = Date.parse(v);
  if (!Number.isNaN(parsed)) return check(new Date(parsed), "ISO 8601 / RFC date", true, true);

  return { error: "Could not recognise this format. Try YYYYMMDD, YYYYMMDDHHMMSS, an ISO string, or an epoch value." };

  function check(instant: Date, detected: string, hasDate: boolean, hasTime: boolean): ParseResult | { error: string } {
    if (Number.isNaN(instant.getTime())) return { error: "The value parsed to an invalid date." };
    return { detected, instant, hasDate, hasTime };
  }
}

function parts(instant: Date, zone: Zone) {
  return zone === "UTC"
    ? {
        y: instant.getUTCFullYear(),
        mo: instant.getUTCMonth() + 1,
        d: instant.getUTCDate(),
        h: instant.getUTCHours(),
        mi: instant.getUTCMinutes(),
        s: instant.getUTCSeconds(),
        ms: instant.getUTCMilliseconds(),
        wd: instant.getUTCDay(),
      }
    : {
        y: instant.getFullYear(),
        mo: instant.getMonth() + 1,
        d: instant.getDate(),
        h: instant.getHours(),
        mi: instant.getMinutes(),
        s: instant.getSeconds(),
        ms: instant.getMilliseconds(),
        wd: instant.getDay(),
      };
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function isoWeek(y: number, mo: number, d: number): number {
  const date = new Date(Date.UTC(y, mo - 1, d));
  const day = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - day + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const diff = date.getTime() - firstThursday.getTime();
  return 1 + Math.round(diff / (7 * 864e5));
}

export interface ZoneView {
  zone: Zone;
  offset: string;
  sapDate: string;
  sapTime: string;
  sapTimestamp: string;
  sapTimestampL: string;
  iso: string;
  weekday: string;
  isoWeek: number;
  dayOfYear: number;
}

export function viewIn(instant: Date, zone: Zone): ZoneView {
  const p = parts(instant, zone);
  const ymd = `${p.y}${pad(p.mo)}${pad(p.d)}`;
  const hms = `${pad(p.h)}${pad(p.mi)}${pad(p.s)}`;
  const frac = pad(p.ms, 3) + "0000";

  let offset = "+00:00";
  if (zone === "Local") {
    const o = -instant.getTimezoneOffset();
    offset = `${o >= 0 ? "+" : "-"}${pad(Math.trunc(Math.abs(o) / 60))}:${pad(Math.abs(o) % 60)}`;
  }

  const startOfYear = Date.UTC(p.y, 0, 1);
  const thisDay = Date.UTC(p.y, p.mo - 1, p.d);

  return {
    zone,
    offset,
    sapDate: ymd,
    sapTime: hms,
    sapTimestamp: `${ymd}${hms}`,
    sapTimestampL: `${ymd}${hms}.${frac}`,
    iso: `${p.y}-${pad(p.mo)}-${pad(p.d)}T${pad(p.h)}:${pad(p.mi)}:${pad(p.s)}${zone === "UTC" ? "Z" : offset}`,
    weekday: WEEKDAYS[p.wd],
    isoWeek: isoWeek(p.y, p.mo, p.d),
    dayOfYear: Math.round((thisDay - startOfYear) / 864e5) + 1,
  };
}

export const epochSeconds = (d: Date) => Math.floor(d.getTime() / 1000);
export const epochMillis = (d: Date) => d.getTime();

export function relativeTime(d: Date): string {
  const diffMs = d.getTime() - Date.now();
  const abs = Math.abs(diffMs);
  const units: [number, string][] = [
    [864e5 * 365, "year"],
    [864e5 * 30, "month"],
    [864e5, "day"],
    [36e5, "hour"],
    [6e4, "minute"],
    [1e3, "second"],
  ];
  for (const [ms, name] of units) {
    if (abs >= ms || name === "second") {
      const n = Math.round(abs / ms);
      const label = `${n} ${name}${n === 1 ? "" : "s"}`;
      return diffMs >= 0 ? `in ${label}` : `${label} ago`;
    }
  }
  return "now";
}

export function abapSnippet(v: ZoneView, hasDate: boolean, hasTime: boolean): string {
  const lines: string[] = [];
  if (hasDate) lines.push(`DATA(lv_date) = CONV d( '${v.sapDate}' ).          " type d`);
  if (hasTime) lines.push(`DATA(lv_time) = CONV t( '${v.sapTime}' ).            " type t`);
  if (hasDate && hasTime) {
    lines.push(`DATA lv_ts TYPE timestamp.`);
    lines.push(`lv_ts = |${v.sapTimestamp}|.                       " packed, dec 0`);
    lines.push(`" cl_abap_tstmp / GET TIME STAMP FIELD for arithmetic`);
  }
  return lines.join("\n");
}
