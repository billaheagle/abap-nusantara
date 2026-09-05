"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getAdminSession } from "@/lib/auth/session";
import { categoryInputSchema, tagInputSchema } from "@/lib/validation/schemas";

async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) throw new Error("Unauthorized");
}

export type SimpleFormState = { error?: string; fieldErrors?: Record<string, string> };

function flatten(errors: Record<string, string[] | undefined>) {
  return Object.fromEntries(Object.entries(errors).map(([k, v]) => [k, v?.[0] ?? ""]));
}

// --- Categories -------------------------------------------------------

export async function createCategoryAction(_prev: SimpleFormState, formData: FormData): Promise<SimpleFormState> {
  await requireAdmin();
  const parsed = categoryInputSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { fieldErrors: flatten(parsed.error.flatten().fieldErrors) };
  if (await prisma.category.findUnique({ where: { slug: parsed.data.slug } })) {
    return { fieldErrors: { slug: "Slug already exists" } };
  }
  await prisma.category.create({ data: { ...parsed.data, description: parsed.data.description || null } });
  revalidatePath("/admin/categories");
  return {};
}

export async function updateCategoryAction(id: string, _prev: SimpleFormState, formData: FormData): Promise<SimpleFormState> {
  await requireAdmin();
  const parsed = categoryInputSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { fieldErrors: flatten(parsed.error.flatten().fieldErrors) };
  const clash = await prisma.category.findFirst({ where: { slug: parsed.data.slug, NOT: { id } } });
  if (clash) return { fieldErrors: { slug: "Slug already exists" } };
  await prisma.category.update({ where: { id }, data: { ...parsed.data, description: parsed.data.description || null } });
  revalidatePath("/admin/categories");
  return {};
}

export async function deleteCategoryAction(id: string) {
  await requireAdmin();
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
}

// --- Tags ---------------------------------------------------------------

export async function createTagAction(_prev: SimpleFormState, formData: FormData): Promise<SimpleFormState> {
  await requireAdmin();
  const parsed = tagInputSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { fieldErrors: flatten(parsed.error.flatten().fieldErrors) };
  if (await prisma.tag.findUnique({ where: { slug: parsed.data.slug } })) {
    return { fieldErrors: { slug: "Slug already exists" } };
  }
  await prisma.tag.create({ data: parsed.data });
  revalidatePath("/admin/tags");
  return {};
}

export async function deleteTagAction(id: string) {
  await requireAdmin();
  await prisma.tag.delete({ where: { id } });
  revalidatePath("/admin/tags");
}
