import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Admin, API routes, and the search results page (duplicate/thin
        // content) are kept out of the index.
        disallow: ["/admin/", "/api/", "/search"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
