import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Clock } from "lucide-react";
import { CoverArt, coverTone } from "@/components/brand/cover-art";

export interface ArticleCardData {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  readingTimeMin: number;
  publishedAt: Date | null;
  seriesOrder?: number | null;
  series: { title: string; slug: string; order?: number } | null;
  category: { name: string; slug: string } | null;
}

/**
 * One article as a card. `featured` lays it out wide (cover beside the text)
 * on screens that have room, and stacks like the rest on phones.
 */
export function ArticleCard({
  article,
  featured = false,
  badge,
  seed = 0,
}: {
  article: ArticleCardData;
  featured?: boolean;
  badge?: string;
  seed?: number;
}) {
  const tone = coverTone(article.series?.order, article.slug);
  const label =
    article.series?.order && article.seriesOrder
      ? `Seri ${article.series.order}, bagian ${article.seriesOrder}`
      : (article.series?.title ?? article.category?.name);

  return (
    <Link
      href={`/articles/${article.slug}`}
      className={`card-hover group flex flex-col overflow-hidden rounded-[22px] border border-border bg-surface-elevated shadow-[var(--shadow-1)] ${
        featured ? "md:col-span-2 md:flex-row" : ""
      }`}
    >
      <div className={`relative aspect-[16/9] overflow-hidden ${featured ? "md:aspect-auto md:min-h-[300px] md:flex-[1.15]" : ""}`}>
        {article.coverImage ? (
          // The cover image already carries the series label, title and logo.
          <Image
            src={article.coverImage}
            alt=""
            fill
            sizes={featured ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <CoverArt
            tone={tone}
            seed={seed}
            className="absolute inset-0 h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        )}
        {!article.coverImage && label && (
          <span className="absolute left-3 top-3 rounded-full bg-black/25 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-md">
            {label}
          </span>
        )}
      </div>
      <div className={`flex flex-1 flex-col gap-2 p-5 ${featured ? "md:justify-center md:p-7" : ""}`}>
        {badge && (
          <span className="self-start rounded-full bg-gold-tint px-2.5 py-0.5 text-xs font-bold text-gold-strong">{badge}</span>
        )}
        <h3
          className={`font-semibold leading-tight tracking-[-0.02em] transition-colors group-hover:text-brand-dark ${
            featured ? "text-[1.375rem] md:text-[1.75rem] md:leading-[1.15]" : "text-[1.1875rem]"
          }`}
        >
          {article.title}
        </h3>
        {article.excerpt && (
          <p className={`text-[0.9375rem] leading-relaxed text-foreground-muted ${featured ? "line-clamp-3 md:line-clamp-4 md:text-base" : "line-clamp-2"}`}>
            {article.excerpt}
          </p>
        )}
        <div className="mt-auto flex items-center gap-3 pt-2 text-[0.8125rem] text-foreground-muted tabular-nums">
          {article.publishedAt && (
            <time dateTime={article.publishedAt.toISOString()}>{format(article.publishedAt, "d MMM yyyy", { locale: localeId })}</time>
          )}
          <span className="ml-auto inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {article.readingTimeMin} menit
          </span>
        </div>
      </div>
    </Link>
  );
}
