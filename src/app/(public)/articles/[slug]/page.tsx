import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ArrowLeft, ArrowRight, ListTree } from "lucide-react";
import { GithubIcon } from "@/components/ui/github-icon";
import { getArticleBySlug, getRelatedArticles } from "@/features/articles/queries";
import { ArticleRenderer } from "@/components/article/article-renderer";
import { highlightCodeBlocks } from "@/lib/editor/highlight";
import { addImageDimensions } from "@/lib/editor/image-dimensions";
import { addHeadingIds } from "@/lib/editor/headings";
import { ArticleToc, ReaderControls, ReadingProgressBar } from "@/components/article/reading-tools";
import { CoverArt, coverTone } from "@/components/brand/cover-art";
import { FlowPlayer } from "@/components/flows/flow-player";
import { FLOWS } from "@/lib/flows/specs";
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
  const [related, likeState, approvedComments, highlighted, hireMe, general] = await Promise.all([
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

  const { content, headings } = addHeadingIds(highlighted);
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

  const tone = coverTone(article.series?.order, article.slug);
  const seriesBox =
    article.series && seriesArticles.length > 1 ? (
      <div className="rounded-[18px] border border-border bg-surface-elevated p-3.5">
        <Link href={`/series/${article.series.slug}`} className="block px-1 text-sm font-bold leading-snug hover:text-brand-dark">
          {article.series.title}
        </Link>
        {/* A timeline: read parts in indigo, the current one in turmeric, the rest outlined. */}
        <ol className="mt-3 grid">
          {seriesArticles.map((a, i) => {
            const state = a.id === article.id ? "cur" : i < currentIndexInSeries ? "done" : "todo";
            const isNext = i === currentIndexInSeries + 1;
            return (
              <li
                key={a.id}
                className="relative pb-2.5 last:pb-0 before:absolute before:left-[10.5px] before:top-6 before:bottom-0 before:w-px before:bg-border last:before:hidden"
              >
                <Link
                  href={`/articles/${a.slug}`}
                  aria-current={state === "cur" ? "page" : undefined}
                  className={`group/part grid grid-cols-[22px_minmax(0,1fr)] gap-2.5 text-[0.8125rem] leading-snug ${
                    state === "cur" ? "font-semibold text-foreground" : "text-foreground-muted"
                  }`}
                >
                  <span
                    className={`relative z-[1] grid h-[22px] w-[22px] place-items-center rounded-full text-[0.6875rem] font-bold tabular-nums ${
                      state === "cur"
                        ? "bg-kunyit text-[#241800] shadow-[0_0_0_4px_rgb(242_182_50/0.2)]"
                        : state === "done"
                          ? "bg-brand text-white"
                          : "border border-border-strong bg-surface-elevated"
                    }`}
                  >
                    {a.seriesOrder ?? i + 1}
                  </span>
                  <span className="pt-0.5">
                    <span className={state === "cur" ? "" : "transition-colors group-hover/part:text-brand-dark"}>{a.title}</span>
                    {isNext && <span className="mt-0.5 block text-xs font-semibold text-brand-dark">Berikutnya →</span>}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    ) : null;

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <ViewTracker articleId={article.id} />
      <ReadingProgressBar />

      <header className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-10">
        <div className="flex flex-wrap items-center gap-2 text-sm text-foreground-muted">
          {article.series ? (
            <>
              <Link
                href={`/series/${article.series.slug}`}
                className="inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-surface-elevated py-1 pl-1.5 pr-3 font-semibold text-foreground transition-colors hover:border-border-strong"
              >
                <i className="h-[18px] w-[18px] shrink-0 rounded-full" style={{ background: `var(--series-${tone + 1})` }} aria-hidden="true" />
                <span className="truncate">{article.series.title}</span>
              </Link>
              {article.seriesOrder && (
                <span>
                  Bagian {article.seriesOrder} dari {seriesArticles.length}
                </span>
              )}
            </>
          ) : (
            article.category && (
              <Link
                href={`/categories/${article.category.slug}`}
                className="rounded-full border border-border bg-surface-elevated px-3 py-1 font-semibold text-foreground transition-colors hover:border-border-strong"
              >
                {article.category.name}
              </Link>
            )
          )}
        </div>

        <h1 className="display mt-4 max-w-[22ch] text-[clamp(2rem,5vw,3.6rem)] leading-[1.04] font-bold tracking-[-0.015em]">{article.title}</h1>
        {article.excerpt && (
          <p className="mt-4 max-w-[58ch] font-read text-[1.125rem] leading-relaxed text-foreground-muted sm:text-xl">{article.excerpt}</p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-[0.90625rem] text-foreground-muted">
          {hireMe.profile.name && (
            <Link href="/hire-me" className="flex items-center gap-2.5">
              <span className="grid h-[38px] w-[38px] place-items-center rounded-full bg-[linear-gradient(135deg,var(--brand),var(--series-5))] text-sm font-bold text-white">
                {hireMe.profile.name
                  .split(/\s+/)
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
              <span className="leading-tight">
                <b className="block font-semibold text-foreground">{hireMe.profile.name}</b>
                {hireMe.profile.role}
              </span>
            </Link>
          )}
          {article.publishedAt && (
            <time dateTime={article.publishedAt.toISOString()}>{format(article.publishedAt, "d MMMM yyyy", { locale: localeId })}</time>
          )}
          <span>{article.readingTimeMin} menit baca</span>
          {article.repoUrl && (
            <a
              href={article.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated px-3.5 py-1.5 font-semibold text-foreground transition-colors hover:border-brand"
            >
              <GithubIcon className="h-4 w-4" /> Repository
            </a>
          )}
        </div>

        <div className="relative mt-7 aspect-[16/9] overflow-hidden rounded-[20px] sm:aspect-[21/8] sm:rounded-[26px]">
          <CoverArt tone={tone} seed={1} className="absolute inset-0 h-full w-full" />
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 pt-8 pb-6 sm:px-6 sm:pt-10 lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-12 xl:grid-cols-[200px_minmax(0,1fr)_220px]">
        {headings.length > 1 && (
          <aside aria-label="Daftar isi" className="sticky top-24 hidden self-start xl:block">
            <p className="mb-2.5 text-[0.8125rem] font-bold text-foreground-muted">Di artikel ini</p>
            <ArticleToc headings={headings} />
          </aside>
        )}

        <div className={`min-w-0 ${headings.length > 1 ? "" : "xl:col-start-2"}`}>
          {headings.length > 1 && (
            <details className="group mb-8 rounded-[18px] border border-border bg-surface-elevated lg:hidden">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-[0.9375rem] font-semibold [&::-webkit-details-marker]:hidden">
                <ListTree className="h-4 w-4 text-brand" aria-hidden="true" />
                Daftar isi
                <span className="ml-auto text-sm font-normal text-foreground-muted group-open:hidden">{headings.length} bagian</span>
              </summary>
              <div className="border-t border-border px-1.5 py-2">
                <ArticleToc headings={headings} />
              </div>
            </details>
          )}

          <div id="article-body">
            <ArticleRenderer
              content={content}
              insert={
                FLOWS[article.slug]
                  ? {
                      beforeId: FLOWS[article.slug].before,
                      node: <FlowPlayer slug={article.slug} caption="Ikuti satu pesan melewati iFlow di artikel ini. Klik titik langkah untuk berhenti di satu tahap." />,
                    }
                  : undefined
              }
            />
          </div>

          {article.tags.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-2">
              {article.tags.map(({ tag }) => (
                <Link
                  key={tag.slug}
                  href={`/tags/${tag.slug}`}
                  className="rounded-full border border-border bg-surface-elevated px-3.5 py-1.5 text-sm font-semibold text-foreground-muted transition-colors hover:border-brand hover:text-brand-dark"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}

          <div className="mt-6">
            <LikeButton articleId={article.id} initialLiked={likeState.liked} initialCount={likeState.count} />
          </div>

          {(prevInSeries || nextInSeries) && (
            <nav aria-label="Navigasi seri" className="mt-10 grid gap-3 sm:grid-cols-2">
              {prevInSeries ? (
                <Link
                  href={`/articles/${prevInSeries.slug}`}
                  className="rounded-[18px] border border-border bg-surface-elevated p-[18px] shadow-[var(--shadow-1)] transition-[border-color,transform] hover:-translate-y-0.5 hover:border-brand"
                >
                  <span className="flex items-center gap-1.5 text-[0.8125rem] text-foreground-muted">
                    <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Sebelumnya
                  </span>
                  <span className="mt-1 block font-semibold leading-snug">{prevInSeries.title}</span>
                </Link>
              ) : (
                <span className="hidden sm:block" />
              )}
              {nextInSeries && (
                <Link
                  href={`/articles/${nextInSeries.slug}`}
                  className="rounded-[18px] border border-brand bg-brand p-[18px] text-white shadow-[0_8px_20px_-8px_rgb(58_67_201/0.6)] transition-transform hover:-translate-y-0.5 sm:text-right"
                >
                  <span className="flex items-center gap-1.5 text-[0.8125rem] text-white/75 sm:justify-end">
                    Berikutnya, bagian {nextInSeries.seriesOrder} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <span className="mt-1 block font-semibold leading-snug">{nextInSeries.title}</span>
                </Link>
              )}
            </nav>
          )}

          {seriesBox && <div className="mt-8 lg:hidden">{seriesBox}</div>}

          <ReaderControls minutes={article.readingTimeMin} variant="bar" />
        </div>

        <aside aria-label="Pengaturan baca dan seri" className="sticky top-24 hidden max-h-[calc(100vh-7rem)] self-start overflow-y-auto lg:grid lg:gap-6">
          <ReaderControls minutes={article.readingTimeMin} variant="rail" />
          {headings.length > 1 && (
            <div className="xl:hidden">
              <p className="mb-2.5 text-[0.8125rem] font-bold text-foreground-muted">Di artikel ini</p>
              <ArticleToc headings={headings} />
            </div>
          )}
          {seriesBox}
        </aside>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {related.length > 0 && (
          <section className="mt-10 border-t border-border pt-10">
            <h2 className="display mb-5 text-[1.75rem] font-bold">Baca juga</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((a, i) => (
                <ArticleCard key={a.id} article={a} seed={i * 2 + 5} />
              ))}
            </div>
          </section>
        )}

        <section className="mx-auto mt-12 max-w-3xl border-t border-border pt-10">
          <h2 className="display mb-5 text-[1.75rem] font-bold">Komentar</h2>
          <div className="mb-8">
            <CommentForm articleId={article.id} csrfToken={csrfToken} />
          </div>
          <CommentThread comments={commentTree} articleId={article.id} csrfToken={csrfToken} />
        </section>
      </div>
    </article>
  );
}
