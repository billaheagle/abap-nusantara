"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCw } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";

/**
 * The body of the error pages, styled like NotFoundContent. `fullScreen` is
 * for errors that took the public layout down with them, so the page carries
 * its own way home. `retry` re-fetches the failed segment; most errors here are
 * a database that's waking up, which a second try usually fixes.
 */
export function ErrorContent({
  error,
  retry,
  fullScreen = false,
}: {
  error: Error & { digest?: string };
  retry: () => void;
  fullScreen?: boolean;
}) {
  useEffect(() => {
    console.error(error);
    // The page's metadata usually failed along with it, which leaves the tab blank.
    document.title = "Terjadi kesalahan · ABAP Nusantara";
  }, [error]);

  return (
    <div className={`relative grid place-items-center overflow-hidden px-4 ${fullScreen ? "min-h-screen py-16" : "py-16 sm:py-24"}`}>
      <div className="hero-glow pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
      <div className="max-w-md text-center">
        {fullScreen && (
          <Link href="/" aria-label="ABAP Nusantara, beranda" className="mb-8 inline-block">
            <LogoMark size={56} />
          </Link>
        )}
        <p className="display text-[clamp(4rem,18vw,7rem)] leading-[0.85] font-extrabold tracking-[-0.04em]">
          Ups<span className="text-kunyit">.</span>
        </p>
        <h1 className="display mt-5 text-[1.75rem] font-bold">Ada yang tidak beres</h1>
        <p className="mt-3 text-foreground-muted">
          Halaman ini gagal dimuat. Biasanya ini cuma sebentar, jadi coba muat ulang dalam beberapa detik.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2.5">
          <button
            type="button"
            onClick={() => retry()}
            className="inline-flex cursor-pointer items-center gap-2 rounded-[14px] bg-brand px-5 py-3 font-semibold text-white transition-transform hover:-translate-y-px"
          >
            <RotateCw className="h-[18px] w-[18px]" aria-hidden="true" /> Coba lagi
          </button>
          <Link
            href="/"
            className="inline-flex items-center rounded-[14px] border border-border bg-surface-elevated px-5 py-3 font-semibold shadow-[var(--shadow-1)] transition-colors hover:border-border-strong"
          >
            Ke beranda
          </Link>
        </div>
        {error.digest && <p className="mt-6 font-mono text-xs text-foreground-muted">Kode: {error.digest}</p>}
      </div>
    </div>
  );
}
