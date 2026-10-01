import Link from "next/link";
import { ArrowRight, Terminal, Newspaper } from "lucide-react";
import { GithubIcon } from "@/components/ui/github-icon";
import { getFeaturedArticles, getPublishedArticles } from "@/features/articles/queries";
import { ArticleCard } from "@/components/ui/article-card";
import { EmptyState } from "@/components/ui/empty-state";
import { prisma } from "@/lib/db/prisma";
import { getSetting } from "@/features/settings/queries";

export const revalidate = 60;

export default async function HomePage() {
  const [featured, latest, categories, tags, { hero, home, links }] = await Promise.all([
    getFeaturedArticles(3),
    getPublishedArticles({ page: 1 }),
    prisma.category.findMany({ take: 8, orderBy: { name: "asc" } }),
    prisma.tag.findMany({ take: 12, orderBy: { name: "asc" } }),
    getSetting("general"),
  ]);

  const hasTopics = categories.length > 0 || tags.length > 0;

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-grid" aria-hidden="true" />
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 pt-20 sm:pt-28 pb-16 sm:pb-24 text-center">
          {hero.badge && (
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated px-3.5 py-1.5 text-xs font-medium text-foreground-muted mb-8">
              <Terminal className="h-3.5 w-3.5 text-brand" />
              <span className="font-mono">{hero.badge}</span>
            </div>
          )}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tighter leading-[1.05] text-balance">
            {hero.titleLine1}
            {hero.titleLine1 && hero.titleLine2 && <br />}
            {hero.titleLine2}{" "}
            <span className="bg-gradient-to-r from-accent-red via-sunset to-gold bg-clip-text text-transparent">
              {hero.titleHighlight}
            </span>
          </h1>
          {hero.description && (
            <p className="mt-6 max-w-xl mx-auto text-foreground-muted text-base sm:text-lg leading-relaxed">
              {hero.description}
            </p>
          )}
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/articles"
              className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white hover:bg-black transition-all hover:scale-[1.02] shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
            >
              {hero.primaryCtaLabel} <ArrowRight className="h-4 w-4" />
            </Link>
            {hero.showGithubButton && links.github && (
              <a
                href={links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold hover:border-border-strong hover:bg-surface transition-colors"
              >
                <GithubIcon className="h-4 w-4" /> GitHub
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-14 sm:pt-16 pb-4">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-mono font-medium text-brand uppercase tracking-wider mb-1.5">[ Featured ]</p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{home.featuredTitle}</h2>
            </div>
            <Link href="/articles" className="text-sm font-medium text-foreground-muted hover:text-brand transition-colors flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}

      {/* Latest */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-10 pb-14 sm:pb-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-xs font-mono font-medium text-brand uppercase tracking-wider mb-1.5">[ Latest ]</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{home.latestTitle}</h2>
          </div>
          <Link href="/articles" className="shrink-0 whitespace-nowrap text-sm font-medium text-foreground-muted hover:text-brand transition-colors flex items-center gap-1">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {latest.items.length === 0 ? (
          <EmptyState
            icon={Newspaper}
            title="No articles published yet"
            description="Once the first article goes live, it'll show up here — check back soon."
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {latest.items.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </section>

      {/* Categories & tags — only rendered once there's something to show */}
      {hasTopics && (
        <section className="border-t border-border bg-surface">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-16 grid gap-10 sm:grid-cols-2">
            {categories.length > 0 && (
              <div>
                <p className="text-xs font-mono font-medium text-foreground-muted uppercase tracking-wider mb-3">Topics</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/categories/${cat.slug}`}
                      className="rounded-full border border-border bg-surface-elevated px-3.5 py-1.5 text-sm font-medium hover:border-brand hover:text-brand transition-colors"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {tags.length > 0 && (
              <div>
                <p className="text-xs font-mono font-medium text-foreground-muted uppercase tracking-wider mb-3">Popular tags</p>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Link
                      key={tag.id}
                      href={`/tags/${tag.slug}`}
                      className="rounded-full bg-surface-elevated border border-border px-3.5 py-1.5 text-sm font-mono text-foreground-muted hover:border-brand hover:text-brand transition-colors"
                    >
                      #{tag.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* About / tools — dark contrast band */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="absolute inset-0 bg-grid-dark" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-16 grid gap-8 sm:grid-cols-[2fr_1fr] items-start">
          <div>
            <p className="text-xs font-mono font-medium text-gold uppercase tracking-wider mb-3">[ About ]</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">{home.aboutTitle}</h2>
            {home.aboutBody && <p className="text-ink-foreground-muted max-w-2xl leading-relaxed">{home.aboutBody}</p>}
            <Link href="/about" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-white hover:text-gold transition-colors">
              {home.aboutLinkLabel} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="rounded-xl border border-ink-border bg-ink-elevated p-5">
            <h3 className="text-sm font-semibold mb-2">{home.toolsTitle}</h3>
            {home.toolsBody && <p className="text-sm text-ink-foreground-muted leading-relaxed">{home.toolsBody}</p>}
            <Link href="/tools" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-gold hover:text-white transition-colors">
              Preview <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
