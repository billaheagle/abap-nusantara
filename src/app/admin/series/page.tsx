import { prisma } from "@/lib/db/prisma";
import { SeriesManager } from "@/components/admin/series-manager";
import { PageHeader } from "@/components/admin/admin-ui";

export default async function AdminSeriesPage() {
  const series = await prisma.series.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { articles: true } } },
  });

  return (
    <div className="p-4 sm:p-8">
      <PageHeader title="Series" description="Group multi-part tutorials into an ordered journey." />
      <SeriesManager items={series} />
    </div>
  );
}
