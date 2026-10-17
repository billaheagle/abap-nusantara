import { expect, test, type ConsoleMessage, type Page } from "@playwright/test";

/**
 * What a reader relies on, checked against the live site after each deploy.
 * Read-only: the comment form is only focused (which fetches its token) and
 * the like state is only read, so production data is never touched.
 */

/** Console errors and uncaught exceptions on a page, minus the 404 a missing page reports for itself. */
function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (m: ConsoleMessage) => {
    if (m.type() === "error" && !/status of 404/.test(m.text())) errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
}

async function noSidewaysScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, "page scrolls sideways").toBeLessThanOrEqual(1);
}

/** The article the home hero links to: a published article with a flow. */
async function heroArticle(page: Page): Promise<string> {
  await page.goto("/");
  const href = await page.locator("figure figcaption a").first().getAttribute("href");
  expect(href, "hero caption links to its article").toMatch(/^\/articles\//);
  return href!;
}

test("home page loads, and the hero flow plays", async ({ page }) => {
  const errors = collectErrors(page);
  const res = await page.goto("/");
  expect(res?.status()).toBe(200);
  await expect(page).toHaveTitle(/ABAP Nusantara/);
  await expect(page.locator("h1")).toBeVisible();
  // The hero swaps its shell for the player once the page is idle.
  await expect(page.locator("figure svg[viewBox]").first()).toBeVisible({ timeout: 15_000 });
  // The player's own controls (scenario tabs only exist when a flow has several).
  await expect(page.locator("figure").getByRole("button", { name: /^(Jeda|Putar)$/ }).first()).toBeVisible();
  await noSidewaysScroll(page);
  expect(errors, "console errors").toEqual([]);
});

test("an article loads, its flow plays, and its server actions answer", async ({ page }) => {
  const href = await heroArticle(page);
  const errors = collectErrors(page);

  // The like state is fetched by a server action once the cached page loads.
  const likeState = page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/articles/"), { timeout: 15_000 });
  const res = await page.goto(href);
  expect(res?.status()).toBe(200);
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.getByText("Ada yang tidak beres")).toHaveCount(0);
  expect((await likeState).status(), "like state server action").toBe(200);
  await expect(page.getByRole("button", { name: /suka/ })).toBeVisible();

  // The flow player loads as its figure nears the screen, without the fallback notice.
  const figure = page.locator("#article-body figure").first();
  await figure.scrollIntoViewIfNeeded();
  await expect(figure.locator("svg[viewBox]")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/Animasi tidak bisa dimuat|Ilustrasi alur tidak bisa ditampilkan/)).toHaveCount(0);

  // Focusing the comment form fetches its CSRF token (nothing is submitted).
  const token = page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/articles/"), { timeout: 15_000 });
  await page.locator("form #authorName").first().focus();
  expect((await token).status(), "comment token server action").toBe(200);

  await noSidewaysScroll(page);
  expect(errors, "console errors").toEqual([]);
});

test("an unknown article is a 404 with its own title", async ({ page }) => {
  const res = await page.goto("/articles/smoke-test-tidak-ada");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Halaman tidak ditemukan" })).toBeVisible();
  // The title must survive hydration (it used to fall back to the site default).
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveTitle(/Halaman tidak ditemukan/);
});

test("feed, sitemap and manifest are served", async ({ request, baseURL }) => {
  const feed = await request.get("/feed.xml");
  expect(feed.status()).toBe(200);
  expect(feed.headers()["content-type"]).toContain("application/rss+xml");
  const xml = await feed.text();
  expect(xml).toContain("<rss");
  const items = xml.match(/<item>/g) ?? [];
  expect(items.length, "feed items").toBeGreaterThan(0);
  const links = [...xml.matchAll(/<link>([^<]+)<\/link>/g)].map((m) => m[1]);
  for (const link of links) expect(link.startsWith("https://") || baseURL?.startsWith("http://localhost")).toBeTruthy();

  expect((await request.get("/sitemap.xml")).status()).toBe(200);
  const manifest = await request.get("/manifest.webmanifest");
  expect(manifest.status()).toBe(200);
  expect((await manifest.json()).icons.length).toBeGreaterThan(0);
});
