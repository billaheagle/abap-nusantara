import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";

/**
 * The 404 body. `fullScreen` is for unknown URLs, which render outside the
 * public layout and so carry their own way home; inside the layout (an
 * article or series that doesn't exist) it sits between header and footer.
 */
export function NotFoundContent({ fullScreen = false }: { fullScreen?: boolean }) {
  return (
    <div className={`relative grid place-items-center overflow-hidden px-4 ${fullScreen ? "min-h-screen py-16" : "py-16 sm:py-24"}`}>
      <div className="hero-glow pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
      <div className="max-w-md text-center">
        {fullScreen && (
          <Link href="/" aria-label="ABAP Nusantara, beranda" className="mb-8 inline-block">
            <LogoMark size={56} />
          </Link>
        )}
        <p className="display text-[clamp(5rem,22vw,8.5rem)] leading-[0.85] font-extrabold tracking-[-0.04em]">
          404<span className="text-kunyit">.</span>
        </p>
        <h1 className="display mt-5 text-[1.75rem] font-bold">Halaman tidak ditemukan</h1>
        <p className="mt-3 text-foreground-muted">Halaman yang kamu cari tidak ada atau sudah dipindahkan.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-2.5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-[14px] bg-brand px-5 py-3 font-semibold text-white transition-transform hover:-translate-y-px"
          >
            Ke beranda <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" />
          </Link>
          <Link
            href="/articles"
            className="inline-flex items-center rounded-[14px] border border-border bg-surface-elevated px-5 py-3 font-semibold shadow-[var(--shadow-1)] transition-colors hover:border-border-strong"
          >
            Lihat artikel
          </Link>
        </div>
      </div>
    </div>
  );
}
