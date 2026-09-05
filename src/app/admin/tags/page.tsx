import { prisma } from "@/lib/db/prisma";
import { TagManager } from "@/components/admin/category-tag-manager";
import { PageHeader } from "@/components/admin/admin-ui";

export default async function AdminTagsPage() {
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { articles: true } } },
  });
  return (
    <div className="p-6 sm:p-8">
      <PageHeader title="Tags" description="Fine-grained labels for cross-cutting topics." />
      <TagManager items={tags} />
    </div>
  );
}
