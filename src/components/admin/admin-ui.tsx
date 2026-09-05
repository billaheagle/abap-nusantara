import type { ReactNode } from "react";

/** SAP Fiori "object status" — a semantic dot + label used across admin lists. */
export type StatusTone = "positive" | "critical" | "negative" | "neutral" | "info";

const TONE_CLASS: Record<StatusTone, string> = {
  positive: "text-positive",
  critical: "text-critical",
  negative: "text-negative",
  info: "text-brand",
  neutral: "text-foreground-muted",
};

export function ObjectStatus({ tone, children }: { tone: StatusTone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${TONE_CLASS[tone]}`}>
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />
      {children}
    </span>
  );
}

export function articleStatusTone(status: string): StatusTone {
  if (status === "PUBLISHED") return "positive";
  if (status === "ARCHIVED") return "negative";
  return "neutral"; // DRAFT
}

export function commentStatusTone(status: string): StatusTone {
  if (status === "APPROVED") return "positive";
  if (status === "PENDING") return "critical";
  return "negative"; // REJECTED / SPAM
}

/** Standard list-report / object-page title row: heading left, primary action right. */
export function PageHeader({
  title,
  description,
  back,
  action,
}: {
  title: string;
  description?: string;
  back?: { href: string; label: string };
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        {back && (
          <a href={back.href} className="text-xs font-medium text-brand hover:underline">
            ← {back.label}
          </a>
        )}
        <h1 className={`text-xl font-semibold tracking-tight ${back ? "mt-1" : ""}`}>{title}</h1>
        {description && <p className="mt-1 text-sm text-foreground-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
