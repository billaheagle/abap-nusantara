"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { commentSchema, commentModerationSchema } from "@/lib/validation/schemas";
import { sanitizePlainText } from "@/lib/security/sanitize";
import { rateLimit, getClientIp } from "@/lib/security/rate-limit";
import { hashValue } from "@/lib/security/anon";
import { issueCsrfToken, verifyCsrfToken } from "@/lib/security/csrf";
import { isReservedAuthorName } from "@/lib/security/reserved-names";
import { getAdminSession } from "@/lib/auth/session";

export type CommentFormState = { error?: string; success?: boolean };

const MAX_NESTING_DEPTH = 4;

/** A fresh CSRF token for the comment form (article pages are cached, so they can't carry one). */
export async function issueCommentTokenAction(): Promise<string> {
  return issueCsrfToken();
}

export async function submitCommentAction(_prev: CommentFormState, formData: FormData): Promise<CommentFormState> {
  // Honeypot: a hidden field real visitors never fill in.
  if (formData.get("website")) {
    return { success: true }; // pretend success so bots don't learn they were caught
  }

  const parsed = commentSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Komentar tidak valid" };
  }
  const data = parsed.data;

  const csrfOk = verifyCsrfToken(data.csrfToken);
  if (!csrfOk) return { error: "Sesi sudah kedaluwarsa. Muat ulang halaman, lalu coba lagi." };

  // "ABAP Nusantara", "admin", "moderator", … are reserved for the site owner.
  if (isReservedAuthorName(data.authorName)) {
    return { error: "Nama itu tidak bisa dipakai. Gunakan nama lain untuk berkomentar." };
  }

  const requestHeaders = await headers();
  const ip = getClientIp(requestHeaders);
  const { allowed } = rateLimit(`comment:${ip}`, 5, 10 * 60 * 1000); // 5 comments / 10 min / IP
  if (!allowed) return { error: "Komentar terlalu cepat. Tunggu sebentar, lalu coba lagi." };

  const article = await prisma.article.findUnique({ where: { id: data.articleId }, select: { id: true, status: true } });
  if (!article || article.status !== "PUBLISHED") return { error: "Artikel ini tidak menerima komentar." };

  if (data.parentCommentId) {
    let depth = 1;
    let currentParentId: string | null = data.parentCommentId;
    while (currentParentId && depth < MAX_NESTING_DEPTH + 1) {
      const parent: { parentCommentId: string | null } | null = await prisma.comment.findUnique({
        where: { id: currentParentId },
        select: { parentCommentId: true },
      });
      if (!parent) return { error: "Komentar yang kamu balas sudah tidak ada." };
      currentParentId = parent.parentCommentId;
      depth += 1;
    }
    if (depth > MAX_NESTING_DEPTH) return { error: "Balasan di utas ini sudah terlalu dalam." };
  }

  await prisma.comment.create({
    data: {
      articleId: data.articleId,
      parentCommentId: data.parentCommentId || null,
      authorName: sanitizePlainText(data.authorName),
      authorEmail: data.authorEmail.toLowerCase(),
      body: sanitizePlainText(data.body),
      ipHash: hashValue(ip),
      status: "PENDING",
    },
  });

  revalidatePath(`/articles`);
  return { success: true };
}

async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) throw new Error("Unauthorized");
}

export async function moderateCommentAction(formData: FormData) {
  await requireAdmin();
  const parsed = commentModerationSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error("Invalid moderation request");
  const comment = await prisma.comment.update({
    where: { id: parsed.data.id },
    data: { status: parsed.data.status },
    select: { article: { select: { slug: true } } },
  });
  revalidatePath("/admin/comments");
  // The article page is cached: show (or hide) the comment there right away.
  revalidatePath(`/articles/${comment.article.slug}`);
}

export async function deleteCommentAction(id: string) {
  await requireAdmin();
  const comment = await prisma.comment.delete({ where: { id }, select: { article: { select: { slug: true } } } });
  revalidatePath("/admin/comments");
  revalidatePath(`/articles/${comment.article.slug}`);
}
