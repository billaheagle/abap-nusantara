"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import readingTime from "reading-time";
import { prisma } from "@/lib/db/prisma";
import { getAdminSession } from "@/lib/auth/session";
import { articleInputSchema } from "@/lib/validation/schemas";
import { isSlugTaken } from "@/features/articles/admin-queries";
import { extractPlainTextFromTiptap } from "@/lib/editor/serialize";

async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export type ArticleFormState = { error?: string; fieldErrors?: Record<string, string> };

export async function createArticleAction(_prev: ArticleFormState, formData: FormData): Promise<ArticleFormState> {
  await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  let contentJson: unknown;
  try {
    contentJson = JSON.parse(String(formData.get("contentJson") || "{}"));
  } catch {
    return { fieldErrors: { contentJson: "Article content could not be read — please try again." } };
  }
  const tagIds = formData.getAll("tagIds").map(String);

  const parsed = articleInputSchema.safeParse({ ...raw, contentJson, tagIds });
  if (!parsed.success) {
    return { fieldErrors: Object.fromEntries(Object.entries(parsed.error.flatten().fieldErrors).map(([k, v]) => [k, v?.[0] ?? ""])) };
  }
  const data = parsed.data;

  if (await isSlugTaken(data.slug)) {
    return { fieldErrors: { slug: "This slug is already in use" } };
  }

  const plainText = extractPlainTextFromTiptap(data.contentJson);
  const stats = readingTime(plainText);

  const article = await prisma.article.create({
    data: {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt || null,
      contentJson: data.contentJson,
      coverImage: data.coverImage || null,
      repoUrl: data.repoUrl || null,
      status: data.status,
      seriesId: data.seriesId || null,
      seriesOrder: data.seriesOrder ?? null,
      categoryId: data.categoryId || null,
      readingTimeMin: Math.max(1, Math.round(stats.minutes)),
      publishedAt: data.status === "PUBLISHED" ? new Date() : null,
      tags: { create: data.tagIds.map((tagId) => ({ tagId })) },
    },
  });

  revalidatePath("/admin/articles");
  revalidatePath("/articles");
  redirect(`/admin/articles/${article.id}`);
}

export async function updateArticleAction(id: string, _prev: ArticleFormState, formData: FormData): Promise<ArticleFormState> {
  await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  let contentJson: unknown;
  try {
    contentJson = JSON.parse(String(formData.get("contentJson") || "{}"));
  } catch {
    return { fieldErrors: { contentJson: "Article content could not be read — please try again." } };
  }
  const tagIds = formData.getAll("tagIds").map(String);

  const parsed = articleInputSchema.safeParse({ ...raw, contentJson, tagIds });
  if (!parsed.success) {
    return { fieldErrors: Object.fromEntries(Object.entries(parsed.error.flatten().fieldErrors).map(([k, v]) => [k, v?.[0] ?? ""])) };
  }
  const data = parsed.data;

  if (await isSlugTaken(data.slug, id)) {
    return { fieldErrors: { slug: "This slug is already in use" } };
  }

  const existing = await prisma.article.findUnique({ where: { id }, select: { status: true, publishedAt: true } });
  if (!existing) return { error: "Article not found" };

  const plainText = extractPlainTextFromTiptap(data.contentJson);
  const stats = readingTime(plainText);
  const isNewlyPublished = data.status === "PUBLISHED" && existing.status !== "PUBLISHED";

  await prisma.$transaction([
    prisma.articleTag.deleteMany({ where: { articleId: id } }),
    prisma.article.update({
      where: { id },
      data: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt || null,
        contentJson: data.contentJson,
        coverImage: data.coverImage || null,
        repoUrl: data.repoUrl || null,
        status: data.status,
        seriesId: data.seriesId || null,
        seriesOrder: data.seriesOrder ?? null,
        categoryId: data.categoryId || null,
        readingTimeMin: Math.max(1, Math.round(stats.minutes)),
        publishedAt: isNewlyPublished ? new Date() : existing.publishedAt,
        tags: { create: data.tagIds.map((tagId) => ({ tagId })) },
      },
    }),
  ]);

  revalidatePath("/admin/articles");
  revalidatePath(`/articles/${data.slug}`);
  revalidatePath("/articles");
  return {};
}

export async function deleteArticleAction(id: string) {
  await requireAdmin();
  await prisma.article.delete({ where: { id } });
  revalidatePath("/admin/articles");
  revalidatePath("/articles");
}

export async function setArticleStatusAction(id: string, status: "DRAFT" | "PUBLISHED" | "ARCHIVED") {
  await requireAdmin();
  const existing = await prisma.article.findUnique({ where: { id }, select: { publishedAt: true } });
  await prisma.article.update({
    where: { id },
    data: {
      status,
      publishedAt: status === "PUBLISHED" ? (existing?.publishedAt ?? new Date()) : existing?.publishedAt,
    },
  });
  revalidatePath("/admin/articles");
  revalidatePath("/articles");
}
