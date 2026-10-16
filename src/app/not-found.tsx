import type { Metadata } from "next";
import { NotFoundContent } from "@/components/ui/not-found-content";

export const metadata: Metadata = { title: "Halaman tidak ditemukan", robots: { index: false } };

// Unknown URLs render here, outside the (public) layout.
export default function NotFound() {
  return (
    <main>
      <NotFoundContent fullScreen />
    </main>
  );
}
