import type { Metadata } from "next";
import Image from "next/image";
import { GithubIcon } from "@/components/ui/github-icon";

export const metadata: Metadata = {
  title: "About",
  description: "About ABAP Nusantara — a personal SAP BTP and ABAP learning journey blog.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-14">
      <Image
        src="/brand/logo-200.png"
        alt="ABAP Nusantara"
        width={96}
        height={96}
        className="h-24 w-24 object-contain mb-6"
      />
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">About ABAP Nusantara</h1>
      <div className="prose-article">
        <p>
          ABAP Nusantara is a personal technical blog documenting the journey of learning and working with
          SAP Business Technology Platform — ABAP, Integration Suite / CPI, OData, CAP, Fiori/UI5, and the
          wider SAP developer ecosystem.
        </p>
        <p>
          The name combines ABAP with &ldquo;Nusantara,&rdquo; the traditional term for the Indonesian
          archipelago — this is SAP development notes written from an Indonesian developer&apos;s desk,
          shared in the hope they help someone else further along (or just starting) the same path.
        </p>
        <p>
          Articles here are grouped into series when they form a multi-part tutorial, and tagged and
          categorized so related topics are easy to find. Over time this site will also grow to include
          small developer tools — RFC testers, formatters, and CPI helpers — alongside the writing.
        </p>
      </div>
      <a
        href="https://github.com"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:border-brand hover:text-brand transition-colors"
      >
        <GithubIcon className="h-4 w-4" /> GitHub
      </a>
    </div>
  );
}
