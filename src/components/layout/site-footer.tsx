import Link from "next/link";
import Image from "next/image";

export function SiteFooter() {
  return (
    <footer className="border-t border-ink-border bg-ink text-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <Image src="/brand/logo-200.png" alt="ABAP Nusantara" width={40} height={40} className="h-10 w-10 object-contain" />
          <div>
            <p className="font-semibold tracking-tight">
              ABAP <span className="text-gold">Nusantara</span>
            </p>
            <p className="text-sm text-ink-foreground-muted mt-1 max-w-md font-mono">
              Learning SAP. Building things. Sharing the journey.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-foreground-muted">
          <Link href="/articles" className="hover:text-white transition-colors">Articles</Link>
          <Link href="/series" className="hover:text-white transition-colors">Series</Link>
          <Link href="/about" className="hover:text-white transition-colors">About</Link>
          <Link href="/hire-me" className="hover:text-white transition-colors">Hire Me</Link>
          <Link href="/admin/login" className="hover:text-white transition-colors">Admin</Link>
        </div>
      </div>
      <div className="border-t border-ink-border">
        <p className="mx-auto max-w-6xl px-4 sm:px-6 py-4 text-xs text-ink-foreground-muted font-mono">
          © {new Date().getFullYear()} ABAP Nusantara. Built with Next.js.
        </p>
      </div>
    </footer>
  );
}
