"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { likeSchema } from "@/lib/validation/schemas";
import { readAnonHash, getOrCreateAnonHash } from "@/lib/security/anon";
import { rateLimit, getClientIp } from "@/lib/security/rate-limit";

export async function toggleLikeAction(articleId: string): Promise<{ liked: boolean; count: number; error?: string }> {
  const parsed = likeSchema.safeParse({ articleId });
  if (!parsed.success) return { liked: false, count: 0, error: "Invalid article" };

  const requestHeaders = await headers();
  const ip = getClientIp(requestHeaders);
  // Secondary abuse signal on top of the anon-cookie uniqueness constraint below.
  const { allowed } = rateLimit(`like:${ip}`, 20, 60 * 1000);
  if (!allowed) return { liked: false, count: 0, error: "Too many requests — please slow down." };

  const anonHash = await getOrCreateAnonHash();

  const existing = await prisma.like.findUnique({
    where: { articleId_anonHash: { articleId, anonHash } },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
  } else {
    // Unique constraint on (articleId, anonHash) is the real backstop against
    // double-liking, even under concurrent requests — this is defense in depth,
    // not the sole protection.
    await prisma.like.create({ data: { articleId, anonHash } }).catch(() => null);
  }

  const count = await prisma.like.count({ where: { articleId } });
  revalidatePath("/articles/[slug]", "page");
  return { liked: !existing, count };
}

export async function getLikeState(articleId: string) {
  const anonHash = await readAnonHash();
  if (!anonHash) {
    // Visitor has no anon cookie yet (and we can't set one during render) —
    // they can't have liked anything, so just report the count.
    const count = await prisma.like.count({ where: { articleId } });
    return { liked: false, count };
  }
  const [liked, count] = await Promise.all([
    prisma.like.findUnique({ where: { articleId_anonHash: { articleId, anonHash } } }),
    prisma.like.count({ where: { articleId } }),
  ]);
  return { liked: Boolean(liked), count };
}
