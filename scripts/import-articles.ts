/**
 * Import reviewed articles from the content repo into the database.
 *
 *   npm run content:import                      # every .md in <content>/03-published
 *   npm run content:import -- --dry-run         # parse + validate only, no writes
 *   npm run content:import -- path/to/file.md   # specific files
 *   npm run content:import -- --content ../abap-nusantara-content
 *   npm run content:import -- --draft           # production: publish by hand later
 *
 * --draft: new articles are created as DRAFT (no publishedAt) whatever the file
 * says, and existing articles keep their current status and publishedAt — so
 * re-importing a revision never publishes or unpublishes anything. Use it on
 * production, then publish each article from the admin on its scheduled day.
 *
 * Each file starts with the metadata block from 00-plan/INSTRUKSI.md
 * (title, slug, excerpt, category, tags, series, seriesOrder, status and an
 * optional publishedAt). Articles are upserted by slug, so re-running after
 * an edit updates the existing article instead of creating a duplicate.
 *
 * Cover: optional `cover: ../assets/S1-1/cover.png` (relative to the .md) is
 * copied to public/articles/<slug>/cover.png and used for cards, the article
 * header and social previews. Without it, an existing cover is left untouched.
 *
 * Images: `![alt](../assets/S1-2/foo.png)` is resolved relative to the .md
 * file, copied to public/articles/<slug>/foo.png and stored as
 * /articles/<slug>/foo.png (committed with the site, unlike public/uploads).
 *
 * Category, tags and series must already exist (see prisma/seed.ts);
 * unknown values are reported as errors rather than created on the fly.
 *
 * Series covers: every <content>/assets/series/<series-slug>.png is copied to
 * public/series/<series-slug>.png and set as that series' coverImage (made by
 * tools/cover/generate-covers.mjs --series in the content repo).
 */
import { copyFile, mkdir, readFile, readdir, stat } from "fs/promises";
import path from "path";
import { PrismaClient, type ArticleStatus } from "@prisma/client";
import { getSchema } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import readingTime from "reading-time";
import { articleInputSchema } from "../src/lib/validation/schemas";
import { extractPlainTextFromTiptap } from "../src/lib/editor/serialize";
import { markdownToTiptap, type TiptapNode } from "./lib/markdown-to-tiptap";

const PUBLISHED_DIR = "03-published";
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

// Must match the extensions in src/components/editor/tiptap-editor.tsx so every
// imported article can be opened and edited in the admin editor.
const editorSchema = getSchema([
  StarterKit.configure({ heading: { levels: [2, 3, 4] }, link: false }),
  Link,
  Image,
  Table,
  TableRow,
  TableHeader,
  TableCell,
]);

interface Frontmatter {
  title: string;
  slug: string;
  excerpt?: string;
  category?: string;
  tags: string[];
  series?: string;
  seriesOrder?: number;
  status: ArticleStatus;
  publishedAt?: Date;
  cover?: string;
}

interface ParsedArticle {
  file: string;
  meta: Frontmatter;
  contentJson: TiptapNode;
  readingTimeMin: number;
  images: Array<{ from: string; to: string }>;
  coverImage?: string;
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

function parseScalar(value: string): string {
  const v = value.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v.slice(1, -1);
  return v;
}

function splitFrontmatter(source: string, file: string): { fields: Record<string, string>; body: string } {
  const normalized = source.replace(/^﻿/, "").replace(/\r\n/g, "\n");
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(normalized);
  if (!match) throw new Error(`${file}: missing metadata block (--- ... ---) at the top`);
  const fields: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const m = /^([A-Za-z]+):\s*(.*)$/.exec(line);
    if (!m) throw new Error(`${file}: cannot read metadata line "${line}"`);
    fields[m[1]] = m[2];
  }
  return { fields, body: normalized.slice(match[0].length) };
}

