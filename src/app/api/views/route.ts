import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { verifySessionToken } from "@/lib/auth/session";
import { rateLimit, getClientIp } from "@/lib/security/rate-limit";
import { analyticsDay } from "@/lib/analytics/day";

/**
 * Records one article page view (sent by <ViewTracker> via sendBeacon).
 *
 * Counting rules — deliberately conservative so the numbers mean "a person
 * read this", not "the page was requested":
 *  - the client only sends once per article per browser tab session;
 *  - the same IP counts at most once per article per 30 minutes;
 *  - obvious bots/crawlers/previews and logged-in admins are ignored;
 *  - only PUBLISHED articles count.
 * Nothing about the visitor is stored — just a per-day counter.
 */

const bodySchema = z.object({ articleId: z.string().min(1).max(64) });

const BOT_UA = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|whatsapp|telegram|discord|curl|wget|python|headless|lighthouse|monitor/i;

const noContent = () => new NextResponse(null, { status: 204 });

export async function POST(request: NextRequest) {
  const ua = request.headers.get("user-agent") ?? "";
  if (!ua || BOT_UA.test(ua)) return noContent();

  // Don't count the author proofreading their own posts.
  if (await verifySessionToken(request.cookies.get("abap_admin_session")?.value)) return noContent();

  let articleId: string;
  try {
    const parsed = bodySchema.safeParse(JSON.parse(await request.text()));
    if (!parsed.success) return noContent();
    articleId = parsed.data.articleId;
  } catch {
    return noContent();
  }

  const ip = getClientIp(request.headers);
  if (!rateLimit(`view:${ip}:${articleId}`, 1, 30 * 60 * 1000).allowed) return noContent();
  // Global per-IP ceiling against scripted inflation across many articles.
  if (!rateLimit(`views:${ip}`, 60, 60 * 60 * 1000).allowed) return noContent();

  const article = await prisma.article.findFirst({ where: { id: articleId, status: "PUBLISHED" }, select: { id: true } });
  if (!article) return noContent();

  const day = analyticsDay();
  await prisma.articleViewDaily.upsert({
    where: { articleId_day: { articleId, day } },
    create: { articleId, day, views: 1 },
    update: { views: { increment: 1 } },
  });

  return noContent();
}
