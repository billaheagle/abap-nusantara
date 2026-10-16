import type { Metadata } from "next";
import { LogoMark } from "@/components/brand/logo";
import { GithubIcon } from "@/components/ui/github-icon";
import { getSetting } from "@/features/settings/queries";
import { paragraphs } from "@/features/settings/schema";

export async function generateMetadata(): Promise<Metadata> {
  const about = await getSetting("about");
  return { title: "Tentang", description: about.metaDescription || undefined };
}

export default async function AboutPage() {
  const [about, { brand, links }] = await Promise.all([getSetting("about"), getSetting("general")]);

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-14">
      <LogoMark size={88} className="mb-6" title={[brand.name, brand.accent].filter(Boolean).join(" ")} />
      <h1 className="display text-[clamp(2rem,4.6vw,3.25rem)] leading-[1.05] font-bold mb-6">{about.title}</h1>
      <div className="prose-article">
        {paragraphs(about.body).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      {about.showGithubButton && links.github && (
        <a
          href={links.github}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center gap-2 rounded-xl border border-border bg-surface-elevated px-4 py-2.5 text-sm font-semibold hover:border-brand hover:text-brand-dark transition-colors"
        >
          <GithubIcon className="h-4 w-4" /> GitHub
        </a>
      )}
    </div>
  );
}
