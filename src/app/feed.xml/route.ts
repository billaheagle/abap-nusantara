import { prisma } from "@/lib/db/prisma";
import { getSetting } from "@/features/settings/queries";

// Feed readers poll; ten minutes is fresh enough for a blog and spares the DB.
export const revalidate = 600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const FEED_SIZE = 20;

function xml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

/** RSS 2.0 feed of the latest published articles (title, excerpt, date, category). */
export async function GET() {
  const [{ brand }, articles] = await Promise.all([
    getSetting("general"),
    prisma.article.findMany({
      where: { status: "PUBLISHED", publishedAt: { not: null } },
      orderBy: { publishedAt: "desc" },
      take: FEED_SIZE,
      select: { title: true, slug: true, excerpt: true, publishedAt: true, category: { select: { name: true } } },
    }),
  ]);
  const siteName = [brand.name, brand.accent].filter(Boolean).join(" ");

  const items = articles
    .map((a) => {
      const link = `${siteUrl}/articles/${a.slug}`;
      return [
        "    <item>",
        `      <title>${xml(a.title)}</title>`,
        `      <link>${link}</link>`,
        `      <guid isPermaLink="true">${link}</guid>`,
        `      <pubDate>${a.publishedAt!.toUTCString()}</pubDate>`,
        a.excerpt ? `      <description>${xml(a.excerpt)}</description>` : "",
        a.category ? `      <category>${xml(a.category.name)}</category>` : "",
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xml(siteName)}</title>
    <link>${siteUrl}</link>
    <description>${xml(brand.seoDescription)}</description>
    <language>id</language>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>${
      articles[0] ? `\n    <lastBuildDate>${articles[0].publishedAt!.toUTCString()}</lastBuildDate>` : ""
    }
${items}
  </channel>
</rss>
`;

  return new Response(body, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
