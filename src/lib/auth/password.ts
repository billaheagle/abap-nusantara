import bcrypt from "bcryptjs";
import { getAdminCredentials } from "@/lib/env";

/**
 * Verify admin credentials against the hardcoded (env-configured) admin list.
 * Always returns a generic boolean — callers must never reveal which part
 * (email vs password) was wrong, and must always compare against *some*
 * hash even for unknown emails to avoid timing-based user enumeration.
 */
export async function verifyAdminCredentials(email: string, password: string): Promise<boolean> {
  const credentials = getAdminCredentials();
  const normalizedEmail = email.trim().toLowerCase();
  const hash = credentials[normalizedEmail];

  // Dummy hash of a random value so bcrypt.compare always runs, keeping
  // response time roughly constant whether or not the email exists.
  const DUMMY_HASH = "$2a$12$CwTycUXWue0Thq9StjUM0uJ8i8Qw6c8p8g1x8N8b6r9F0s2Ldd8ke";
  const targetHash = hash ?? DUMMY_HASH;

  const isValid = await bcrypt.compare(password, targetHash);
  return isValid && Boolean(hash);
}
