import { z } from "zod";
import { ICON_NAMES } from "@/features/settings/icons";
import { TOOL_REGISTRY } from "@/lib/tools/registry";

/**
 * Admin-editable site settings. Each section is stored as one SiteSetting row
 * (key → JSON). The defaults below are what the site shows until a section is
 * saved for the first time, so they mirror the original hardcoded copy.
 *
 * Shared by the server (validation on save, merge on read) and the client
 * settings forms (types + initial values) — keep it free of server imports.
 */

const text = (max: number) => z.string().trim().max(max);
const required = (max: number) => z.string().trim().min(1, "Required").max(max);

// Absolute http(s) link, site-relative path, mailto:, or empty.
const link = z
  .string()
  .trim()
  .max(500)
  .refine(
    (v) => v === "" || /^\/(?!\/)/.test(v) || /^https?:\/\/\S+$/i.test(v) || /^mailto:\S+$/i.test(v),
    "Enter a full http(s) URL, a site path (/…), or leave empty",
  );

// Uploaded image path (/uploads/…), absolute http(s) URL, or empty.
const image = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^\/(?!\/)/.test(v) || /^https?:\/\/\S+$/i.test(v), "Upload an image or enter a full http(s) URL");

const email = z.string().trim().max(255).refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email");
const phone = z.string().trim().max(20).regex(/^\d*$/, "Digits only, with country code (e.g. 6281234567890)");

const iconName = z.enum(ICON_NAMES);
const cardItem = z.object({ icon: iconName, title: required(120), body: text(500) });

// ---- General ---------------------------------------------------------------

export const generalSchema = z.object({
  brand: z.object({
    name: required(40),
    accent: text(40),
    seoTitle: required(160),
    seoDescription: text(300),
  }),
  links: z.object({
    github: link,
    linkedin: link,
    email,
    whatsapp: phone,
  }),
  hero: z.object({
    badge: text(80),
    titleLine1: text(80),
    titleLine2: text(80),
    titleHighlight: text(80),
    description: text(500),
    primaryCtaLabel: required(40),
    showGithubButton: z.boolean(),
  }),
  home: z.object({
    featuredTitle: required(80),
    latestTitle: required(80),
    aboutTitle: required(80),
    aboutBody: text(800),
    aboutLinkLabel: required(80),
    toolsTitle: required(80),
    toolsBody: text(400),
  }),
});
export type GeneralSettings = z.infer<typeof generalSchema>;

export const GENERAL_DEFAULTS: GeneralSettings = {
  brand: {
    name: "ABAP",
    accent: "Nusantara",
    seoTitle: "ABAP Nusantara — Learning SAP. Building Things. Sharing the Journey.",
    seoDescription:
      "A personal technical blog documenting the journey of learning SAP BTP, ABAP, Integration Suite/CPI, OData, CAP, and Fiori/UI5 — from an Indonesian developer's desk.",
  },
  links: {
    github: "https://github.com",
    linkedin: "https://www.linkedin.com/in/mu-tashim-billah-733283187/",
    email: "mutashimb7@gmail.com",
    whatsapp: "6281317714843",
  },
  hero: {
    badge: "SAP BTP · ABAP · Indonesia",
    titleLine1: "Learning SAP.",
    titleLine2: "Building things.",
    titleHighlight: "Sharing the journey.",
    description:
      "A personal technical blog documenting hands-on work with SAP BTP, ABAP, Integration Suite / CPI, OData, CAP, and Fiori/UI5 — written from an Indonesian developer's desk.",
    primaryCtaLabel: "Read the articles",
    showGithubButton: true,
  },
  home: {
    featuredTitle: "Start here",
    latestTitle: "Fresh from the notebook",
    aboutTitle: "About this journey",
    aboutBody:
      "This blog is a record of what I learn while working with SAP BTP and related technologies — tutorials, notes on real integrations, mistakes made along the way, and the tools I build to make the work easier.",
    aboutLinkLabel: "More about ABAP Nusantara",
    toolsTitle: "Developer tools",
    toolsBody: "RFC testers, OData/JSON/XML formatters, and CPI helpers are on the roadmap.",
  },
};

// ---- About -----------------------------------------------------------------

