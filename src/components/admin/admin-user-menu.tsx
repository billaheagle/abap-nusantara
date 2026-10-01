"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, ExternalLink, LogOut } from "lucide-react";
import { logoutAction } from "@/features/auth/actions";

function initials(email: string) {
  const name = email.split("@")[0];
  const parts = name.split(/[._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "")).toUpperCase() || "A";
}

/** Shell-bar avatar → dropdown with the signed-in identity and sign-out. */
export function AdminUserMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className={`flex items-center gap-1.5 rounded-full p-0.5 pr-1.5 transition-colors hover:bg-white/10 ${open ? "bg-white/10" : ""}`}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-gold to-sunset text-[11px] font-bold text-ink ring-2 ring-white/15">
          {initials(email)}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-white/60 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div role="menu" className="shell-menu absolute right-0 top-[calc(100%+0.5rem)] w-64 overflow-hidden">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold to-sunset text-xs font-bold text-ink">
              {initials(email)}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Administrator</p>
              <p className="truncate text-xs text-foreground-muted">{email}</p>
            </div>
          </div>
          <div className="p-1">
            <Link
              href="/"
              target="_blank"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-foreground hover:bg-surface"
            >
              <ExternalLink className="h-4 w-4 text-foreground-muted" /> View site
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-negative hover:bg-negative-tint"
              >
                <LogOut className="h-4 w-4" /> Log out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
