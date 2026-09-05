import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { getEnv } from "@/lib/env";

/**
 * Stateless, signed CSRF token.
 *
 * The token carries its own expiry and an HMAC signature keyed by
 * SESSION_SECRET, so it can be minted while rendering a Server Component
 * (where setting cookies is NOT allowed) and verified later in the Server
 * Action that receives the form — with no cookie round-trip. This backs up
 * Next.js's built-in Server Action origin check rather than replacing it.
 */

const TOKEN_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

function sign(payload: string): string {
  return createHmac("sha256", getEnv().SESSION_SECRET).update(payload).digest("hex");
}

/** Mint a fresh signed CSRF token. Safe to call during render — no I/O, no cookies. */
export function issueCsrfToken(): string {
  const payload = `${randomBytes(12).toString("hex")}.${Date.now() + TOKEN_TTL_MS}`;
  return `${payload}.${sign(payload)}`;
}

/** Verify a token minted by issueCsrfToken(): signature must match and it must not be expired. */
export function verifyCsrfToken(submitted: string | null | undefined): boolean {
  if (!submitted) return false;

  const lastDot = submitted.lastIndexOf(".");
  if (lastDot === -1) return false;

  const payload = submitted.slice(0, lastDot);
  const providedSig = submitted.slice(lastDot + 1);
  const expectedSig = sign(payload);

  if (providedSig.length !== expectedSig.length) return false;
  if (!timingSafeEqual(Buffer.from(providedSig), Buffer.from(expectedSig))) return false;

  const expiresAt = Number(payload.split(".")[1]);
  return Number.isFinite(expiresAt) && Date.now() < expiresAt;
}
