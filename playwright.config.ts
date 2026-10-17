import { defineConfig, devices } from "@playwright/test";

/**
 * Smoke tests for the live site (e2e/). They only read: no comment is sent,
 * nothing is liked. CI runs them after every production deploy
 * (.github/workflows/smoke.yml); locally:
 *
 *   SMOKE_BASE_URL=http://localhost:3000 npm run test:smoke
 */
export default defineConfig({
  testDir: "e2e",
  timeout: 45_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: process.env.SMOKE_BASE_URL ?? "https://www.abapnusantara.com",
    trace: "retain-on-failure",
    // PW_CHANNEL=msedge runs on an installed Edge instead of Playwright's Chromium.
    ...(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {}),
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "phone", use: { ...devices["Pixel 7"] } },
  ],
});