export const aboutSchema = z.object({
  title: required(120),
  metaDescription: text(300),
  // Paragraphs separated by a blank line.
  body: text(10000),
  showGithubButton: z.boolean(),
});
export type AboutSettings = z.infer<typeof aboutSchema>;

export const ABOUT_DEFAULTS: AboutSettings = {
  title: "About ABAP Nusantara",
  metaDescription: "About ABAP Nusantara — a personal SAP BTP and ABAP learning journey blog.",
  body: [
    "ABAP Nusantara is a personal technical blog documenting the journey of learning and working with SAP Business Technology Platform — ABAP, Integration Suite / CPI, OData, CAP, Fiori/UI5, and the wider SAP developer ecosystem.",
    "The name combines ABAP with “Nusantara,” the traditional term for the Indonesian archipelago — this is SAP development notes written from an Indonesian developer's desk, shared in the hope they help someone else further along (or just starting) the same path.",
    "Articles here are grouped into series when they form a multi-part tutorial, and tagged and categorized so related topics are easy to find. Over time this site will also grow to include small developer tools — RFC testers, formatters, and CPI helpers — alongside the writing.",
  ].join("\n\n"),
  showGithubButton: true,
};

// ---- Header ----------------------------------------------------------------

export const headerSchema = z.object({
  links: z.array(z.object({ label: required(30), href: link.refine((v) => v !== "", "Required") })).max(8),
  showSearch: z.boolean(),
  showGithub: z.boolean(),
});
export type HeaderSettings = z.infer<typeof headerSchema>;

export const HEADER_DEFAULTS: HeaderSettings = {
  links: [
    { label: "Articles", href: "/articles" },
    { label: "Series", href: "/series" },
    { label: "Categories", href: "/categories" },
    { label: "Tools", href: "/tools" },
    { label: "About", href: "/about" },
    { label: "Hire Me", href: "/hire-me" },
  ],
  showSearch: true,
  showGithub: true,
};

// ---- Footer ----------------------------------------------------------------

export const footerSchema = z.object({
  tagline: text(200),
  links: z.array(z.object({ label: required(40), href: link.refine((v) => v !== "", "Required") })).max(12),
  showAdminLink: z.boolean(),
  showSocialIcons: z.boolean(),
  copyright: text(200),
});
export type FooterSettings = z.infer<typeof footerSchema>;

export const FOOTER_DEFAULTS: FooterSettings = {
  tagline: "Learning SAP. Building things. Sharing the journey.",
  links: [
    { label: "Articles", href: "/articles" },
    { label: "Series", href: "/series" },
    { label: "About", href: "/about" },
    { label: "Hire Me", href: "/hire-me" },
  ],
  showAdminLink: true,
  showSocialIcons: false,
  copyright: "ABAP Nusantara. Built with Next.js.",
};

// ---- Hire me ---------------------------------------------------------------

const experienceItem = z.object({
  role: required(120),
  company: required(120),
  location: text(120),
  period: text(80),
  summary: text(1000),
  // One highlight per line.
  highlights: text(3000),
  // Comma-separated.
  tech: text(400),
});

const credentialItem = z.object({
  title: required(160),
  issuer: text(160),
  year: text(40),
});

const projectItem = z.object({
  title: required(160),
  // One highlight per line.
  highlights: text(3000),
  // Comma-separated.
  tech: text(400),
});

const skillGroup = z.object({
  title: required(80),
  // One skill per line.
  items: text(2000),
});

const testimonialItem = z.object({
  quote: required(1000),
  name: required(120),
  // Role and/or company, e.g. "IT Manager, PT Example".
  role: text(160),
});

// Every Hire Me section can be switched off and carries its own small
// "[ eyebrow ]" label (brackets are added when rendering).
const sectionMeta = { show: z.boolean(), eyebrow: text(60) };

/** Placeholder admins can write in any Hire Me text; replaced with the computed years of experience. */
export const YEARS_TOKEN = "{years}";

