import Link from "next/link";
import { Search } from "lucide-react";
import { GithubIcon } from "@/components/ui/github-icon";
import { LogoMark, Wordmark } from "@/components/brand/logo";
import { getSetting } from "@/features/settings/queries";
import { MobileNavBar } from "./mobile-nav-bar";
import { NavLinkItem } from "./nav-link-item";
import { SearchShortcut } from "./search-shortcut";
import { ThemeToggle } from "./theme-toggle";

export async function SiteHeader() {
  const [{ brand, links }, header] = await Promise.all([getSetting("general"), getSetting("header")]);
  const siteName = [brand.name, brand.accent].filter(Boolean).join(" ");
  const navLinks = header.links.filter((link) => !link.hidden);

  return (
    <header className="pointer-events-none sticky top-0 z-40 px-3 pt-3 pb-3 sm:px-4 sm:pt-3.5">
      <div className="glass pointer-events-auto mx-auto flex h-[3.75rem] max-w-6xl items-center gap-3 rounded-[18px] border border-border-strong/60 pl-2.5 pr-2 shadow-[var(--shadow-1)] sm:gap-4 sm:pl-3.5">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label={`${siteName}, beranda`}>
          <LogoMark size={36} />
          <Wordmark name={brand.name} accent={brand.accent} className="text-[1.0625rem] sm:text-lg" />
        </Link>

        <nav className="ml-1 hidden items-center gap-0.5 md:flex" aria-label="Utama">
          {navLinks.map((link) => (
            <NavLinkItem
              key={`${link.label}-${link.href}`}
              href={link.href}
              className="rounded-[10px] px-3 py-[7px] text-[0.9375rem] font-[550] text-foreground-muted transition-colors hover:bg-surface hover:text-foreground aria-[current=page]:bg-surface aria-[current=page]:text-foreground"
            >
              {link.label}
            </NavLinkItem>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          {header.showSearch && (
            <>
              <SearchShortcut />
              <Link
                href="/search"
                aria-label="Cari artikel"
                className="flex items-center gap-2.5 rounded-xl border border-transparent bg-surface p-2.5 text-sm text-foreground-muted transition-colors hover:border-border-strong lg:min-w-[15rem] lg:py-2 lg:pl-3 lg:pr-2"
              >
                <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="hidden lg:inline">Cari artikel…</span>
                <kbd className="ml-auto hidden rounded-md border border-border bg-surface-elevated px-1.5 py-0.5 font-sans text-xs font-semibold lg:inline">
                  Ctrl K
                </kbd>
              </Link>
            </>
          )}
          <ThemeToggle />
          {header.showGithub && links.github && (
            <a
              href={links.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="hidden rounded-xl p-2.5 text-foreground-muted transition-colors hover:bg-surface hover:text-foreground sm:flex"
            >
              <GithubIcon className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>

      {/* Mobile nav: a row of chips that slides away while scrolling down. */}
      {navLinks.length > 0 && (
        <MobileNavBar>
          {navLinks.map((link) => (
            <NavLinkItem
              key={`${link.label}-${link.href}`}
              href={link.href}
              className="whitespace-nowrap rounded-full border border-border bg-surface-elevated/85 px-2.5 py-1.5 text-[0.8125rem] font-semibold text-foreground-muted backdrop-blur-md aria-[current=page]:border-foreground aria-[current=page]:bg-foreground aria-[current=page]:text-background"
            >
              {link.label}
            </NavLinkItem>
          ))}
        </MobileNavBar>
      )}
    </header>
  );
}
