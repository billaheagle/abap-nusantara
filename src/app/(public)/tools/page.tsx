import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeftRight,
  Binary,
  CalendarClock,
  Code2,
  Fingerprint,
  FlaskConical,
  Globe2,
  KeyRound,
  Link2,
  MessageSquareWarning,
  Network,
  Regex,
  ShieldCheck,
  Tags,
  type LucideIcon,
} from "lucide-react";
import { CATEGORY_ORDER, TOOL_REGISTRY } from "@/lib/tools/registry";
import { getSetting } from "@/features/settings/queries";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "Developer Tools",
  description:
    "A growing set of browser-based utilities for SAP development — SAP date conversion, ALPHA exits, OData query building, payload formatting, JWT decoding and more. Nothing you paste leaves your browser.",
};

const ICONS: Record<string, LucideIcon> = {
  CalendarClock,
  Binary,
  FlaskConical,
  Link2,
  Network,
  KeyRound,
  Regex,
  Tags,
  ArrowLeftRight,
  Code2,
  MessageSquareWarning,
  Fingerprint,
  Globe2,
  ShieldCheck,
};

export default async function ToolsPage() {
  // Tools hidden from the admin (Admin → Tools) are left out entirely.
  const hidden = new Set((await getSetting("tools")).hidden);
  const byCategory = CATEGORY_ORDER.map((category) => ({
    category,
    tools: TOOL_REGISTRY.filter((t) => t.category === category && !hidden.has(t.slug)),
  })).filter((g) => g.tools.length > 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="mb-2 text-xs font-mono font-medium uppercase tracking-wider text-brand">[ Tools ]</p>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Developer tools for SAP</h1>
      <p className="mt-3 max-w-2xl text-foreground-muted">
        Small, focused utilities for everyday ABAP, OData and Integration Suite work — built alongside the articles.
      </p>
      <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-tint px-3 py-1 text-xs font-medium text-brand">
        <ShieldCheck className="h-3.5 w-3.5" /> Every tool runs entirely in your browser — nothing you paste is uploaded
      </p>

      <div className="mt-12 space-y-12">
        {byCategory.length === 0 && (
          <EmptyState icon={FlaskConical} title="Tools are being tuned up" description="Check back soon — the developer tools will be back shortly." />
        )}
        {byCategory.map(({ category, tools }) => (
          <section key={category}>
            <h2 className="mb-4 text-sm font-semibold text-foreground-muted">{category}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool) => {
                const Icon = ICONS[tool.icon] ?? FlaskConical;
                const planned = tool.status === "planned";
                const inner = (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-md ${
                          planned ? "bg-surface text-foreground-muted" : "bg-brand-tint text-brand"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      {planned ? (
                        <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium text-foreground-muted">
                          Planned
                        </span>
                      ) : tool.status === "beta" ? (
                        <span className="rounded-full bg-gold-tint px-2 py-0.5 text-[11px] font-semibold text-gold-strong">
                          Beta
                        </span>
                      ) : (
                        <ArrowRight className="h-4 w-4 text-foreground-muted transition group-hover:translate-x-0.5 group-hover:text-brand" />
                      )}
                    </div>
                    <h3 className="mt-3 font-semibold leading-snug">{tool.name}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-foreground-muted">{tool.blurb}</p>
                  </>
                );

                return planned ? (
                  <div
                    key={tool.slug}
                    className="flex flex-col rounded-xl border border-dashed border-border bg-surface-elevated p-5 opacity-70"
                  >
                    {inner}
                  </div>
                ) : (
                  <Link
                    key={tool.slug}
                    href={`/tools/${tool.slug}`}
                    className="card-hover group flex flex-col rounded-xl border border-border bg-surface-elevated p-5"
                  >
                    {inner}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
