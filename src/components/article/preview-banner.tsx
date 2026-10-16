import { Eye } from "lucide-react";

/**
 * Shown on an article while an admin previews it. Leaving goes through the
 * exit route (a plain link, so it isn't prefetched) and lands back on the
 * article if it's published, otherwise on the admin list.
 */
export function PreviewBanner({ slug, published }: { slug: string; published: boolean }) {
  const back = published ? `/articles/${slug}` : "/admin/articles";
  return (
    <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-gold/50 bg-gold-tint px-4 py-3 text-sm text-foreground">
        <Eye className="h-4 w-4 shrink-0 text-gold-strong" aria-hidden="true" />
        <p className="min-w-0 flex-1">
          <b className="font-semibold">Mode pratinjau.</b>{" "}
          {published ? "Artikel ini sudah terbit; kamu melihatnya sebagai admin." : "Artikel ini belum terbit dan hanya terlihat olehmu sebagai admin."}
        </p>
        <a href={`/api/admin/preview/exit?to=${encodeURIComponent(back)}`} className="shrink-0 font-semibold text-gold-strong underline underline-offset-[3px]">
          Keluar pratinjau
        </a>
      </div>
    </div>
  );
}
