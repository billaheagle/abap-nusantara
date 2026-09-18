import type { Metadata } from "next";
import Link from "next/link";
import type { ComponentType } from "react";
import { ArrowRight, Briefcase, Clock, Code2, FileText, Handshake, Layers, Link2, Mail, Network, Zap } from "lucide-react";
import { LinkedinIcon } from "@/components/ui/linkedin-icon";
import { WhatsappIcon } from "@/components/ui/whatsapp-icon";

export const metadata: Metadata = {
  title: "Hire Me",
  description:
    "Hire me directly for SAP ABAP development — 4 years of hands-on experience across ABAP, OData/CDS, RAP, SAP Integration Suite/CPI and Fiori/UI5. No agency, no middlemen, project-based pricing.",
};

const CONTACT = {
  email: "mutashimb7@gmail.com",
  whatsapp: "6281317714843",
  linkedin: "https://www.linkedin.com/in/mu-tashim-billah-733283187/",
};

const CONTACT_LINKS: { href: string; label: string; icon: ComponentType<{ className?: string }>; primary?: boolean }[] = [
  { href: `https://wa.me/${CONTACT.whatsapp}`, label: "WhatsApp", icon: WhatsappIcon, primary: true },
  { href: `mailto:${CONTACT.email}`, label: "Email", icon: Mail },
  { href: CONTACT.linkedin, label: "LinkedIn", icon: LinkedinIcon },
];

const WHY = [
  {
    icon: Handshake,
    title: "You talk to me, not an account manager",
    body: "No sales layer, no project manager relaying messages — every message and every line of code goes through me directly.",
  },
  {
    icon: Clock,
    title: "4 years of hands-on ABAP work",
    body: "Real project experience across custom development, enhancements, and integration work — not just tutorials.",
  },
  {
    icon: Zap,
    title: "Project-based, no long-term contract",
    body: "Engage for a single fix, a feature, or an ongoing arrangement — whichever fits, with no retainer required.",
  },
  {
    icon: FileText,
    title: "The work speaks for itself",
    body: "Everything I write and build is public on this site — read the articles, try the tools, and judge the quality yourself before you reach out.",
  },
];

const EXPERTISE = [
  { icon: Code2, title: "ABAP Development", body: "Classic and RAP-based custom development, enhancements, reports, and background jobs." },
  { icon: Link2, title: "OData & CDS", body: "CDS views, OData V2/V4 services, and RAP business objects exposed to Fiori." },
  { icon: Network, title: "Integration Suite / CPI", body: "Integration flows, Groovy scripting, adapters, and error handling for real integrations." },
  { icon: Layers, title: "Fiori/UI5 & BTP", body: "Fiori Elements apps, freestyle UI5 where needed, and general SAP BTP service usage." },
];

const PROCESS = [
  { title: "Tell me what you need", body: "A functional spec, a user story, or just a rough idea — whatever you have is fine to start with." },
  { title: "Get an estimate", body: "I reply with a mandays estimate and a rough timeline, usually within 1–2 business days. No cost, no obligation." },
  { title: "Agree scope, kick off", body: "A short written agreement covering scope and price — no long contract to sign." },
  { title: "Development, with updates", body: "You get progress updates along the way, not just a final delivery out of nowhere." },
  { title: "Test together, then invoice", body: "We go through UAT together before sign-off, then I invoice for the work delivered." },
];

function ContactButtons({ variant = "light" }: { variant?: "light" | "dark" }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {CONTACT_LINKS.map(({ href, label, icon: Icon, primary }) => (
        <a
          key={label}
          href={href}
          target={label === "LinkedIn" ? "_blank" : undefined}
          rel={label === "LinkedIn" ? "noopener noreferrer" : undefined}
          className={
            primary
              ? "inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white hover:bg-black transition-all hover:scale-[1.02] shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
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

export default function HireMePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-grid" aria-hidden="true" />
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 pt-20 sm:pt-28 pb-16 sm:pb-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated px-3.5 py-1.5 text-xs font-medium text-foreground-muted mb-8">
            <Briefcase className="h-3.5 w-3.5 text-brand" />
            <span className="font-mono">Available for freelance ABAP work</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter leading-[1.05] text-balance">
            Hire me for{" "}
            <span className="bg-gradient-to-r from-accent-red via-sunset to-gold bg-clip-text text-transparent">
              SAP ABAP development.
            </span>
          </h1>
          <p className="mt-6 max-w-xl mx-auto text-foreground-muted text-base sm:text-lg leading-relaxed">
            I&apos;m the person behind ABAP Nusantara — 4 years of hands-on ABAP experience, available directly
            for freelance work. No agency, no account manager, just me.
          </p>
          <div className="mt-9">
            <ContactButtons />
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-16">
        <p className="text-xs font-mono font-medium text-brand uppercase tracking-wider mb-1.5">[ Why work with me ]</p>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-8">Direct, transparent, no overhead</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {WHY.map(({ icon: Icon, title, body }) => (
            <div key={title} className="card-hover flex gap-4 rounded-xl border border-border bg-surface-elevated p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-tint text-brand">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-semibold leading-snug">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-foreground-muted">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Expertise */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-16">
          <p className="text-xs font-mono font-medium text-brand uppercase tracking-wider mb-1.5">[ Expertise ]</p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-8">What I can help with</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {EXPERTISE.map(({ icon: Icon, title, body }) => (
              <div key={title} className="card-hover flex flex-col rounded-xl border border-border bg-surface-elevated p-5">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-brand-tint text-brand">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-3 font-semibold leading-snug">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-foreground-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6 py-14 sm:py-16">
        <p className="text-xs font-mono font-medium text-brand uppercase tracking-wider mb-1.5">[ How it works ]</p>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-8">From first message to sign-off</h2>
        <ol className="space-y-6 border-l border-border pl-6">
          {PROCESS.map((step, i) => (
            <li key={step.title} className="relative">
              <span className="absolute -left-[calc(1.5rem+11px)] flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
                {i + 1}
              </span>
              <h3 className="font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-foreground-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Pricing */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-14 sm:py-16 text-center">
          <p className="text-xs font-mono font-medium text-brand uppercase tracking-wider mb-1.5">[ Pricing ]</p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">Every engagement is scoped individually</h2>
          <p className="text-foreground-muted leading-relaxed max-w-xl mx-auto">
            There&apos;s no fixed rate card — pricing depends on scope, timeline, and whether a day-rate or a
            fixed price fits better. Send over what you need and I&apos;ll come back with a straightforward
            estimate, no obligation to proceed.
          </p>
        </div>
      </section>

      {/* Proof */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6 py-14 sm:py-16 text-center">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-3">Prefer to see the work first?</h2>
        <p className="text-foreground-muted mb-6">
          Everything here is public — read what I write and try what I&apos;ve built before you reach out.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/articles"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:border-brand hover:text-brand transition-colors"
          >
            Read the articles <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/tools"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:border-brand hover:text-brand transition-colors"
          >
            Try the tools <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* Final CTA band */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="absolute inset-0 bg-grid-dark" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 py-16 sm:py-20 text-center">
          <p className="text-xs font-mono font-medium text-gold uppercase tracking-wider mb-3">[ Get in touch ]</p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">Got a scope in mind?</h2>
          <p className="text-ink-foreground-muted max-w-xl mx-auto mb-8 leading-relaxed">
            Reach out on WhatsApp for the fastest reply, or email/LinkedIn if you prefer. I usually respond
            within 1–2 business days.
          </p>
          <ContactButtons variant="dark" />
        </div>
      </section>
    </div>
  );
}
