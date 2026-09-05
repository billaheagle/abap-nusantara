/** Client-side JWT decoding — no signature verification (no key available). */

export interface JwtParts {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
}

function b64urlToJson(segment: string): Record<string, unknown> {
  const b64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64.padEnd(Math.ceil(b64.length / 4) * 4, "=");
  const bin = atob(padded);
  const json = new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
  return JSON.parse(json);
}

export function decodeJwt(token: string): JwtParts | { error: string } {
  const t = token.trim().replace(/^Bearer\s+/i, "");
  if (!t) return { error: "Paste a token above." };
  const parts = t.split(".");
  if (parts.length !== 3) return { error: "A JWT has three dot-separated parts: header.payload.signature." };
  try {
    return { header: b64urlToJson(parts[0]), payload: b64urlToJson(parts[1]), signature: parts[2] };
  } catch {
    return { error: "The header or payload is not valid base64url-encoded JSON." };
  }
}

export interface TimeClaim {
  key: string;
  label: string;
  when: Date;
  relative: string;
  state?: "expired" | "active" | "future";
}

function relative(d: Date): string {
  const diff = d.getTime() - Date.now();
  const abs = Math.abs(diff);
  const units: [number, string][] = [
    [864e5, "day"],
    [36e5, "hour"],
    [6e4, "minute"],
    [1e3, "second"],
  ];
  for (const [ms, name] of units) {
    if (abs >= ms || name === "second") {
      const n = Math.round(abs / ms);
      return diff >= 0 ? `in ${n} ${name}${n === 1 ? "" : "s"}` : `${n} ${name}${n === 1 ? "" : "s"} ago`;
    }
  }
  return "now";
}

export function timeClaims(payload: Record<string, unknown>): TimeClaim[] {
  const defs: [string, string][] = [
    ["iat", "Issued at"],
    ["nbf", "Not before"],
    ["exp", "Expires"],
    ["auth_time", "Authenticated at"],
  ];
  const now = Date.now();
  return defs
    .filter(([k]) => typeof payload[k] === "number")
    .map(([k, label]) => {
      const when = new Date((payload[k] as number) * 1000);
      let state: TimeClaim["state"];
      if (k === "exp") state = when.getTime() < now ? "expired" : "active";
      if (k === "nbf") state = when.getTime() > now ? "future" : "active";
      return { key: k, label, when, relative: relative(when), state };
    });
}

export function scopesOf(payload: Record<string, unknown>): string[] {
  const s = payload.scope ?? payload.scp;
  if (Array.isArray(s)) return s.map(String);
  if (typeof s === "string") return s.split(/[\s,]+/).filter(Boolean);
  return [];
}

export function isExpired(payload: Record<string, unknown>): boolean {
  return typeof payload.exp === "number" && payload.exp * 1000 < Date.now();
}
