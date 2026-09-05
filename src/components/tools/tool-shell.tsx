import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import type { ToolMeta } from "@/lib/tools/registry";

export function ToolShell({ tool, children }: { tool: ToolMeta; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
      <Link href="/tools" className="inline-flex items-center gap-1 text-sm text-foreground-muted transition-colors hover:text-brand">
        <ArrowLeft className="h-4 w-4" /> All tools
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{tool.name}</h1>
        {tool.status === "beta" && (
          <span className="rounded-full bg-gold-tint px-2 py-0.5 text-xs font-semibold text-gold-strong">Beta</span>
        )}
      </div>
      <p className="mt-2 max-w-2xl text-foreground-muted">{tool.blurb}</p>

      <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-tint px-3 py-1 text-xs font-medium text-brand">
        <ShieldCheck className="h-3.5 w-3.5" /> Runs entirely in your browser — nothing you paste is uploaded
      </p>

      <div className="mt-8">{children}</div>
    </div>
  );
}