export const hireMeSchema = z.object({
  metaDescription: text(300),
  profile: z.object({
    name: text(120),
    role: text(120),
    photo: image,
    careerStartYear: z.number().int().min(1970, "Too early").max(2100).nullable(),
  }),
  hero: z.object({
    badge: text(80),
    titlePrefix: text(80),
    titleHighlight: text(80),
    intro: text(800),
    resumeUrl: link,
    resumeLabel: required(40),
  }),
  why: z.object({ ...sectionMeta, title: required(120), items: z.array(cardItem).max(8) }),
  expertise: z.object({ ...sectionMeta, title: required(120), items: z.array(cardItem).max(8) }),
  experience: z.object({ ...sectionMeta, title: required(120), items: z.array(experienceItem).max(20) }),
  projects: z.object({ ...sectionMeta, title: required(120), items: z.array(projectItem).max(20) }),
  skills: z.object({ ...sectionMeta, title: required(120), groups: z.array(skillGroup).max(12) }),
  testimonials: z.object({ ...sectionMeta, title: required(120), items: z.array(testimonialItem).max(12) }),
  credentials: z.object({ ...sectionMeta, title: required(120), items: z.array(credentialItem).max(20) }),
  process: z.object({
    ...sectionMeta,
    title: required(120),
    steps: z.array(z.object({ title: required(120), body: text(500) })).max(10),
  }),
  // Shown as a note under the process steps rather than a section of its own.
  pricing: z.object({ show: z.boolean(), title: required(120), body: text(1000) }),
  // "See the work first" links, shown inside the closing call-to-action band.
  proof: z.object({ show: z.boolean(), title: required(120), body: text(500), articlesLabel: required(40), toolsLabel: required(40) }),
  cta: z.object({ eyebrow: text(60), title: required(120), body: text(800) }),
});
export type HireMeSettings = z.infer<typeof hireMeSchema>;

export const HIRE_ME_DEFAULTS: HireMeSettings = {
  metaDescription:
    "Hire me directly for SAP ABAP development — {years} years of hands-on experience across ABAP, OData/CDS, RAP, SAP Integration Suite/CPI and Fiori/UI5. No agency, no middlemen, project-based pricing.",
  profile: { name: "", role: "", photo: "", careerStartYear: 2022 },
  hero: {
    badge: "Available for freelance ABAP work",
    titlePrefix: "Hire me for",
    titleHighlight: "SAP ABAP development.",
    intro:
      "I'm the person behind ABAP Nusantara — {years} years of hands-on ABAP experience, available directly for freelance work. No agency, no account manager, just me.",
    resumeUrl: "",
    resumeLabel: "Download CV",
  },
  why: {
    show: true,
    eyebrow: "Why work with me",
    title: "Direct, transparent, no overhead",
    items: [
      {
        icon: "Handshake",
        title: "You talk to me, not an account manager",
        body: "No sales layer, no project manager relaying messages — every message and every line of code goes through me directly.",
      },
      {
        icon: "Clock",
        title: "{years} years of hands-on ABAP work",
        body: "Real project experience across custom development, enhancements, and integration work — not just tutorials.",
      },
      {
        icon: "Zap",
        title: "Project-based, no long-term contract",
        body: "Engage for a single fix, a feature, or an ongoing arrangement — whichever fits, with no retainer required.",
      },
      {
        icon: "FileText",
        title: "The work speaks for itself",
        body: "Everything I write and build is public on this site — read the articles, try the tools, and judge the quality yourself before you reach out.",
      },
    ],
  },
  expertise: {
    show: true,
    eyebrow: "Expertise",
    title: "What I can help with",
    items: [
      { icon: "Code2", title: "ABAP Development", body: "Classic and RAP-based custom development, enhancements, reports, and background jobs." },
      { icon: "Link2", title: "OData & CDS", body: "CDS views, OData V2/V4 services, and RAP business objects exposed to Fiori." },
      { icon: "Network", title: "Integration Suite / CPI", body: "Integration flows, Groovy scripting, adapters, and error handling for real integrations." },
      { icon: "Layers", title: "Fiori/UI5 & BTP", body: "Fiori Elements apps, freestyle UI5 where needed, and general SAP BTP service usage." },
    ],
  },
  experience: { show: true, eyebrow: "Experience", title: "Where I've worked", items: [] },
  projects: { show: true, eyebrow: "Projects", title: "Selected projects", items: [] },
  skills: { show: true, eyebrow: "Skills", title: "Skills & tools", groups: [] },
  testimonials: { show: true, eyebrow: "Testimonials", title: "What clients say", items: [] },
  credentials: { show: true, eyebrow: "Credentials", title: "Education & certifications", items: [] },
  process: {
    show: true,
    eyebrow: "How it works",
    title: "From first message to sign-off",
    steps: [
      { title: "Tell me what you need", body: "A functional spec, a user story, or just a rough idea — whatever you have is fine to start with." },
      { title: "Get an estimate", body: "I reply with a mandays estimate and a rough timeline, usually within 1–2 business days. No cost, no obligation." },
      { title: "Agree scope, kick off", body: "A short written agreement covering scope and price — no long contract to sign." },
      { title: "Development, with updates", body: "You get progress updates along the way, not just a final delivery out of nowhere." },
      { title: "Test together, then invoice", body: "We go through UAT together before sign-off, then I invoice for the work delivered." },
    ],
  },
  pricing: {
    show: true,
    title: "Every engagement is scoped individually",
    body: "There's no fixed rate card — pricing depends on scope, timeline, and whether a day-rate or a fixed price fits better. Send over what you need and I'll come back with a straightforward estimate, no obligation to proceed.",
  },
  proof: {
    show: true,
    title: "Prefer to see the work first?",
    body: "Everything here is public — read what I write and try what I've built before you reach out.",
    articlesLabel: "Read the articles",
    toolsLabel: "Try the tools",
  },
  cta: {
    eyebrow: "Get in touch",
    title: "Got a scope in mind?",
    body: "Reach out on WhatsApp for the fastest reply, or email/LinkedIn if you prefer. I usually respond within 1–2 business days.",
  },
};

