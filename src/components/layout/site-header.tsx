import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
import { GithubIcon } from "@/components/ui/github-icon";

const NAV_LINKS = [
  { href: "/articles", label: "Articles" },
  { href: "/series", label: "Series" },
  { href: "/categories", label: "Categories" },
  { href: "/tools", label: "Tools" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 pt-3 pb-4 px-3 sm:pt-4 sm:pb-6 sm:px-6">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between rounded-full border border-border bg-background/80 px-3 sm:px-4 backdrop-blur-md shadow-[0_1px_2px_rgba(13,14,18,0.04)] supports-[backdrop-filter]:bg-background/70">
        <Link href="/" className="flex items-center gap-2 shrink-0 pl-1">
          <Image src="/brand/logo-200.png" alt="ABAP Nusantara" width={36} height={36} className="h-9 w-9 object-contain" priority />
          <span className="hidden sm:block text-sm font-semibold tracking-tight">
            ABAP <span className="text-brand">Nusantara</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-foreground-muted">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1.5 hover:text-foreground hover:bg-surface transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 pr-0.5">
          <Link
            href="/search"
            aria-label="Search articles"
            className="p-2 rounded-full text-foreground-muted hover:text-foreground hover:bg-surface transition-colors"
          >
            <Search className="h-4 w-4" />
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="hidden sm:flex p-2 rounded-full text-foreground-muted hover:text-foreground hover:bg-surface transition-colors"
          >
            <GithubIcon className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="md:hidden mt-2 mx-auto max-w-4xl flex items-center gap-1 overflow-x-auto rounded-full border border-border bg-background/80 backdrop-blur-md px-2 py-1.5 text-sm font-medium text-foreground-muted">
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="whitespace-nowrap rounded-full px-3 py-1 hover:text-foreground hover:bg-surface">
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
