import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import type { ComponentType, ReactNode } from "react";
import { ArrowRight, Award, Briefcase, Download, Mail, MapPin, Quote, Tag } from "lucide-react";
import { LinkedinIcon } from "@/components/ui/linkedin-icon";
import { WhatsappIcon } from "@/components/ui/whatsapp-icon";
import { getSetting } from "@/features/settings/queries";
import { fillYears, lines, type GeneralSettings, type HireMeSettings } from "@/features/settings/schema";
import { SETTINGS_ICONS } from "@/features/settings/icons";

// Re-render daily so {years} rolls over with the calendar year even without a save.
export const revalidate = 86400;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const hireMe = fillYears(await getSetting("hireMe"));
  return { title: "Hire Me", description: hireMe.metaDescription || undefined };
}

type ContactLink = { href: string; label: string; icon: ComponentType<{ className?: string }>; primary?: boolean; external?: boolean };

function contactLinks(links: GeneralSettings["links"]): ContactLink[] {
  const out: ContactLink[] = [];
  if (links.whatsapp) out.push({ href: `https://wa.me/${links.whatsapp}`, label: "WhatsApp", icon: WhatsappIcon });
  if (links.email) out.push({ href: `mailto:${links.email}`, label: "Email", icon: Mail });
  if (links.linkedin) out.push({ href: links.linkedin, label: "LinkedIn", icon: LinkedinIcon, external: true });
  if (out[0]) out[0].primary = true;
  return out;
}

function ContactButtons({ links, variant = "light" }: { links: ContactLink[]; variant?: "light" | "dark" }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {links.map(({ href, label, icon: Icon, primary, external }) => (
        <a
          key={label}
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
          className={
            primary
              ? variant === "dark"
                ? // On the ink CTA band a solid-ink button would vanish into the background — use gold instead.
                  "inline-flex items-center gap-2 rounded-full border border-gold bg-gold px-6 py-3 text-sm font-semibold text-ink hover:bg-[#f0b83a] transition-all hover:scale-[1.02]"
                : "inline-flex items-center gap-2 rounded-full border border-ink bg-ink px-6 py-3 text-sm font-semibold text-white hover:bg-black transition-all hover:scale-[1.02] shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
              : variant === "dark"
                ? "inline-flex items-center gap-2 rounded-full border border-ink-border px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                : "inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold hover:border-border-strong hover:bg-surface transition-colors"
          }
        >
          <Icon className="h-4 w-4" /> {label}
        </a>
      ))}
    </div>
  );
}

/**
 * One content section. Sections can be switched off from the admin, so the
 * plain / tinted background alternation is assigned at render time from the
 * sections that are actually visible (never two tinted bands in a row).
 */
function PageSection({
  tinted,
  eyebrow,
  title,
  narrow,
  children,
}: {
  tinted: boolean;
  eyebrow: string;
  title: string;
  narrow?: boolean;
  children: ReactNode;
}) {
  const inner = (
    <div className={`mx-auto ${narrow ? "max-w-3xl" : "max-w-6xl"} px-4 sm:px-6 py-14 sm:py-16`}>
      {eyebrow && <p className="text-xs font-mono font-medium text-brand uppercase tracking-wider mb-1.5">[ {eyebrow} ]</p>}
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-8">{title}</h2>
      {children}
    </div>
  );
  return tinted ? <section className="border-t border-border bg-surface">{inner}</section> : <section>{inner}</section>;
}

function Bullets({ items, muted }: { items: string[]; muted?: boolean }) {
  return (
    <ul className={`space-y-1.5 text-sm leading-relaxed ${muted ? "text-foreground-muted" : ""}`}>
      {items.map((line, j) => (
        <li key={j} className="flex gap-2">
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand" aria-hidden="true" />
          <span>{line}</span>
        </li>
      ))}
    </ul>
  );
}

function TechChips({ value }: { value: string }) {
  const tech = value.split(",").map((t) => t.trim()).filter(Boolean);
  if (tech.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tech.map((t) => (
        <span key={t} className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-mono text-foreground-muted">
          {t}
        </span>
      ))}
    </div>
  );
}

