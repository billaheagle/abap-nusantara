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

// Article body: a serif designed for long reading on screens.
const literata = Literata({
  variable: "--font-literata",
  subsets: ["latin"],
  axes: ["opsz"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
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
      locale: "en_US",
      images: [{ url: "/brand/logo-512.png", width: 512, height: 512, alt: siteName }],
    },
    twitter: {
      card: "summary_large_image",
      images: ["/brand/logo-512.png"],
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f5fa" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0e24" },
  ],
};

// Sets data-theme on <html> before first paint: the reader's saved choice,
// otherwise their system setting. Kept tiny and inline so there's no flash.
const themeScript = `(function(){try{var t=localStorage.getItem("an-theme");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
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
