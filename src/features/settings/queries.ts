import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db/prisma";
import { SETTINGS, type SettingKey, type SettingValue } from "@/features/settings/schema";

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Overlay stored values onto the defaults. Objects merge key by key so a field
 * added to a schema later still gets its default; arrays are replaced whole.
 */
function mergeDefaults(defaults: unknown, stored: unknown): unknown {
  if (!isPlainObject(defaults) || !isPlainObject(stored)) return stored === undefined ? defaults : stored;
  const out: Record<string, unknown> = { ...defaults };
  for (const [k, v] of Object.entries(stored)) {
    if (k in defaults) out[k] = mergeDefaults(defaults[k], v);
  }
  return out;
}

/**
 * Read one settings section, deduplicated per request. Never throws: a missing
 * row, an unmigrated table, or JSON that no longer matches the schema all fall
 * back to the defaults so the public site keeps rendering.
 */
export const getSetting = cache(async <K extends SettingKey>(key: K): Promise<SettingValue<K>> => {
  const { schema, defaults } = SETTINGS[key];
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key } });
    if (!row) return defaults as SettingValue<K>;
    const parsed = schema.safeParse(mergeDefaults(defaults, row.value));
    if (parsed.success) return parsed.data as SettingValue<K>;
    console.error(`[settings] stored "${key}" is invalid, using defaults`, parsed.error.issues);
  } catch (err) {
    console.error(`[settings] failed to read "${key}", using defaults`, err);
  }
  return defaults as SettingValue<K>;
});
