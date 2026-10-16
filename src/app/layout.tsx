import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, JetBrains_Mono, Literata } from "next/font/google";
import "./globals.css";
import { getSetting } from "@/features/settings/queries";

// Interface and headings: a lively grotesque with width and optical-size axes.
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  axes: ["wdth", "opsz"],
});

// Article body: a serif designed for long reading on screens. Only article
// pages use it, so it isn't preloaded everywhere; the browser fetches it when
// text set in it appears.
const literata = Literata({
  variable: "--font-literata",
  subsets: ["latin"],
  axes: ["opsz"],
  preload: false,
});

// Code and tool output only — same reasoning as Literata.
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  preload: false,
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const { brand } = await getSetting("general");
  const siteName = [brand.name, brand.accent].filter(Boolean).join(" ");

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: brand.seoTitle,
      template: `%s · ${siteName}`,
    },
    description: brand.seoDescription,
    openGraph: {
      type: "website",
      siteName,
      locale: "id_ID",
      // Wide share card for every page that has no image of its own (articles
      // use their cover, series pages their series cover).
      images: [{ url: "/brand/og-default.png", width: 1200, height: 630, alt: siteName }],
    },
    twitter: {
      card: "summary_large_image",
      images: ["/brand/og-default.png"],
    },
    icons: {
      icon: [{ url: "/favicon.ico", sizes: "any" }, { url: "/brand/logo.svg", type: "image/svg+xml" }],
      apple: "/brand/apple-touch-icon.png",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#f4f5fa",
};

// Sets data-theme on <html> before first paint: dark only when the reader
// picked it with the header toggle, light otherwise. Kept tiny and inline so
// there's no flash.
const themeScript = `(function(){try{document.documentElement.setAttribute("data-theme",localStorage.getItem("an-theme")==="dark"?"dark":"light")}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${bricolage.variable} ${literata.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-background text-foreground">{children}</body>
    </html>
  );
}
