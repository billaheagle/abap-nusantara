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
  if (!t) return { error: "Tempel token di atas." };
  const parts = t.split(".");
  if (parts.length !== 3) return { error: "JWT terdiri dari tiga bagian yang dipisah titik: header.payload.signature." };
  try {
    return { header: b64urlToJson(parts[0]), payload: b64urlToJson(parts[1]), signature: parts[2] };
  } catch {
    return { error: "Header atau payload bukan JSON yang di-encode base64url dengan benar." };
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
    [864e5, "hari"],
    [36e5, "jam"],
    [6e4, "menit"],
    [1e3, "detik"],
  ];
  for (const [ms, name] of units) {
    if (abs >= ms || name === "detik") {
      const n = Math.round(abs / ms);
      return diff >= 0 ? `${n} ${name} lagi` : `${n} ${name} lalu`;
    }
  }
  return "sekarang";
}

export function timeClaims(payload: Record<string, unknown>): TimeClaim[] {
  const defs: [string, string][] = [
    ["iat", "Diterbitkan"],
    ["nbf", "Berlaku mulai"],
    ["exp", "Kedaluwarsa"],
    ["auth_time", "Diautentikasi"],
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
