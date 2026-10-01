import { prisma } from "@/lib/db/prisma";
import { CategoryManager } from "@/components/admin/category-tag-manager";
import { PageHeader } from "@/components/admin/admin-ui";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { articles: true } } },
  });
  return (
    <div className="p-4 sm:p-8">
      <PageHeader title="Categories" description="Top-level topics articles are filed under." />
      <CategoryManager items={categories} />
    </div>
  );
}
