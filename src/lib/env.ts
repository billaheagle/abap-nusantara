// Central, validated access to environment variables.
// Fail fast at startup rather than surfacing confusing errors deep in a request.
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),
  ADMIN_EMAILS: z.string().min(1, "ADMIN_EMAILS is required (comma-separated)"),
  ADMIN_PASSWORD_HASHES: z.string().min(1, "ADMIN_PASSWORD_HASHES is required (comma-separated bcrypt hashes, same order as ADMIN_EMAILS)"),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  UPLOAD_DIR: z.string().default("public/uploads"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

/** Lazily validate and cache process.env. Throws with a clear message if misconfigured. */
export function getEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `- ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}

/** Parsed admin identities: email -> bcrypt hash, matched by position. */
export function getAdminCredentials(): Record<string, string> {
  const env = getEnv();
  const emails = env.ADMIN_EMAILS.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  const hashes = env.ADMIN_PASSWORD_HASHES.split(",").map((h) => h.trim()).filter(Boolean);
  if (emails.length !== hashes.length) {
    throw new Error("ADMIN_EMAILS and ADMIN_PASSWORD_HASHES must have the same number of comma-separated entries");
  }
  const map: Record<string, string> = {};
  emails.forEach((email, i) => {
    map[email] = hashes[i];
  });
  return map;
}
