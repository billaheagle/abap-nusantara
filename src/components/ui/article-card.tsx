import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";

export interface ArticleCardData {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  readingTimeMin: number;
  publishedAt: Date | null;
  series: { title: string; slug: string } | null;
  category: { name: string; slug: string } | null;
  tags: { tag: { name: string; slug: string } }[];
}

export function ArticleCard({ article }: { article: ArticleCardData }) {
  return (
    <article className="card-hover group flex flex-col rounded-xl border border-border bg-surface-elevated overflow-hidden">
      <Link href={`/articles/${article.slug}`} className="block relative aspect-[16/9] bg-surface overflow-hidden">
        {article.coverImage ? (
          <Image
            src={article.coverImage}
            alt={article.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-grid">
            <span className="font-mono font-bold text-3xl text-border-strong">AN</span>
          </div>
        )}
        {article.series && (
          <span className="absolute top-3 left-3 rounded-full bg-accent-red px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
            Series
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-5 gap-2">
        {article.category && (
          <Link
            href={`/categories/${article.category.slug}`}
            className="text-[11px] font-mono font-semibold text-brand uppercase tracking-wider"
          >
            {article.category.name}
          </Link>
        )}
        <Link href={`/articles/${article.slug}`}>
          <h3 className="font-semibold leading-snug tracking-tight group-hover:text-brand transition-colors line-clamp-2">
            {article.title}
          </h3>
        </Link>
        {article.excerpt && <p className="text-sm text-foreground-muted line-clamp-2 leading-relaxed">{article.excerpt}</p>}
        <div className="mt-auto flex items-center gap-2 pt-3 text-xs text-foreground-muted font-mono">
          {article.publishedAt && (
            <time dateTime={article.publishedAt.toISOString()}>{format(article.publishedAt, "MMM d, yyyy")}</time>
          )}
          <span>·</span>
          <span>{article.readingTimeMin} min read</span>
        </div>
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {article.tags.slice(0, 3).map(({ tag }) => (
              <Link
                key={tag.slug}
                href={`/tags/${tag.slug}`}
                className="rounded-full bg-surface px-2.5 py-1 text-[11px] font-mono text-foreground-muted hover:text-brand hover:bg-brand-tint transition-colors"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
