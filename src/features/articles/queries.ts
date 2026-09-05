import { prisma } from "@/lib/db/prisma";
import { ArticleStatus, Prisma } from "@prisma/client";

const PAGE_SIZE = 9;

export interface ArticleListFilters {
  page?: number;
  query?: string;
  categorySlug?: string;
  tagSlug?: string;
  sort?: "newest" | "oldest";
}

const publicArticleSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverImage: true,
  readingTimeMin: true,
  publishedAt: true,
  updatedAt: true,
  series: { select: { title: true, slug: true } },
  category: { select: { name: true, slug: true } },
  tags: { select: { tag: { select: { name: true, slug: true } } } },
} satisfies Prisma.ArticleSelect;

export async function getPublishedArticles(filters: ArticleListFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const where: Prisma.ArticleWhereInput = {
    status: ArticleStatus.PUBLISHED,
    ...(filters.categorySlug ? { category: { slug: filters.categorySlug } } : {}),
    ...(filters.tagSlug ? { tags: { some: { tag: { slug: filters.tagSlug } } } } : {}),
    ...(filters.query
      ? {
          OR: [
            { title: { contains: filters.query, mode: "insensitive" } },
            { excerpt: { contains: filters.query, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      select: publicArticleSelect,
      orderBy: { publishedAt: filters.sort === "oldest" ? "asc" : "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.article.count({ where }),
  ]);

  return { items, total, page, pageSize: PAGE_SIZE, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getFeaturedArticles(limit = 3) {
  return prisma.article.findMany({
    where: { status: ArticleStatus.PUBLISHED },
    select: publicArticleSelect,
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}

export async function getArticleBySlug(slug: string) {
  return prisma.article.findFirst({
    where: { slug, status: ArticleStatus.PUBLISHED },
    include: {
      series: {
        include: {
          articles: {
            where: { status: ArticleStatus.PUBLISHED },
            select: { id: true, title: true, slug: true, seriesOrder: true },
            orderBy: { seriesOrder: "asc" },
          },
        },
      },
      category: true,
      tags: { include: { tag: true } },
      _count: { select: { likes: true } },
    },
  });
}

export async function getRelatedArticles(articleId: string, categoryId: string | null, tagSlugs: string[], limit = 3) {
  const orClauses: Prisma.ArticleWhereInput[] = [];
  if (categoryId) orClauses.push({ categoryId });
  if (tagSlugs.length) orClauses.push({ tags: { some: { tag: { slug: { in: tagSlugs } } } } });

  // With no category and no tags there is nothing to relate on — an empty
  // `OR` would match every published article instead of none.
  if (orClauses.length === 0) return [];

  return prisma.article.findMany({
    where: {
      id: { not: articleId },
      status: ArticleStatus.PUBLISHED,
      OR: orClauses,
    },
    select: publicArticleSelect,
    take: limit,
  });
}

export async function getAllPublishedSlugs() {
  const rows = await prisma.article.findMany({
    where: { status: ArticleStatus.PUBLISHED },
    select: { slug: true, updatedAt: true },
  });
  return rows;
}
