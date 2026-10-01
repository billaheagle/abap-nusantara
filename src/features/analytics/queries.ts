import "server-only";
import { prisma } from "@/lib/db/prisma";
import { addDays, analyticsDay, bucketStart, bucketsBetween, dayKey } from "@/lib/analytics/day";
import type { AnalyticsRange, Granularity } from "@/lib/analytics/ranges";

export interface DailyPoint {
  /** YYYY-MM-DD of the bucket start (day, Monday of the week, or 1st of the month). */
  day: string;
  value: number;
}

interface Row {
  articleId: string;
  day: string; // YYYY-MM-DD
  value: number;
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

function bucketize(buckets: Date[], rows: Row[], granularity: Granularity): DailyPoint[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const key = iso(bucketStart(new Date(`${r.day}T00:00:00Z`), granularity));
    map.set(key, (map.get(key) ?? 0) + r.value);
  }
  return buckets.map((b) => ({ day: iso(b), value: map.get(iso(b)) ?? 0 }));
}

const total = (rows: { value: number }[]) => rows.reduce((n, r) => n + r.value, 0);

/** First day anything happened on the site — the left edge of "All time". */
async function firstActivityDay(): Promise<Date | null> {
  const [article, view, like, comment] = await Promise.all([
    prisma.article.aggregate({ _min: { publishedAt: true } }),
    prisma.articleViewDaily.aggregate({ _min: { day: true } }),
    prisma.like.aggregate({ _min: { createdAt: true } }),
    prisma.comment.aggregate({ _min: { createdAt: true } }),
  ]);
  const dates = [article._min.publishedAt, view._min.day, like._min.createdAt, comment._min.createdAt].filter((d): d is Date => d != null);
  if (dates.length === 0) return null;
  return analyticsDay(new Date(Math.min(...dates.map((d) => d.getTime()))));
}

export async function getDashboardAnalytics(range: AnalyticsRange) {
  const today = analyticsDay();
  let granularity: Granularity = range.granularity;

  let start: Date;
  let prevStart: Date | null;
  if (range.days === null) {
    // All time: from the first activity, but never fewer than 30 days so a
    // brand-new site still gets a readable chart. No "previous period".
    const first = await firstActivityDay();
    const floor = addDays(today, -29);
    start = first && first < floor ? first : floor;
    prevStart = null;
    // Pick the bucket size from how much history there actually is, so a young
    // site gets a daily chart and an old one a monthly chart.
    const spanDays = (today.getTime() - start.getTime()) / 86_400_000 + 1;
    granularity = spanDays <= 90 ? "day" : spanDays <= 366 ? "week" : "month";
  } else {
    start = addDays(today, -(range.days - 1));
    prevStart = addDays(start, -range.days);
  }

  const fetchFrom = prevStart ?? start;
  // Likes/comments carry real timestamps; widen by a day so Jakarta-day
  // bucketing never drops events near midnight UTC.
  const tsFrom = addDays(fetchFrom, -1);

  const [viewRows, likeRows, commentRows, articles, series, allTimeViews] = await Promise.all([
    prisma.articleViewDaily.findMany({ where: { day: { gte: fetchFrom } }, select: { articleId: true, day: true, views: true } }),
    prisma.like.findMany({ where: { createdAt: { gte: tsFrom } }, select: { articleId: true, createdAt: true } }),
    prisma.comment.findMany({ where: { createdAt: { gte: tsFrom } }, select: { articleId: true, createdAt: true } }),
    prisma.article.findMany({ where: { status: "PUBLISHED" }, select: { id: true, title: true, slug: true } }),
    prisma.series.findMany({
      orderBy: [{ order: "asc" }, { title: "asc" }],
      select: { id: true, title: true, articles: { select: { status: true } } },
    }),
    prisma.articleViewDaily.aggregate({ _sum: { views: true } }),
  ]);

  const startKey = iso(start);
  const prevKey = prevStart ? iso(prevStart) : null;
  const views: Row[] = viewRows.map((r) => ({ articleId: r.articleId, day: iso(r.day), value: r.views }));
  const likes: Row[] = likeRows.map((r) => ({ articleId: r.articleId, day: dayKey(r.createdAt), value: 1 }));
  const comments: Row[] = commentRows.map((r) => ({ articleId: r.articleId, day: dayKey(r.createdAt), value: 1 }));

  const inRange = (rows: Row[]) => rows.filter((r) => r.day >= startKey);
  const inPrev = (rows: Row[]) => (prevKey ? rows.filter((r) => r.day >= prevKey && r.day < startKey) : []);

  const buckets = bucketsBetween(start, today, granularity);
  const metric = (rows: Row[]) => {
    const current = inRange(rows);
    return {
      series: bucketize(buckets, current, granularity),
      total: total(current),
      previous: prevKey ? total(inPrev(rows)) : null,
    };
  };

  // Top articles in range: views first, engagement as tie-breaker.
  const perArticle = new Map<string, { views: number; likes: number; comments: number }>();
  const tally = (rows: Row[], field: "views" | "likes" | "comments") => {
    for (const r of inRange(rows)) {
      const entry = perArticle.get(r.articleId) ?? { views: 0, likes: 0, comments: 0 };
      entry[field] += r.value;
      perArticle.set(r.articleId, entry);
    }
  };
  tally(views, "views");
  tally(likes, "likes");
  tally(comments, "comments");

  const topArticles = articles
    .map((a) => ({ ...a, ...(perArticle.get(a.id) ?? { views: 0, likes: 0, comments: 0 }) }))
    .filter((a) => a.views + a.likes + a.comments > 0)
    .sort((a, b) => b.views - a.views || b.likes + b.comments - (a.likes + a.comments) || a.title.localeCompare(b.title))
    .slice(0, 5);

  const seriesProgress = series.map((s) => ({
    id: s.id,
    title: s.title,
    total: s.articles.length,
    published: s.articles.filter((a) => a.status === "PUBLISHED").length,
    drafts: s.articles.filter((a) => a.status === "DRAFT").length,
  }));

  return {
    granularity,
    startDay: startKey,
    views: metric(views),
    likes: metric(likes),
    comments: metric(comments),
    allTimeViews: allTimeViews._sum.views ?? 0,
    topArticles,
    seriesProgress,
  };
}

export type DashboardAnalytics = Awaited<ReturnType<typeof getDashboardAnalytics>>;
