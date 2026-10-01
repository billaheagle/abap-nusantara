"use client";

import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { FilterSelect } from "@/components/ui/filter-select";
import { ANALYTICS_RANGES, DEFAULT_RANGE, type AnalyticsRangeKey } from "@/lib/analytics/ranges";

export function RangeSelect({ value }: { value: AnalyticsRangeKey }) {
  const router = useRouter();
  return (
    <FilterSelect
      label="Date range"
      align="right"
      icon={<CalendarDays />}
      value={value}
      defaultValue={DEFAULT_RANGE}
      onChange={(v) => router.push(v === DEFAULT_RANGE ? "/admin/dashboard" : `/admin/dashboard?range=${v}`)}
      options={ANALYTICS_RANGES.map((r) => ({ value: r.key, label: r.label, separated: r.key === "all" }))}
    />
  );
}
