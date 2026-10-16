import { draftMode } from "next/headers";
import { getAdminSession } from "./session";

/**
 * True when an admin is previewing: Next.js draft mode is on (set by
 * /api/admin/preview) and the request still carries a valid admin session.
 * Draft mode alone isn't trusted, so an expired session falls back to the
 * public view. Visitors never have draft mode, so their pages stay cached.
 */
export async function isAdminPreview(): Promise<boolean> {
  const { isEnabled } = await draftMode();
  if (!isEnabled) return false;
  return (await getAdminSession()) !== null;
}

/** Slugs as the editor saves them: lowercase letters, digits and single hyphens. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
