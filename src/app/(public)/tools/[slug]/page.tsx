import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTool, LIVE_TOOL_SLUGS } from "@/lib/tools/registry";
import { ToolShell } from "@/components/tools/tool-shell";
import { ToolRenderer } from "@/components/tools/tool-renderer";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return LIVE_TOOL_SLUGS.map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) return {};
  return { title: tool.name, description: tool.blurb };
}

export default async function ToolPage({ params }: PageProps) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool || tool.status === "planned") notFound();

  return (
    <ToolShell tool={tool}>
      <ToolRenderer slug={slug} />
    </ToolShell>
  );
}
