"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getAdminSession } from "@/lib/auth/session";
import { seriesInputSchema } from "@/lib/validation/schemas";

async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) throw new Error("Unauthorized");
}

export type SimpleFormState = { error?: string; fieldErrors?: Record<string, string> };

export async function createSeriesAction(_prev: SimpleFormState, formData: FormData): Promise<SimpleFormState> {
  await requireAdmin();
  const parsed = seriesInputSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { fieldErrors: flatten(parsed.error.flatten().fieldErrors) };

  const existing = await prisma.series.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) return { fieldErrors: { slug: "Slug already exists" } };

  await prisma.series.create({ data: { ...parsed.data, description: parsed.data.description || null, coverImage: parsed.data.coverImage || null } });
  revalidatePath("/admin/series");
  revalidatePath("/series");
  return {};
}

export async function updateSeriesAction(id: string, _prev: SimpleFormState, formData: FormData): Promise<SimpleFormState> {
  await requireAdmin();
  const parsed = seriesInputSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { fieldErrors: flatten(parsed.error.flatten().fieldErrors) };

  const clash = await prisma.series.findFirst({ where: { slug: parsed.data.slug, NOT: { id } } });
  if (clash) return { fieldErrors: { slug: "Slug already exists" } };

  await prisma.series.update({
    where: { id },
    data: { ...parsed.data, description: parsed.data.description || null, coverImage: parsed.data.coverImage || null },
  });
  revalidatePath("/admin/series");
  revalidatePath("/series");
  return {};
}

export async function deleteSeriesAction(id: string) {
  await requireAdmin();
  // The FK's onDelete: SetNull clears Article.seriesId, but Article.seriesOrder
  // would be left dangling — null it out in the same transaction.
  await prisma.$transaction([
    prisma.article.updateMany({ where: { seriesId: id }, data: { seriesOrder: null } }),
    prisma.series.delete({ where: { id } }),
  ]);
  revalidatePath("/admin/series");
  revalidatePath("/series");
}

function flatten(errors: Record<string, string[] | undefined>) {
  return Object.fromEntries(Object.entries(errors).map(([k, v]) => [k, v?.[0] ?? ""]));
}