function parseFrontmatter(fields: Record<string, string>, file: string): Frontmatter {
  const known = new Set(["title", "slug", "excerpt", "category", "tags", "series", "seriesOrder", "status", "publishedAt", "cover"]);
  const unknown = Object.keys(fields).filter((k) => !known.has(k));
  if (unknown.length) throw new Error(`${file}: unknown metadata field(s): ${unknown.join(", ")}`);

  const tagsRaw = (fields.tags ?? "").trim();
  if (tagsRaw && !/^\[.*\]$/.test(tagsRaw)) throw new Error(`${file}: tags must look like [tag-a, tag-b]`);
  const tags = tagsRaw
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map(parseScalar)
    .filter(Boolean);

  const orderRaw = parseScalar(fields.seriesOrder ?? "");
  const publishedRaw = parseScalar(fields.publishedAt ?? "");
  const publishedAt = publishedRaw ? new Date(publishedRaw) : undefined;
  if (publishedAt && Number.isNaN(publishedAt.getTime())) throw new Error(`${file}: publishedAt is not a valid date`);

  const base = articleInputSchema.pick({ title: true, slug: true, excerpt: true, status: true, seriesOrder: true }).safeParse({
    title: parseScalar(fields.title ?? ""),
    slug: parseScalar(fields.slug ?? ""),
    excerpt: parseScalar(fields.excerpt ?? "") || null,
    status: parseScalar(fields.status ?? ""),
    seriesOrder: orderRaw || null,
  });
  if (!base.success) {
    const issues = base.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`${file}: invalid metadata — ${issues}`);
  }

  const series = parseScalar(fields.series ?? "") || undefined;
  if (series && !base.data.seriesOrder) throw new Error(`${file}: series is set but seriesOrder is missing`);

  return {
    title: base.data.title,
    slug: base.data.slug,
    excerpt: base.data.excerpt ?? undefined,
    category: parseScalar(fields.category ?? "") || undefined,
    tags,
    series,
    seriesOrder: base.data.seriesOrder ?? undefined,
    status: base.data.status,
    publishedAt,
    cover: parseScalar(fields.cover ?? "") || undefined,
  };
}

