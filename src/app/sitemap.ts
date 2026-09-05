import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db/prisma";
import { getAllPublishedSlugs } from "@/features/articles/queries";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, series, categories, tags] = await Promise.all([
    getAllPublishedSlugs(),
    prisma.series.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.category.findMany({ select: { slug: true } }),
    prisma.tag.findMany({ select: { slug: true } }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/articles`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/series`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/categories`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${siteUrl}/about`, changeFrequency: "monthly", priority: 0.4 },
  ];

  return [
    ...staticRoutes,
    ...articles.map((a) => ({ url: `${siteUrl}/articles/${a.slug}`, lastModified: a.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...series.map((s) => ({ url: `${siteUrl}/series/${s.slug}`, lastModified: s.updatedAt, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...categories.map((c) => ({ url: `${siteUrl}/categories/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.5 })),
    ...tags.map((t) => ({ url: `${siteUrl}/tags/${t.slug}`, changeFrequency: "weekly" as const, priority: 0.4 })),
  ];
}
