"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

const loading = () => <div className="tool-panel h-64 animate-pulse rounded-md" />;

// Tools are browser utilities — clipboard, crypto.subtle, DOMParser, timers.
// Render them client-only so there is no SSR / hydration mismatch.
const TOOLS: Record<string, ComponentType> = {
  "sap-date-converter": dynamic(() => import("./sap-date-converter").then((m) => m.SapDateConverter), { loading, ssr: false }),
  "alpha-converter": dynamic(() => import("./alpha-converter").then((m) => m.AlphaConverter), { loading, ssr: false }),
  "payload-lab": dynamic(() => import("./payload-lab").then((m) => m.PayloadLab), { loading, ssr: false }),
  "odata-query-builder": dynamic(() => import("./odata-query-builder").then((m) => m.ODataQueryBuilder), { loading, ssr: false }),
  "edmx-explorer": dynamic(() => import("./edmx-explorer").then((m) => m.EdmxExplorer), { loading, ssr: false }),
  "jwt-inspector": dynamic(() => import("./jwt-inspector").then((m) => m.JwtInspector), { loading, ssr: false }),
  "regex-tester": dynamic(() => import("./regex-tester").then((m) => m.RegexTester), { loading, ssr: false }),
  "cds-annotations": dynamic(() => import("./cds-annotations-tool").then((m) => m.CdsAnnotationsTool), { loading, ssr: false }),
  "abap-type-mapper": dynamic(() => import("./abap-type-mapper").then((m) => m.AbapTypeMapper), { loading, ssr: false }),
  "groovy-snippets": dynamic(() => import("./groovy-snippets-tool").then((m) => m.GroovySnippetsTool), { loading, ssr: false }),
  "bapiret2-formatter": dynamic(() => import("./bapiret2-formatter").then((m) => m.Bapiret2Formatter), { loading, ssr: false }),
  "id-generator": dynamic(() => import("./id-generator").then((m) => m.IdGenerator), { loading, ssr: false }),
  "sap-codes": dynamic(() => import("./sap-codes-tool").then((m) => m.SapCodesTool), { loading, ssr: false }),
};

export function ToolRenderer({ slug }: { slug: string }) {
  const Tool = TOOLS[slug];
  if (!Tool) return <p className="text-sm text-foreground-muted">This tool is not available yet.</p>;
  return <Tool />;
}
