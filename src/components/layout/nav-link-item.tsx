"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Header link. Site paths use client-side navigation and mark themselves
 * `aria-current="page"` on their own section; full URLs open in a new tab.
 */
export function NavLinkItem({ href, className, children }: { href: string; className: string; children: React.ReactNode }) {
  const pathname = usePathname();

  if (!href.startsWith("/")) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }

  const current = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link href={href} className={className} aria-current={current ? "page" : undefined}>
      {children}
    </Link>
  );
}
