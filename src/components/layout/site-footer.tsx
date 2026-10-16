import Link from "next/link";
import { Mail } from "lucide-react";
import { GithubIcon } from "@/components/ui/github-icon";
import { LinkedinIcon } from "@/components/ui/linkedin-icon";
import { LogoMark, Wordmark } from "@/components/brand/logo";
import { getSetting } from "@/features/settings/queries";

export async function SiteFooter() {
  const [general, footer] = await Promise.all([getSetting("general"), getSetting("footer")]);
  const { brand, links } = general;

  const navLinks = footer.showAdminLink ? [...footer.links, { label: "Admin", href: "/admin/login" }] : footer.links;
  const socials = [
    links.github && { href: links.github, label: "GitHub", icon: GithubIcon },
    links.linkedin && { href: links.linkedin, label: "LinkedIn", icon: LinkedinIcon },
    links.email && { href: `mailto:${links.email}`, label: "Email", icon: Mail },
  ].filter((s) => !!s);
  // The closing word of the name, set huge as the footer's sign-off.
  const signOff = (brand.accent || brand.name).toLowerCase();

  return (
    <footer className="mt-16 overflow-hidden rounded-t-[28px] bg-ink text-ink-foreground-muted sm:rounded-t-[36px]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-12 pb-8 sm:px-6 sm:pt-14">
        <div className="flex flex-col justify-between gap-8 sm:flex-row">
          <div>
            <Link href="/" className="inline-flex items-center gap-3 text-ink-foreground">
              <LogoMark size={40} />
              <Wordmark name={brand.name} accent={brand.accent} className="text-[1.375rem]" />
            </Link>
            {footer.tagline && <p className="mt-3 max-w-sm leading-relaxed">{footer.tagline}</p>}
            {footer.showSocialIcons && socials.length > 0 && (
              <div className="mt-5 flex items-center gap-1.5">
                {socials.map(({ href, label, icon: Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target={href.startsWith("mailto:") ? undefined : "_blank"}
                    rel="noopener noreferrer"
                    aria-label={label}
                    title={label}
                    className="grid h-10 w-10 place-items-center rounded-xl bg-ink-elevated text-ink-foreground-muted transition-colors hover:bg-ink-border hover:text-ink-foreground"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-10 gap-y-2.5 self-start text-[0.9375rem] sm:grid-cols-3">
            {navLinks.map((link) =>
              link.href.startsWith("/") ? (
                <Link key={`${link.label}-${link.href}`} href={link.href} className="transition-colors hover:text-ink-foreground">
                  {link.label}
                </Link>
              ) : (
                <a
                  key={`${link.label}-${link.href}`}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-ink-foreground"
                >
                  {link.label}
                </a>
              ),
            )}
          </nav>
        </div>

        <p
          aria-hidden="true"
          className="-mb-[0.14em] select-none whitespace-nowrap text-[clamp(3.5rem,15vw,12rem)] leading-[0.8] font-extrabold tracking-[-0.055em] text-ink-elevated [font-variation-settings:'wdth'_80]"
        >
          <span className="before:content-[attr(data-word)] after:text-kunyit after:content-['.']" data-word={signOff} />
        </p>

        <div className="flex flex-wrap justify-between gap-3 border-t border-ink-border pt-5 text-[0.8125rem]">
          <span>
            © {new Date().getFullYear()} {footer.copyright}
          </span>
          <span>Dibuat di Indonesia</span>
        </div>
      </div>
    </footer>
  );
}
