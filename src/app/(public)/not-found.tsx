import type { Metadata } from "next";
import { NotFoundContent } from "@/components/ui/not-found-content";

export const metadata: Metadata = { title: "Halaman tidak ditemukan", robots: { index: false } };

// notFound() from a public page (unknown article, series, tag…) keeps the site's header and footer.
export default function PublicNotFound() {
  return <NotFoundContent />;
}
