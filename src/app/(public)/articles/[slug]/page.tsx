import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { GithubIcon } from "@/components/ui/github-icon";
import { getArticleBySlug, getRelatedArticles } from "@/features/articles/queries";
import { ArticleRenderer } from "@/components/article/article-renderer";
import { highlightCodeBlocks } from "@/lib/editor/highlight";
import { addImageDimensions } from "@/lib/editor/image-dimensions";
import { LikeButton } from "@/components/article/like-button";
import { ViewTracker } from "@/components/article/view-tracker";
import { ArticleCard } from "@/components/ui/article-card";
import { CommentForm } from "@/components/comments/comment-form";
import { CommentThread } from "@/components/comments/comment-thread";
import { buildCommentTree } from "@/features/comments/tree";
import { getLikeState } from "@/features/likes/actions";
import { issueCsrfToken } from "@/lib/security/csrf";
import { prisma } from "@/lib/db/prisma";
import { getSetting } from "@/features/settings/queries";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const url = `${siteUrl}/articles/${article.slug}`;

  return {
    title: article.title,
    description: article.excerpt ?? undefined,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt ?? undefined,
      url,
      images: article.coverImage ? [{ url: article.coverImage }] : undefined,
      publishedTime: article.publishedAt?.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt ?? undefined,
      images: article.coverImage ? [article.coverImage] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const csrfToken = issueCsrfToken();
  const [related, likeState, approvedComments, content, hireMe, general] = await Promise.all([
    getRelatedArticles(article.id, article.categoryId, article.tags.map((t) => t.tag.slug)),
    getLikeState(article.id),
    prisma.comment.findMany({
      where: { articleId: article.id, status: "APPROVED" },
      orderBy: { createdAt: "asc" },
      select: { id: true, authorName: true, body: true, createdAt: true, parentCommentId: true },
    }),
    highlightCodeBlocks(article.contentJson).then(addImageDimensions),
    getSetting("hireMe"),
    getSetting("general"),
  ]);

  const commentTree = buildCommentTree(approvedComments);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const seriesArticles = article.series?.articles ?? [];
  const currentIndexInSeries = seriesArticles.findIndex((a) => a.id === article.id);
  const prevInSeries = currentIndexInSeries > 0 ? seriesArticles[currentIndexInSeries - 1] : null;
  const nextInSeries = currentIndexInSeries >= 0 && currentIndexInSeries < seriesArticles.length - 1 ? seriesArticles[currentIndexInSeries + 1] : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: article.title,
    description: article.excerpt ?? undefined,
    image: article.coverImage ?? undefined,
    datePublished: article.publishedAt?.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    // The real author (Settings → Hire Me → Profile) when set, linked to the
    // Hire Me page and profiles; otherwise the site itself.
    author: hireMe.profile.name
      ? {
          "@type": "Person",
          name: hireMe.profile.name,
          jobTitle: hireMe.profile.role || undefined,
          url: `${siteUrl}/hire-me`,
          sameAs: [general.links.linkedin, general.links.github].filter(Boolean),
        }
      : { "@type": "Organization", name: [general.brand.name, general.brand.accent].filter(Boolean).join(" "), url: siteUrl },
    publisher: {
      "@type": "Organization",
      name: [general.brand.name, general.brand.accent].filter(Boolean).join(" "),
      url: siteUrl,
      logo: { "@type": "ImageObject", url: `${siteUrl}/brand/logo-512.png` },
    },
    mainEntityOfPage: `${siteUrl}/articles/${article.slug}`,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Articles", item: `${siteUrl}/articles` },
      { "@type": "ListItem", position: 2, name: article.title, item: `${siteUrl}/articles/${article.slug}` },
    ],
  };

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <ViewTracker articleId={article.id} />

      {article.series && (
        <Link href={`/series/${article.series.slug}`} className="inline-flex items-center gap-2 rounded-full bg-accent-red-tint px-3.5 py-1.5 text-xs font-semibold text-accent-red mb-4">
          Part {article.seriesOrder ?? "?"} of &ldquo;{article.series.title}&rdquo;
        </Link>
      )}

      <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">{article.title}</h1>
      {article.excerpt && <p className="mt-3 text-lg text-foreground-muted">{article.excerpt}</p>}

      <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-foreground-muted">
        {article.publishedAt && <time dateTime={article.publishedAt.toISOString()}>{format(article.publishedAt, "MMMM d, yyyy")}</time>}
        <span>·</span>
        <span>{article.readingTimeMin} min read</span>
        {article.category && (
          <>
            <span>·</span>
            <Link href={`/categories/${article.category.slug}`} className="text-brand hover:underline">{article.category.name}</Link>
          </>
        )}
      </div>

      {article.coverImage && (
        <div className="relative mt-8 aspect-[16/9] rounded-md overflow-hidden border border-border">
          <Image src={article.coverImage} alt={article.title} fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover" priority />
        </div>
      )}

      {article.repoUrl && (
        <a
          href={article.repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:border-brand hover:text-brand transition-all hover:scale-[1.02]"
        >
          <GithubIcon className="h-4 w-4" /> View Repository
        </a>
      )}

      <div className="mt-8">
        <ArticleRenderer content={content} />
      </div>

      {article.tags.length > 0 && (
        <div className="mt-10 flex flex-wrap gap-2">
          {article.tags.map(({ tag }) => (
            <Link key={tag.slug} href={`/tags/${tag.slug}`} className="rounded-full bg-surface px-3.5 py-1.5 text-sm font-mono text-foreground-muted hover:bg-brand-tint hover:text-brand transition-colors">
              #{tag.name}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8">
        <LikeButton articleId={article.id} initialLiked={likeState.liked} initialCount={likeState.count} />
      </div>

      {(prevInSeries || nextInSeries) && (
        <div className="mt-10 grid gap-3 sm:grid-cols-2 border-t border-border pt-6">
          {prevInSeries && (
            <Link href={`/articles/${prevInSeries.slug}`} className="rounded-md border border-border p-4 hover:border-brand transition-colors">
              <p className="text-xs text-foreground-muted mb-1">← Previous in series</p>
              <p className="font-medium text-sm">{prevInSeries.title}</p>
            </Link>
          )}
          {nextInSeries && (
            <Link href={`/articles/${nextInSeries.slug}`} className="rounded-md border border-border p-4 hover:border-brand transition-colors sm:text-right">
              <p className="text-xs text-foreground-muted mb-1">Next in series →</p>
              <p className="font-medium text-sm">{nextInSeries.title}</p>
            </Link>
          )}
        </div>
      )}

      {article.series && seriesArticles.length > 1 && (
        <div className="mt-8 rounded-md border border-border p-5">
          <p className="text-sm font-semibold mb-3">All articles in &ldquo;{article.series.title}&rdquo;</p>
          <ol className="space-y-2">
            {seriesArticles.map((a) => (
              <li key={a.id}>
                <Link href={`/articles/${a.slug}`} className={`text-sm hover:underline ${a.id === article.id ? "font-semibold text-brand" : "text-foreground-muted"}`}>
                  {a.seriesOrder}. {a.title}
                </Link>
              </li>
            ))}
          </ol>
        </div>
      )}

      {related.length > 0 && (
        <div className="mt-14 border-t border-border pt-8">
          <h2 className="text-lg font-semibold mb-5">Related articles</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {related.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-14 border-t border-border pt-8">
        <h2 className="text-lg font-semibold mb-5">Comments</h2>
        <div className="mb-8">
          <CommentForm articleId={article.id} csrfToken={csrfToken} />
        </div>
        <CommentThread comments={commentTree} articleId={article.id} csrfToken={csrfToken} />
      </div>
    </article>
  );
}