function CardGrid({ items, wide }: { items: HireMeSettings["why"]["items"]; wide?: boolean }) {
  return (
    <div className={`grid gap-4 sm:grid-cols-2 ${wide ? "lg:grid-cols-4" : "gap-6"}`}>
      {items.map(({ icon, title, body }, i) => {
        const Icon = SETTINGS_ICONS[icon];
        return wide ? (
          <div key={i} className="card-hover flex flex-col rounded-xl border border-border bg-surface-elevated p-5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-brand-tint text-brand">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="mt-3 font-semibold leading-snug">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground-muted">{body}</p>
          </div>
        ) : (
          <div key={i} className="card-hover flex gap-4 rounded-xl border border-border bg-surface-elevated p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-tint text-brand">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-semibold leading-snug">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground-muted">{body}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** schema.org Person, so search engines can tie the page to a name, role and profiles. */
function personJsonLd(h: HireMeSettings, general: GeneralSettings) {
  const { profile } = h;
  if (!profile.name) return null;
  const absolute = (url: string) => (url.startsWith("/") ? new URL(url, siteUrl).toString() : url);
  const skills = h.skills.groups.flatMap((g) => lines(g.items)).slice(0, 30);
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: profile.role || undefined,
    description: h.metaDescription || undefined,
    image: profile.photo ? absolute(profile.photo) : undefined,
    url: new URL("/hire-me", siteUrl).toString(),
    email: general.links.email ? `mailto:${general.links.email}` : undefined,
    sameAs: [general.links.linkedin, general.links.github].filter(Boolean),
    knowsAbout: skills.length > 0 ? skills : undefined,
    worksFor: h.experience.items[0] ? { "@type": "Organization", name: h.experience.items[0].company } : undefined,
  };
}

export default async function HireMePage() {
  const [raw, general] = await Promise.all([getSetting("hireMe"), getSetting("general")]);
  const h = fillYears(raw);
  const contacts = contactLinks(general.links);
  const { profile } = h;
  const jsonLd = personJsonLd(h, general);

  // A same-origin PDF can be offered as a download with a readable filename.
  const resumeIsLocal = h.hero.resumeUrl.startsWith("/");
  const resumeFilename = `${(profile.name || "CV").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-")}-CV.pdf`;

  // Visible sections, in page order. Background alternation is assigned below.
  const sections: { key: string; node: (tinted: boolean) => ReactNode }[] = [];

  if (h.why.show && h.why.items.length > 0) {
    sections.push({
      key: "why",
      node: (tinted) => (
        <PageSection tinted={tinted} eyebrow={h.why.eyebrow} title={h.why.title}>
          <CardGrid items={h.why.items} />
        </PageSection>
      ),
    });
  }

  if (h.expertise.show && h.expertise.items.length > 0) {
    sections.push({
      key: "expertise",
      node: (tinted) => (
        <PageSection tinted={tinted} eyebrow={h.expertise.eyebrow} title={h.expertise.title}>
          <CardGrid items={h.expertise.items} wide />
        </PageSection>
      ),
    });
  }

  if (h.experience.show && h.experience.items.length > 0) {
    sections.push({
      key: "experience",
      node: (tinted) => (
        <PageSection tinted={tinted} eyebrow={h.experience.eyebrow} title={h.experience.title} narrow>
          <ol className="space-y-10 border-l border-border pl-6">
            {h.experience.items.map((e, i) => {
              const highlights = lines(e.highlights);
              return (
                <li key={i} className="relative">
                  <span className="absolute -left-[calc(1.5rem+6px)] top-1.5 h-3 w-3 rounded-full border-2 border-brand bg-background" aria-hidden="true" />
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h3 className="font-semibold leading-snug">
                      {e.role} <span className="text-foreground-muted font-normal">· {e.company}</span>
                    </h3>
                    {e.period && <p className="text-xs font-mono text-foreground-muted whitespace-nowrap">{e.period}</p>}
                  </div>
                  {e.location && (
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-foreground-muted">
                      <MapPin className="h-3 w-3" /> {e.location}
                    </p>
                  )}
                  {e.summary && <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{e.summary}</p>}
                  {highlights.length > 0 && (
                    <div className="mt-3">
                      <Bullets items={highlights} />
                    </div>
                  )}
                  <div className="mt-3">
                    <TechChips value={e.tech} />
                  </div>
                </li>
              );
            })}
          </ol>
        </PageSection>
      ),
    });
  }

  if (h.projects.show && h.projects.items.length > 0) {
    sections.push({
      key: "projects",
      node: (tinted) => (
        <PageSection tinted={tinted} eyebrow={h.projects.eyebrow} title={h.projects.title}>
          <div className="grid gap-4 sm:grid-cols-2">
            {h.projects.items.map((p, i) => {
              const highlights = lines(p.highlights);
              return (
                <div key={i} className="card-hover flex flex-col rounded-xl border border-border bg-surface-elevated p-5">
                  <h3 className="font-semibold leading-snug">{p.title}</h3>
                  {highlights.length > 0 && (
                    <div className="mt-3">
                      <Bullets items={highlights} muted />
                    </div>
                  )}
                  <div className="mt-auto pt-4">
                    <TechChips value={p.tech} />
                  </div>
                </div>
              );
            })}
          </div>
        </PageSection>
      ),
    });
  }

  if (h.skills.show && h.skills.groups.length > 0) {
    sections.push({
      key: "skills",
      node: (tinted) => (
        <PageSection tinted={tinted} eyebrow={h.skills.eyebrow} title={h.skills.title}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {h.skills.groups.map((g, i) => (
              <div key={i} className="rounded-xl border border-border bg-surface-elevated p-5">
                <h3 className="text-sm font-semibold">{g.title}</h3>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {lines(g.items).map((skill) => (
                    <span key={skill} className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </PageSection>
      ),
    });
  }

  if (h.testimonials.show && h.testimonials.items.length > 0) {
    sections.push({
      key: "testimonials",
      node: (tinted) => (
        <PageSection tinted={tinted} eyebrow={h.testimonials.eyebrow} title={h.testimonials.title}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {h.testimonials.items.map((t, i) => (
              <figure key={i} className="flex flex-col rounded-xl border border-border bg-surface-elevated p-5">
                <Quote className="h-5 w-5 text-brand/40" aria-hidden="true" />
                <blockquote className="mt-3 flex-1 text-sm leading-relaxed">{t.quote}</blockquote>
                <figcaption className="mt-4 border-t border-border pt-3">
                  <p className="text-sm font-semibold">{t.name}</p>
                  {t.role && <p className="text-xs text-foreground-muted">{t.role}</p>}
                </figcaption>
              </figure>
            ))}
          </div>
        </PageSection>
      ),
    });
  }

  if (h.credentials.show && h.credentials.items.length > 0) {
    sections.push({
      key: "credentials",
      node: (tinted) => (
        <PageSection tinted={tinted} eyebrow={h.credentials.eyebrow} title={h.credentials.title} narrow>
          <ul className="grid gap-3 sm:grid-cols-2">
            {h.credentials.items.map((c, i) => (
              <li key={i} className="flex gap-3 rounded-xl border border-border bg-surface-elevated p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-tint text-brand">
                  <Award className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold leading-snug">{c.title}</p>
                  {(c.issuer || c.year) && <p className="mt-0.5 text-sm text-foreground-muted">{[c.issuer, c.year].filter(Boolean).join(" · ")}</p>}
                </div>
              </li>
            ))}
          </ul>
        </PageSection>
      ),
    });
  }

  const showPricing = h.pricing.show && Boolean(h.pricing.title);
  if ((h.process.show && h.process.steps.length > 0) || showPricing) {
    sections.push({
      key: "process",
      node: (tinted) => (
        <PageSection tinted={tinted} eyebrow={h.process.eyebrow} title={h.process.title} narrow>
          {h.process.show && h.process.steps.length > 0 && (
            <ol className="space-y-6 border-l border-border pl-6">
              {h.process.steps.map((step, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[calc(1.5rem+11px)] flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
                    {i + 1}
                  </span>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-foreground-muted">{step.body}</p>
                </li>
              ))}
            </ol>
          )}
          {/* Pricing: a note under the steps rather than a band of its own. */}
          {showPricing && (
            <div className="mt-10 flex gap-4 rounded-xl border border-border bg-surface-elevated p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gold-tint text-gold-strong">
                <Tag className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-semibold leading-snug">{h.pricing.title}</h3>
                {h.pricing.body && <p className="mt-1.5 text-sm leading-relaxed text-foreground-muted">{h.pricing.body}</p>}
              </div>
            </div>
          )}
        </PageSection>
      ),
    });
  }

  return (
    <div>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-grid" aria-hidden="true" />
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 pt-20 sm:pt-28 pb-16 sm:pb-24 text-center">
          {(profile.photo || profile.name) && (
            <div className="mb-8 flex flex-col items-center">
              {profile.photo && (
                <Image
                  src={profile.photo}
                  alt={profile.name || "Profile photo"}
                  width={112}
                  height={112}
                  priority
                  unoptimized={!profile.photo.startsWith("/")}
                  className="h-24 w-24 sm:h-28 sm:w-28 rounded-full object-cover ring-4 ring-background shadow-[0_8px_30px_-10px_rgba(9,28,56,0.45)]"
                />
              )}
              {profile.name && <p className={`${profile.photo ? "mt-4" : ""} text-lg font-semibold tracking-tight`}>{profile.name}</p>}
              {profile.role && <p className="text-sm text-foreground-muted">{profile.role}</p>}
            </div>
          )}
          {h.hero.badge && (
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated px-3.5 py-1.5 text-xs font-medium text-foreground-muted mb-8">
              <Briefcase className="h-3.5 w-3.5 text-brand" />
              <span className="font-mono">{h.hero.badge}</span>
            </div>
          )}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter leading-[1.05] text-balance">
            {h.hero.titlePrefix}{" "}
            <span className="bg-gradient-to-r from-accent-red via-sunset to-gold bg-clip-text text-transparent">{h.hero.titleHighlight}</span>
          </h1>
          {h.hero.intro && <p className="mt-6 max-w-xl mx-auto text-foreground-muted text-base sm:text-lg leading-relaxed">{h.hero.intro}</p>}
          <div className="mt-9">
            <ContactButtons links={contacts} />
          </div>
          {h.hero.resumeUrl && (
            <a
              href={h.hero.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={resumeIsLocal ? resumeFilename : undefined}
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground-muted hover:text-brand transition-colors"
            >
              <Download className="h-4 w-4" /> {h.hero.resumeLabel}
            </a>
          )}
        </div>
      </section>

      {sections.map(({ key, node }, i) => (
        <div key={key}>{node(i % 2 === 1)}</div>
      ))}

      {/* Closing CTA band, with the "see the work first" links folded in */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="absolute inset-0 bg-grid-dark" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 py-16 sm:py-20 text-center">
          {h.cta.eyebrow && <p className="text-xs font-mono font-medium text-gold uppercase tracking-wider mb-3">[ {h.cta.eyebrow} ]</p>}
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">{h.cta.title}</h2>
          {h.cta.body && <p className="text-ink-foreground-muted max-w-xl mx-auto mb-8 leading-relaxed">{h.cta.body}</p>}
          <ContactButtons links={contacts} variant="dark" />

          {h.proof.show && (
            <div className="mt-12 border-t border-ink-border pt-8">
              <p className="font-semibold">{h.proof.title}</p>
              {h.proof.body && <p className="mt-1 text-sm text-ink-foreground-muted">{h.proof.body}</p>}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-semibold">
                <Link href="/articles" className="inline-flex items-center gap-1.5 text-gold hover:text-white transition-colors">
                  {h.proof.articlesLabel} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link href="/tools" className="inline-flex items-center gap-1.5 text-gold hover:text-white transition-colors">
                  {h.proof.toolsLabel} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