async function parseArticle(file: string, siteRoot: string): Promise<ParsedArticle> {
  const { fields, body } = splitFrontmatter(await readFile(file, "utf8"), file);
  const meta = parseFrontmatter(fields, file);

  const images: ParsedArticle["images"] = [];
  const usedNames = new Map<string, string>();
  let contentJson: TiptapNode;
  try {
    contentJson = markdownToTiptap(body, {
      resolveImage(href) {
        if (/^https?:\/\//i.test(href)) return href;
        const from = path.resolve(path.dirname(file), decodeURI(href));
        const ext = path.extname(from).toLowerCase();
        if (!IMAGE_EXTENSIONS.has(ext)) throw new Error(`image must be PNG, JPG or WebP: ${href}`);
        const name = path.basename(from).toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
        const previous = usedNames.get(name);
        if (previous && previous !== from) throw new Error(`two different images are both named "${name}"`);
        usedNames.set(name, from);
        images.push({ from, to: path.join(siteRoot, "public", "articles", meta.slug, name) });
        return `/articles/${meta.slug}/${name}`;
      },
    });
  } catch (e) {
    throw new Error(`${file}: ${(e as Error).message}`);
  }

  try {
    editorSchema.nodeFromJSON(contentJson).check();
  } catch (e) {
    throw new Error(`${file}: converted content does not fit the editor schema — ${(e as Error).message}`);
  }

  let coverImage: string | undefined;
  if (meta.cover) {
    if (/^https?:\/\//i.test(meta.cover)) {
      coverImage = meta.cover;
    } else {
      const from = path.resolve(path.dirname(file), decodeURI(meta.cover));
      const ext = path.extname(from).toLowerCase();
      if (!IMAGE_EXTENSIONS.has(ext)) throw new Error(`${file}: cover must be PNG, JPG or WebP: ${meta.cover}`);
      const name = `cover${ext === ".jpeg" ? ".jpg" : ext}`;
      if (usedNames.has(name)) throw new Error(`${file}: an article image is also named "${name}"; rename it`);
      images.push({ from, to: path.join(siteRoot, "public", "articles", meta.slug, name) });
      coverImage = `/articles/${meta.slug}/${name}`;
    }
  }

  for (const img of images) {
    const s = await stat(img.from).catch(() => null);
    if (!s?.isFile()) throw new Error(`${file}: image not found: ${img.from}`);
  }

  const minutes = readingTime(extractPlainTextFromTiptap(contentJson)).minutes;
  return { file, meta, contentJson, readingTimeMin: Math.max(1, Math.round(minutes)), images, coverImage };
}

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------

async function resolveTaxonomy(prisma: PrismaClient, meta: Frontmatter, file: string) {
  const errors: string[] = [];

  let categoryId: string | null = null;
  if (meta.category) {
    const category = await prisma.category.findFirst({
      where: { OR: [{ slug: meta.category }, { name: { equals: meta.category, mode: "insensitive" } }] },
    });
    if (category) categoryId = category.id;
    else errors.push(`category "${meta.category}" does not exist`);
  }

  let seriesId: string | null = null;
  if (meta.series) {
    const series = await prisma.series.findFirst({
      where: { OR: [{ slug: meta.series }, { title: { equals: meta.series, mode: "insensitive" } }] },
    });
    if (series) seriesId = series.id;
    else errors.push(`series "${meta.series}" does not exist`);
  }

  const tags = await prisma.tag.findMany({ where: { slug: { in: meta.tags } } });
  const missing = meta.tags.filter((slug) => !tags.some((t) => t.slug === slug));
  if (missing.length) errors.push(`tag(s) do not exist: ${missing.join(", ")}`);

  if (errors.length) throw new Error(`${file}: ${errors.join("; ")} — run "npx prisma db seed" or fix the metadata`);
  return { categoryId, seriesId, tagIds: tags.map((t) => t.id) };
}

async function upsertArticle(
  prisma: PrismaClient,
  article: ParsedArticle,
  dryRun: boolean,
  draftMode: boolean,
): Promise<string> {
  const { meta } = article;
  const { categoryId, seriesId, tagIds } = await resolveTaxonomy(prisma, meta, article.file);
  const existing = await prisma.article.findUnique({ where: { slug: meta.slug }, select: { id: true, publishedAt: true } });

  if (seriesId && meta.seriesOrder) {
    const clash = await prisma.article.findFirst({
      where: { seriesId, seriesOrder: meta.seriesOrder, NOT: { slug: meta.slug } },
      select: { slug: true },
    });
    if (clash) throw new Error(`${article.file}: seriesOrder ${meta.seriesOrder} is already used by "${clash.slug}"`);
  }

  const publishedAt =
    meta.publishedAt ?? existing?.publishedAt ?? (meta.status === "PUBLISHED" ? new Date() : null);

  // In draft mode the database owns status/publishedAt: new articles start as
  // DRAFT and existing ones are left exactly as published (or not) by hand.
  const statusFields = draftMode
    ? existing
      ? {}
      : { status: "DRAFT" as ArticleStatus, publishedAt: null }
    : { status: meta.status, publishedAt };

  const data = {
    title: meta.title,
    excerpt: meta.excerpt ?? null,
    contentJson: article.contentJson as object,
    ...statusFields,
    readingTimeMin: article.readingTimeMin,
    seriesId,
    seriesOrder: seriesId ? (meta.seriesOrder ?? null) : null,
    categoryId,
    // Only overwrite the cover when the file declares one.
    ...(article.coverImage ? { coverImage: article.coverImage } : {}),
  };

  if (dryRun) return existing ? "would update" : "would create";

  for (const img of article.images) {
    await mkdir(path.dirname(img.to), { recursive: true });
    await copyFile(img.from, img.to);
  }

  if (existing) {
    await prisma.$transaction([
      prisma.articleTag.deleteMany({ where: { articleId: existing.id } }),
      prisma.article.update({
        where: { id: existing.id },
        data: { ...data, tags: { create: tagIds.map((tagId) => ({ tagId })) } },
      }),
    ]);
    return "updated";
  }

  await prisma.article.create({
    data: { ...data, slug: meta.slug, tags: { create: tagIds.map((tagId) => ({ tagId })) } },
  });
  return "created";
}

async function syncSeriesCovers(prisma: PrismaClient, contentRoot: string, siteRoot: string, dryRun: boolean) {
  const dir = path.join(contentRoot, "assets", "series");
  const entries = await readdir(dir).catch(() => [] as string[]);
  for (const file of entries.filter((f) => IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase())).sort()) {
    const slug = path.basename(file, path.extname(file));
    const series = await prisma.series.findUnique({ where: { slug }, select: { id: true, coverImage: true } });
    if (!series) {
      console.log(`- series cover skipped: no series with slug "${slug}" (${file})`);
      continue;
    }
    const name = `${slug}${path.extname(file).toLowerCase()}`;
    const url = `/series/${name}`;
    if (!dryRun) {
      await mkdir(path.join(siteRoot, "public", "series"), { recursive: true });
      await copyFile(path.join(dir, file), path.join(siteRoot, "public", "series", name));
      if (series.coverImage !== url) await prisma.series.update({ where: { id: series.id }, data: { coverImage: url } });
    }
    console.log(`✓ series cover ${dryRun ? "(dry run) " : ""}${slug} → ${url}`);
  }
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const draftMode = args.includes("--draft");
  const contentIdx = args.indexOf("--content");
  const siteRoot = process.cwd();
  const contentRoot = path.resolve(
    contentIdx >= 0 ? args[contentIdx + 1] : process.env.CONTENT_DIR || path.join(siteRoot, "..", "abap-nusantara-content"),
  );
  const explicit = args.filter((a, i) => !a.startsWith("--") && !(contentIdx >= 0 && i === contentIdx + 1));

  let files: string[];
  if (explicit.length) {
    files = explicit.map((f) => path.resolve(f));
  } else {
    const dir = path.join(contentRoot, PUBLISHED_DIR);
    const entries = await readdir(dir).catch(() => {
      throw new Error(`Content folder not found: ${dir} (use --content <path> or CONTENT_DIR)`);
    });
    files = entries.filter((f) => f.toLowerCase().endsWith(".md")).sort().map((f) => path.join(dir, f));
  }
  if (!files.length) {
    console.log("No articles to import.");
    const prisma = new PrismaClient();
    try {
      await syncSeriesCovers(prisma, contentRoot, siteRoot, dryRun);
    } finally {
      await prisma.$disconnect();
    }
    return;
  }

  // Parse and validate everything first, so one bad file stops the run before any write.
  const parsed: ParsedArticle[] = [];
  const failures: string[] = [];
  for (const file of files) {
    try {
      parsed.push(await parseArticle(file, siteRoot));
    } catch (e) {
      failures.push((e as Error).message);
    }
  }
  const slugs = parsed.map((p) => p.meta.slug);
  for (const slug of new Set(slugs)) {
    if (slugs.filter((s) => s === slug).length > 1) failures.push(`slug "${slug}" is used by more than one file`);
  }
  if (failures.length) {
    failures.forEach((f) => console.error(`✗ ${f}`));
    process.exitCode = 1;
    return;
  }

  const prisma = new PrismaClient();
  try {
    for (const article of parsed) {
      const result = await upsertArticle(prisma, article, dryRun, draftMode);
      const where = article.meta.series ? ` [${article.meta.series} #${article.meta.seriesOrder}]` : "";
      console.log(
        `✓ ${result.padEnd(12)} ${article.meta.slug} (${draftMode ? "status kept/DRAFT" : article.meta.status}, ${article.readingTimeMin} min` +
          `${article.coverImage ? ", cover" : ""}` +
          `${article.images.length ? `, ${article.images.length} file(s) copied` : ""})${where}`,
      );
    }
    await syncSeriesCovers(prisma, contentRoot, siteRoot, dryRun);
    console.log(
      dryRun
        ? `Dry run: ${parsed.length} article(s) valid, nothing written.`
        : `Done: ${parsed.length} article(s). Public pages refresh within ~60 s (revalidate).`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(`✗ ${(e as Error).message}`);
  process.exit(1);
});
