"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { commentSchema, commentModerationSchema } from "@/lib/validation/schemas";
import { sanitizePlainText } from "@/lib/security/sanitize";
import { rateLimit, getClientIp } from "@/lib/security/rate-limit";
import { hashValue } from "@/lib/security/anon";
import { verifyCsrfToken } from "@/lib/security/csrf";
import { isReservedAuthorName } from "@/lib/security/reserved-names";
import { getAdminSession } from "@/lib/auth/session";

export type CommentFormState = { error?: string; success?: boolean };

const MAX_NESTING_DEPTH = 4;

export async function submitCommentAction(_prev: CommentFormState, formData: FormData): Promise<CommentFormState> {
  // Honeypot: a hidden field real visitors never fill in.
  if (formData.get("website")) {
    return { success: true }; // pretend success so bots don't learn they were caught
  }

  const parsed = commentSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid comment" };
  }
  const data = parsed.data;

  const csrfOk = verifyCsrfToken(data.csrfToken);
  if (!csrfOk) return { error: "Your session expired — please reload the page and try again." };

  // "ABAP Nusantara", "admin", "moderator", … are reserved for the site owner.
  if (isReservedAuthorName(data.authorName)) {
    return { error: "That name is reserved — please comment under a different name." };
  }

  const requestHeaders = await headers();
  const ip = getClientIp(requestHeaders);
  const { allowed } = rateLimit(`comment:${ip}`, 5, 10 * 60 * 1000); // 5 comments / 10 min / IP
  if (!allowed) return { error: "You're commenting too quickly. Please wait a bit and try again." };

  const article = await prisma.article.findUnique({ where: { id: data.articleId }, select: { id: true, status: true } });
  if (!article || article.status !== "PUBLISHED") return { error: "This article does not accept comments." };

  if (data.parentCommentId) {
    let depth = 1;
    let currentParentId: string | null = data.parentCommentId;
    while (currentParentId && depth < MAX_NESTING_DEPTH + 1) {
      const parent: { parentCommentId: string | null } | null = await prisma.comment.findUnique({
        where: { id: currentParentId },
        select: { parentCommentId: true },
      });
      if (!parent) return { error: "The comment you're replying to no longer exists." };
      currentParentId = parent.parentCommentId;
      depth += 1;
    }
    if (depth > MAX_NESTING_DEPTH) return { error: "This thread is too deep to reply to further." };
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
  await prisma.comment.update({ where: { id: parsed.data.id }, data: { status: parsed.data.status } });
  revalidatePath("/admin/comments");
}

export async function deleteCommentAction(id: string) {
  await requireAdmin();
  await prisma.comment.delete({ where: { id } });
  revalidatePath("/admin/comments");
}
