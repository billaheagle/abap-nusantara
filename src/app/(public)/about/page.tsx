import type { Metadata } from "next";
import Image from "next/image";
import { GithubIcon } from "@/components/ui/github-icon";
import { getSetting } from "@/features/settings/queries";
import { paragraphs } from "@/features/settings/schema";

export async function generateMetadata(): Promise<Metadata> {
  const about = await getSetting("about");
  return { title: "About", description: about.metaDescription || undefined };
}

export default async function AboutPage() {
  const [about, { brand, links }] = await Promise.all([getSetting("about"), getSetting("general")]);

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-14">
      <Image
        src="/brand/logo-200.png"
        alt={[brand.name, brand.accent].filter(Boolean).join(" ")}
        width={96}
        height={96}
        className="h-24 w-24 object-contain mb-6"
      />
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">{about.title}</h1>
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
          className="mt-8 inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:border-brand hover:text-brand transition-colors"
        >
          <GithubIcon className="h-4 w-4" /> GitHub
        </a>
      )}
    </div>
  );
}
