"use server";

import { getAdminSession } from "@/lib/auth/session";
import { parseFlow } from "@/lib/flows/schema";
import type { FlowSpec } from "@/lib/flows/types";

/**
 * Validates a ```flow block for the admin flow preview, with the same schema
 * the importer and the article renderer use (zod stays on the server).
 */
export async function validateFlowAction(source: string): Promise<{ ok: true; spec: FlowSpec } | { ok: false; error: string }> {
  if (!(await getAdminSession())) return { ok: false, error: "Not signed in." };
  if (source.length > 60_000) return { ok: false, error: "Block is too long (max 60,000 characters)." };
  return parseFlow(source);
}
