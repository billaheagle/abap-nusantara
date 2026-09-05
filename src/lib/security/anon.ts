import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { getEnv } from "@/lib/env";

const ANON_COOKIE = "abap_anon_id";
const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Per-visitor anonymous identity.
 *
 * We never store or compare the raw cookie value in the database — only a
 * salted hash of it — so the DB never holds anything that identifies a
 * specific browser on its own.
 */

/**
 * Read the anon-id cookie and return a salted hash of it, or null if the
 * visitor doesn't have one yet. Read-only — safe to call while rendering a
 * Server Component.
 */
export async function readAnonHash(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(ANON_COOKIE)?.value;
  return raw ? hashValue(raw) : null;
}

/**
 * Get (or create) the anon-id cookie and return a salted hash of it. This
 * sets a cookie when one is missing, so it may only be called from a Server
 * Action or Route Handler — never during render.
 */
export async function getOrCreateAnonHash(): Promise<string> {
  const store = await cookies();
  let raw = store.get(ANON_COOKIE)?.value;

  if (!raw) {
    raw = randomBytes(24).toString("hex");
    store.set(ANON_COOKIE, raw, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ONE_YEAR,
    });
  }

  return hashValue(raw);
}

export function hashValue(value: string): string {
  return createHash("sha256").update(`${getEnv().SESSION_SECRET}:${value}`).digest("hex");
}
