"use client";

import { startTransition, useActionState, useEffect, useMemo, useState, type ReactNode } from "react";
import { Check } from "lucide-react";
import { saveSettingsAction, type SettingsFormState } from "@/features/settings/actions";
import type { SettingKey } from "@/features/settings/schema";
import { IssuesContext } from "@/components/admin/settings/fields";

const initialState: SettingsFormState = {};

const LEAVE_PROMPT = "You have unsaved changes. Leave this page and discard them?";

/**
 * Warn before unsaved edits are lost. `beforeunload` covers reload / closing
 * the tab; in-app <Link> navigation never fires it, so same-tab link clicks
 * are intercepted in the capture phase (before Next's router sees them).
 */
function useUnsavedChangesGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, location.href);
      if (url.origin === location.origin && url.pathname === location.pathname && url.search === location.search) return;
      if (!window.confirm(LEAVE_PROMPT)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);
}

/**
 * Shell shared by every settings page: serialises the section's state into a
 * single JSON field, exposes validation messages to the fields, and pins the
 * Save bar to the bottom (Fiori object-page footer).
 */
export function SettingsForm({
  settingKey,
  value,
  previewHref,
  children,
}: {
  settingKey: SettingKey;
  value: unknown;
  previewHref: string;
  children: ReactNode;
}) {
  const [state, formAction, isPending] = useActionState(saveSettingsAction.bind(null, settingKey), initialState);
  const json = JSON.stringify(value);
  const [savedJson, setSavedJson] = useState(json);
  const [lastSavedAt, setLastSavedAt] = useState<number | undefined>();

  // Track the last successfully saved snapshot so the bar can show "Unsaved changes".
  if (state.ok && state.savedAt !== lastSavedAt) {
    setLastSavedAt(state.savedAt);
    setSavedJson(json);
  }
  const dirty = json !== savedJson;
  useUnsavedChangesGuard(dirty && !isPending);

  const issues = useMemo(() => Object.fromEntries((state.issues ?? []).map((i) => [i.path, i.message])), [state.issues]);

  return (
    // Submitted via onSubmit rather than <form action>: React resets an action
    // form after it settles, which snaps controlled checkboxes back to their
    // initial-render state while our state still holds the saved value.
    // noValidate: the server validates the whole section and reports issues
    // next to each field. Native validation would instead block Save with a
    // bubble that may sit inside a collapsed panel, so nothing seems to happen.
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => formAction(formData));
      }}
      className="flex flex-1 flex-col"
    >
      <input type="hidden" name="payload" value={json} />
      <IssuesContext.Provider value={issues}>
        <div className="flex-1 space-y-6 px-6 pb-6 sm:px-8 sm:pb-8">{children}</div>
      </IssuesContext.Provider>

      <div className="admin-footer-bar flex flex-wrap items-center justify-end gap-3 px-6 py-3 sm:px-8">
        <p className="mr-auto text-sm">
          {isPending ? null : state.error ? (
            <span className="text-negative">
              {state.error}
              {state.issues && state.issues.length > 0 && ` (${state.issues.length})`}
            </span>
          ) : dirty ? (
            <span className="text-critical">Unsaved changes</span>
          ) : state.ok ? (
            <span className="inline-flex items-center gap-1 text-positive"><Check className="h-4 w-4" /> Saved — live on the site</span>
          ) : null}
        </p>
        <a href={previewHref} target="_blank" rel="noopener noreferrer" className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-surface">
          View page
        </a>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-brand px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
