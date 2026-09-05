import "server-only";
import { prisma } from "@/lib/db/prisma";
import { ArticleStatus, Prisma } from "@prisma/client";

const ADMIN_PAGE_SIZE = 8;

const ADMIN_ARTICLE_SORTS = {
  updated: { updatedAt: "desc" },
  created: { createdAt: "desc" },
  title: { title: "asc" },
  status: { status: "asc" },
  likes: { likes: { _count: "desc" } },
} satisfies Record<string, Prisma.ArticleOrderByWithRelationInput>;

export type AdminArticleSort = keyof typeof ADMIN_ARTICLE_SORTS;

export interface AdminArticleFilters {
  page?: number;
  q?: string;
  status?: ArticleStatus | "ALL";
  categoryId?: string;
  sort?: AdminArticleSort;
  likedOnly?: boolean;
}

export async function getAdminArticleList(filters: AdminArticleFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const sort = filters.sort && filters.sort in ADMIN_ARTICLE_SORTS ? filters.sort : "updated";

  const where: Prisma.ArticleWhereInput = {
    ...(filters.status && filters.status !== "ALL" ? { status: filters.status } : {}),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.likedOnly ? { likes: { some: {} } } : {}),
    ...(filters.q
      ? {
          OR: [
            { title: { contains: filters.q, mode: "insensitive" } },
            { slug: { contains: filters.q, mode: "insensitive" } },
            { excerpt: { contains: filters.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: ADMIN_ARTICLE_SORTS[sort],
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        updatedAt: true,
        publishedAt: true,
        category: { select: { name: true } },
        series: { select: { title: true } },
        _count: { select: { likes: true } },
      },
    }),
    prisma.article.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize: ADMIN_PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
  };
}

export async function getArticleForEdit(id: string) {
  return prisma.article.findUnique({
    where: { id },
    include: { tags: { select: { tagId: true } } },
  });
}

export async function getDashboardStats() {
  const [totalArticles, published, drafts, totalComments, pendingComments, totalLikes] = await Promise.all([
    prisma.article.count(),
    prisma.article.count({ where: { status: "PUBLISHED" } }),
    prisma.article.count({ where: { status: "DRAFT" } }),
    prisma.comment.count(),
    prisma.comment.count({ where: { status: "PENDING" } }),
    prisma.like.count(),
  ]);
  return { totalArticles, published, drafts, totalComments, pendingComments, totalLikes };
}

export async function isSlugTaken(slug: string, excludeId?: string) {
  const where: Prisma.ArticleWhereInput = excludeId ? { slug, NOT: { id: excludeId } } : { slug };
  const existing = await prisma.article.findFirst({ where, select: { id: true } });
  return Boolean(existing);
}
