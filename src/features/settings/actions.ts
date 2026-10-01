"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getAdminSession } from "@/lib/auth/session";
import { SETTINGS, type SettingKey } from "@/features/settings/schema";

export type SettingsFormState = { ok?: boolean; error?: string; issues?: { path: string; message: string }[]; savedAt?: number };

/**
 * Save one settings section. The client form posts the whole section as JSON
 * in a single `payload` field (lists of experience/links don't map cleanly to
 * flat FormData), which is validated here against the section's schema.
 */
export async function saveSettingsAction(key: SettingKey, _prev: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  const session = await getAdminSession();
  if (!session) throw new Error("Unauthorized");
  if (!(key in SETTINGS)) return { error: "Unknown settings section" };

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {
    return { error: "Malformed form data" };
  }

  const parsed = SETTINGS[key].schema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: "Some fields need attention",
      issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    };
  }

  const value = parsed.data as Prisma.InputJsonValue;
  await prisma.siteSetting.upsert({ where: { key }, create: { key, value }, update: { value } });

  // Header, footer and metadata read settings on every public page.
  revalidatePath("/", "layout");
  return { ok: true, savedAt: Date.now() };
}