// ---- Tools -----------------------------------------------------------------

const TOOL_SLUGS = new Set(TOOL_REGISTRY.map((t) => t.slug));

export const toolsSchema = z.object({
  // Slugs of tools taken offline from the admin (e.g. while a bug is fixed).
  // Unknown slugs — a tool since removed from the registry — are dropped.
  hidden: z
    .array(z.string())
    .max(TOOL_REGISTRY.length)
    .transform((slugs) => [...new Set(slugs.filter((s) => TOOL_SLUGS.has(s)))]),
});
export type ToolsSettings = z.infer<typeof toolsSchema>;

export const TOOLS_DEFAULTS: ToolsSettings = { hidden: [] };

// ---- Registry --------------------------------------------------------------

export const SETTINGS = {
  general: { schema: generalSchema, defaults: GENERAL_DEFAULTS },
  about: { schema: aboutSchema, defaults: ABOUT_DEFAULTS },
  header: { schema: headerSchema, defaults: HEADER_DEFAULTS },
  footer: { schema: footerSchema, defaults: FOOTER_DEFAULTS },
  hireMe: { schema: hireMeSchema, defaults: HIRE_ME_DEFAULTS },
  tools: { schema: toolsSchema, defaults: TOOLS_DEFAULTS },
} as const;

export type SettingKey = keyof typeof SETTINGS;
export type SettingValue<K extends SettingKey> = z.infer<(typeof SETTINGS)[K]["schema"]>;

/** Whole years since `startYear`, never below 1. */
export function yearsSince(startYear: number, now = new Date()): number {
  return Math.max(1, now.getFullYear() - startYear);
}

/** Replace {years} in every string of the Hire Me settings (no-op when no start year is set). */
export function fillYears(settings: HireMeSettings, now = new Date()): HireMeSettings {
  const start = settings.profile.careerStartYear;
  if (start === null) return settings;
  const years = String(yearsSince(start, now));
  const walk = (v: unknown): unknown =>
    typeof v === "string"
      ? v.replaceAll(YEARS_TOKEN, years)
      : Array.isArray(v)
        ? v.map(walk)
        : v && typeof v === "object"
          ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]))
          : v;
  return walk(settings) as HireMeSettings;
}

/** Split a textarea into non-empty trimmed lines. */
export function lines(value: string): string[] {
  return value.split("\n").map((l) => l.trim()).filter(Boolean);
}

/** Split a textarea into paragraphs on blank lines. */
export function paragraphs(value: string): string[] {
  return value.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}
