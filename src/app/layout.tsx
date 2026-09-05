import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ABAP Nusantara — Learning SAP. Building Things. Sharing the Journey.",
    template: "%s · ABAP Nusantara",
  },
  description:
    "A personal technical blog documenting the journey of learning SAP BTP, ABAP, Integration Suite/CPI, OData, CAP, and Fiori/UI5 — from an Indonesian developer's desk.",
  openGraph: {
    type: "website",
    siteName: "ABAP Nusantara",
    locale: "en_US",
    images: [{ url: "/brand/logo-512.png", width: 512, height: 512, alt: "ABAP Nusantara" }],
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-screen bg-background text-foreground">{children}</body>
    </html>
  );
}
