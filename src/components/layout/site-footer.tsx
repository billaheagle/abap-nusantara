import Link from "next/link";
import Image from "next/image";
import { Mail } from "lucide-react";
import { GithubIcon } from "@/components/ui/github-icon";
import { LinkedinIcon } from "@/components/ui/linkedin-icon";
import { getSetting } from "@/features/settings/queries";

export async function SiteFooter() {
  const [general, footer] = await Promise.all([getSetting("general"), getSetting("footer")]);
  const { brand, links } = general;
  const siteName = [brand.name, brand.accent].filter(Boolean).join(" ");

  const navLinks = footer.showAdminLink ? [...footer.links, { label: "Admin", href: "/admin/login" }] : footer.links;
  const socials = [
    links.github && { href: links.github, label: "GitHub", icon: GithubIcon },
    links.linkedin && { href: links.linkedin, label: "LinkedIn", icon: LinkedinIcon },
    links.email && { href: `mailto:${links.email}`, label: "Email", icon: Mail },
  ].filter((s) => !!s);

  return (
    <footer className="border-t border-ink-border bg-ink text-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <Image src="/brand/logo-200.png" alt={siteName} width={40} height={40} className="h-10 w-10 object-contain" />
          <div>
            <p className="font-semibold tracking-tight">
              {brand.name} {brand.accent && <span className="text-gold">{brand.accent}</span>}
            </p>
            {footer.tagline && (
              <p className="text-sm text-ink-foreground-muted mt-1 max-w-md font-mono">{footer.tagline}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-4">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-foreground-muted">
            {navLinks.map((link) =>
              link.href.startsWith("/") ? (
                <Link key={`${link.label}-${link.href}`} href={link.href} className="hover:text-white transition-colors">
                  {link.label}
                </Link>
              ) : (
                <a key={`${link.label}-${link.href}`} href={link.href} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  {link.label}
                </a>
              ),
            )}
          </div>
          {footer.showSocialIcons && socials.length > 0 && (
            <div className="flex items-center gap-1">
              {socials.map(({ href, label, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith("mailto:") ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                  className="p-2 rounded-full text-ink-foreground-muted hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-ink-border">
        <p className="mx-auto max-w-6xl px-4 sm:px-6 py-4 text-xs text-ink-foreground-muted font-mono">
          © {new Date().getFullYear()} {footer.copyright}
        </p>
      </div>
    </footer>
  );
}
