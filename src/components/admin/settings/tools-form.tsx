"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import type { ToolsSettings } from "@/features/settings/schema";
import { CATEGORY_ORDER, TOOL_REGISTRY } from "@/lib/tools/registry";
import { SettingsForm } from "@/components/admin/settings/settings-form";
import { ObjectStatus } from "@/components/admin/admin-ui";

export function ToolsSettingsForm({ initial }: { initial: ToolsSettings }) {
  const [v, setV] = useState(initial);
  const hidden = new Set(v.hidden);

  const toggle = (slug: string, publish: boolean) =>
    setV({ hidden: publish ? v.hidden.filter((s) => s !== slug) : [...v.hidden, slug] });

  const available = TOOL_REGISTRY.filter((t) => t.status !== "planned");
  const publishedCount = available.filter((t) => !hidden.has(t.slug)).length;

  return (
    <SettingsForm settingKey="tools" value={v} previewHref="/tools">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <span>
          <strong>{publishedCount}</strong> of {available.length} tools published
        </span>
        <span className="flex gap-2">
          <button type="button" className="admin-btn" onClick={() => setV({ hidden: [] })}>
            Publish all
          </button>
          <button type="button" className="admin-btn" onClick={() => setV({ hidden: available.map((t) => t.slug) })}>
            Hide all
          </button>
        </span>
      </div>

      {CATEGORY_ORDER.map((category) => {
        const tools = TOOL_REGISTRY.filter((t) => t.category === category);
        if (tools.length === 0) return null;
        return (
          <section key={category} className="admin-card overflow-hidden">
            <h2 className="admin-th px-4 py-2">{category}</h2>
            <ul className="divide-y divide-border">
              {tools.map((tool) => {
                const planned = tool.status === "planned";
                const published = !planned && !hidden.has(tool.slug);
                return (
                  <li key={tool.slug} className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                        {tool.name}
                        {tool.status === "beta" && (
                          <span className="rounded-full bg-gold-tint px-2 py-0.5 text-[10px] font-semibold text-gold-strong">Beta</span>
                        )}
                      </p>
                      <p className="font-mono text-xs text-foreground-muted">/tools/{tool.slug}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {planned ? (
                        <ObjectStatus tone="neutral">Planned — not built yet</ObjectStatus>
                      ) : (
                        <>
                          <ObjectStatus tone={published ? "positive" : "negative"}>{published ? "Published" : "Hidden"}</ObjectStatus>
                          <a
                            href={`/tools/${tool.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="admin-btn admin-btn-icon"
                            aria-label={`Open ${tool.name}`}
                            title="Open tool"
                          >
                            <ExternalLink />
                          </a>
                          <label className="relative inline-flex cursor-pointer items-center" title={published ? "Hide this tool" : "Publish this tool"}>
                            <input
                              type="checkbox"
                              className="peer sr-only"
                              checked={published}
                              onChange={(e) => toggle(tool.slug, e.target.checked)}
                              aria-label={`${tool.name} published`}
                            />
                            <span className="h-5 w-9 rounded-full bg-border-strong transition-colors peer-checked:bg-positive peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40" />
                            <span className="pointer-events-none absolute left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
                          </label>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </SettingsForm>
  );
}
