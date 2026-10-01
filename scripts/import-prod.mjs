/**
 * Import articles into the PRODUCTION database (Neon), always as --draft.
 *
 *   npm run content:import:prod                 # every .md in ../abap-nusantara-content/03-published
 *   npm run content:import:prod -- --dry-run    # parse + validate only
 *   npm run content:import:prod -- path/to/file.md
 *
 * Reads DIRECT_URL from .env.neon (gitignored) and runs import-articles.ts
 * with it as DATABASE_URL, so a plain `npm run content:import` can never hit
 * production by accident and a production import can never publish anything:
 * new articles start as DRAFT, existing ones keep their status.
 *
 * Copied images land in public/articles/<slug>/ — commit and push this repo
 * afterwards, or Vercel serves those images as 404.
 */
import { readFileSync, existsSync } from "fs";
import { spawnSync } from "child_process";
import path from "path";

const siteRoot = path.resolve(import.meta.dirname, "..");
const envFile = path.join(siteRoot, ".env.neon");
if (!existsSync(envFile)) {
  console.error(`Missing ${envFile} (needs DIRECT_URL for the Neon production database).`);
  process.exit(1);
}

const match = readFileSync(envFile, "utf8").match(/^DIRECT_URL=["']?([^"'\r\n]+)["']?\s*$/m);
if (!match) {
  console.error(`DIRECT_URL not found in ${envFile}.`);
  process.exit(1);
}
const databaseUrl = match[1];

console.log(`Target: PRODUCTION (${new URL(databaseUrl).host}), mode --draft\n`);

const args = process.argv.slice(2).filter((a) => a !== "--draft");
// Run tsx through node directly (no shell), so paths with spaces stay intact.
const tsxCli = path.join(siteRoot, "node_modules", "tsx", "dist", "cli.mjs");
const result = spawnSync(process.execPath, [tsxCli, "scripts/import-articles.ts", "--draft", ...args], {
  cwd: siteRoot,
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: databaseUrl },
});

if (result.status === 0 && !args.includes("--dry-run")) {
  console.log("\nNext: commit + push this repo so Vercel deploys the copied images (public/articles, public/series).");
}
process.exit(result.status ?? 1);
