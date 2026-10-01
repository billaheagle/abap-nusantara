import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getSetting } from "@/features/settings/queries";

const geistSans = Geist({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
      icon: "/favicon.ico",
      apple: "/brand/apple-touch-icon.png",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-screen bg-background text-foreground">{children}</body>
    </html>
  );
}
