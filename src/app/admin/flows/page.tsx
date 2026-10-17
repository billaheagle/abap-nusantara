import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/admin/admin-ui";
import { FlowWorkbench, type FlowSource } from "@/components/admin/flow-workbench";
import { FLOW_LANGUAGE } from "@/lib/flows/types";
import { formatFlow } from "@/lib/flows/format";
import { HOME_FLOW } from "@/lib/flows/home-flow";

interface Node {
  type: string;
  attrs?: Record<string, unknown>;
  content?: Node[];
  text?: string;
}

/** The text of an article's first top-level ```flow block, if it has one. */
function flowSource(doc: unknown): string | null {
  for (const block of (doc as Node | null)?.content ?? []) {
    if (block.type === "codeBlock" && block.attrs?.language === FLOW_LANGUAGE) return block.content?.map((c) => c.text ?? "").join("") ?? "";
  }
  return null;
}

export default async function AdminFlowsPage() {
  const rows = await prisma.article.findMany({
    where: { status: { not: "ARCHIVED" } },
    orderBy: [{ series: { order: "asc" } }, { seriesOrder: "asc" }, { title: "asc" }],
    select: { slug: true, title: true, status: true, contentJson: true },
  });
  const articles: FlowSource[] = rows.flatMap((a) => {
    const source = flowSource(a.contentJson);
    return source ? [{ slug: a.slug, title: a.title, status: a.status, source }] : [];
  });

  return (
    <div className="flex min-h-full flex-col">
      <div className="px-6 pt-6 sm:px-8 sm:pt-8">
        <PageHeader
          title="Flow preview"
          description="Write or paste a ```flow block and see it play as readers will, on desktop or phone width. It's checked with the importer's own rules as you type. Nothing here is saved: copy the block into the article's markdown when it looks right (format and fields: 00-plan/ILUSTRASI_ALUR.md)."
        />
      </div>
      <FlowWorkbench articles={articles} initial={articles[0]?.source ?? formatFlow(HOME_FLOW)} />
    </div>
  );
}
