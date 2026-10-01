"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, ListOrdered, FolderTree, Tag, MessageSquare, Wrench, Settings, ChevronDown } from "lucide-react";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/articles", label: "Articles", icon: FileText },
  { href: "/admin/series", label: "Series", icon: ListOrdered },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/tags", label: "Tags", icon: Tag },
  { href: "/admin/comments", label: "Comments", icon: MessageSquare },
  { href: "/admin/tools", label: "Tools", icon: Wrench },
];

const SETTINGS_BASE = "/admin/settings";
const SETTINGS_NAV = [
  { href: `${SETTINGS_BASE}/general`, label: "General" },
  { href: `${SETTINGS_BASE}/header`, label: "Header" },
  { href: `${SETTINGS_BASE}/about`, label: "About" },
  { href: `${SETTINGS_BASE}/footer`, label: "Footer" },
  { href: `${SETTINGS_BASE}/hire-me`, label: "Hire Me" },
];

const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

export function AdminNav() {
  const pathname = usePathname();
  const settingsActive = isActive(pathname, SETTINGS_BASE);
  // Expanded while on a settings page; the chevron lets the user toggle it elsewhere.
  const [settingsToggled, setSettingsToggled] = useState<boolean | null>(null);
  const settingsOpen = settingsToggled ?? settingsActive;
  const navRef = useRef<HTMLElement>(null);

  // A manual toggle only lasts until the next navigation, so leaving Settings
  // for another page collapses it again (adjusting state during render).
  const [togglePath, setTogglePath] = useState(pathname);
  if (togglePath !== pathname) {
    setTogglePath(pathname);
    setSettingsToggled(null);
  }

  // Tapping anywhere outside the nav also drops the manual toggle.
  useEffect(() => {
    if (settingsToggled === null) return;
    const onDown = (e: PointerEvent) => {
      if (!navRef.current?.contains(e.target as Node)) setSettingsToggled(null);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [settingsToggled]);

  return (
    <nav ref={navRef} className="flex flex-col gap-1 p-2">
      <div className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              data-active={active}
              aria-current={active ? "page" : undefined}
              className="admin-nav-link flex items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-foreground-muted"
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}

        <div className="shrink-0 md:mt-2 md:border-t md:border-border md:pt-2">
          <button
            type="button"
            onClick={() => setSettingsToggled(!settingsOpen)}
            aria-expanded={settingsOpen}
            aria-controls="admin-settings-nav"
            className={`admin-nav-link flex items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-2 text-left text-sm font-medium ${settingsActive ? "text-foreground" : "text-foreground-muted"}`}
          >
            <Settings className="h-4 w-4 shrink-0" />
            <span className="flex-1">Settings</span>
            <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${settingsOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Phones: sub-pages wrap onto their own row under the scrolling strip,
          so opening Settings never pushes them off-screen to the right. */}
      {settingsOpen && (
        <div id="admin-settings-nav" className="flex flex-wrap gap-1 border-t border-border pt-1 md:flex-col md:flex-nowrap md:border-t-0 md:pt-0">
          {SETTINGS_NAV.map(({ href, label }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                data-active={active}
                aria-current={active ? "page" : undefined}
                className="admin-nav-link flex items-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-foreground-muted md:ml-[1.125rem] md:pl-[1.25rem]"
              >
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
