import Link from "next/link";
import { ArrowRight, Newspaper } from "lucide-react";
import { getPublishedArticles } from "@/features/articles/queries";
import { ArticleCard } from "@/components/ui/article-card";
import { EmptyState } from "@/components/ui/empty-state";
import { CoverArt, coverTone } from "@/components/brand/cover-art";
import { FlowPlayer } from "@/components/flows/flow-player";
import { HOME_FLOW } from "@/lib/flows/home-flow";
import { firstFlowSpec } from "@/lib/flows/attach";
import { AlphaTry } from "@/components/home/alpha-try";
import { ToolIcon } from "@/components/tools/tool-icon";
import { prisma } from "@/lib/db/prisma";
import { getSetting } from "@/features/settings/queries";
import { TOOL_REGISTRY } from "@/lib/tools/registry";

export const revalidate = 60;

/** The article the hero's iFlow is taken from. Once it's published the hero plays its ```flow block and links to it. */
const IFLOW_ARTICLE_SLUG = "cpi-memanggil-rest-api-pertama";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function publishedThisWeek(date: Date | null): boolean {
  return !!date && Date.now() - date.getTime() < WEEK_MS;
}

/** Ends a headline line with the turmeric statement period when the text already ends in one. */
function Statement({ text }: { text: string }) {
  if (!text.endsWith(".")) return <>{text}</>;
  return (
    <>
      {text.slice(0, -1)}
      <span className="text-kunyit">.</span>
    </>
  );
}

export default async function HomePage() {
  const [latest, series, articleCount, iflowArticle, toolSettings, { hero, home }] = await Promise.all([
    getPublishedArticles({ page: 1 }),
    prisma.series.findMany({
      orderBy: { order: "asc" },
      take: 5,
      include: { _count: { select: { articles: { where: { status: "PUBLISHED" } } } } },
    }),
    prisma.article.count({ where: { status: "PUBLISHED" } }),
    prisma.article.findFirst({ where: { slug: IFLOW_ARTICLE_SLUG, status: "PUBLISHED" }, select: { slug: true, title: true, contentJson: true } }),
    getSetting("tools"),
    getSetting("general"),
  ]);

  // The published article is the source; the copy in code covers the time before it goes live.
  const heroFlow = (iflowArticle && firstFlowSpec(iflowArticle.contentJson)) ?? HOME_FLOW;
  const hiddenTools = new Set(toolSettings.hidden);
  const tools = TOOL_REGISTRY.filter((t) => t.status === "live" && !hiddenTools.has(t.slug));
  const showAlpha = tools.some((t) => t.slug === "alpha-converter");
  const toolList = tools.filter((t) => t.slug !== "alpha-converter").slice(0, 6);

  const newest = latest.items[0];
  const recent = latest.items.slice(0, 5);
  const startSeries = series.find((s) => s._count.articles > 0);
  const firstOfStart = startSeries
    ? await prisma.article.findFirst({
        where: { seriesId: startSeries.id, status: "PUBLISHED" },
        orderBy: { seriesOrder: "asc" },
        select: { slug: true },
      })
    : null;

  return (
    <div>
      {/* Hero */}
      <section className="relative pt-8 pb-10 sm:pt-12">
        <div className="hero-glow pointer-events-none absolute inset-x-0 -top-40 -z-10 h-[620px]" aria-hidden="true" />
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-9 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12">
          <div>
            {newest && (
              <Link
                href={`/articles/${newest.slug}`}
                className="inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-surface-elevated py-1 pl-1.5 pr-3 text-sm font-[550] shadow-[var(--shadow-1)] transition-colors hover:border-border-strong"
              >
                <b className="shrink-0 rounded-full bg-kunyit px-2 py-0.5 text-xs font-bold text-[#241800]">Baru</b>
                <span className="truncate">{newest.title}</span>
              </Link>
            )}
            <h1 className="display mt-5 text-[clamp(2.6rem,6.2vw,5.2rem)] leading-[0.98] font-[750] tracking-[-0.018em]">
              {hero.titleLine1 && (
                <span className="block">
                  <Statement text={hero.titleLine1} />
                </span>
              )}
              {hero.titleLine2 && <span className="block font-medium text-foreground-muted">{hero.titleLine2}</span>}
              {hero.titleHighlight && (
                <span className="block">
                  <Statement text={hero.titleHighlight} />
                </span>
              )}
            </h1>
            {hero.description && (
              <p className="mt-5 max-w-[50ch] text-[1.0625rem] leading-relaxed text-foreground-muted sm:text-[1.15rem]">{hero.description}</p>
            )}
            <div className="mt-7 flex flex-wrap gap-2.5">
              <Link
                href={firstOfStart ? `/articles/${firstOfStart.slug}` : "/articles"}
                className="inline-flex items-center gap-2 rounded-[14px] bg-brand px-5 py-3 text-[0.96875rem] font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_8px_20px_-6px_rgb(58_67_201/0.6)] transition-transform hover:-translate-y-px"
              >
                {firstOfStart ? "Mulai dari seri 1" : hero.primaryCtaLabel}
                <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" />
              </Link>
              <Link
                href="/articles"
                className="inline-flex items-center rounded-[14px] border border-border bg-surface-elevated px-5 py-3 text-[0.96875rem] font-semibold shadow-[var(--shadow-1)] transition-colors hover:border-border-strong"
              >
                {hero.primaryCtaLabel}
              </Link>
            </div>
            <dl className="mt-8 flex flex-wrap gap-x-7 gap-y-3">
              {[
                [articleCount, "artikel terbit"],
                [series.length, "seri direncanakan"],
                [tools.length, "tool gratis"],
              ].map(([n, label]) => (
                <div key={label} className="flex flex-col-reverse">
                  <dt className="text-sm text-foreground-muted">{label}</dt>
                  <dd className="text-[1.625rem] font-bold tracking-[-0.03em] tabular-nums">{n}</dd>
                </div>
              ))}
            </dl>
          </div>

          <FlowPlayer
            spec={heroFlow}
            caption={
              iflowArticle && (
                <>
                  Satu pesan melewati iFlow dari{" "}
                  <Link href={`/articles/${iflowArticle.slug}`} className="font-semibold text-ink-foreground underline decoration-kunyit underline-offset-[3px]">
                    {iflowArticle.title}
                  </Link>
                  .
                </>
              )
            }
          />
        </div>
      </section>

      {/* Series bento */}
      {series.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <SectionHead title={home.featuredTitle || "Belajar berurutan"} sub={`${series.length} seri, dari iFlow pertama sampai siap production. Tiap seri bisa dibaca sendiri.`} href="/series" more="Semua seri" />
          <div className="grid grid-cols-2 gap-3 sm:gap-3.5 lg:grid-cols-6">
            {series.map((s, i) => {
              const live = s._count.articles > 0;
              const size = i === 0 ? "big" : i === 1 ? "med" : "sm";
              const tone = coverTone(s.order, s.slug);
              const span =
                size === "big"
                  ? "col-span-2 lg:col-span-3 lg:row-span-2 min-h-[280px] lg:min-h-[452px] p-6 sm:p-[30px]"
                  : size === "med"
                    ? "col-span-2 lg:col-span-3 min-h-[240px] p-6"
                    : `${i === series.length - 1 && series.length % 2 === 1 ? "col-span-2" : "col-span-1"} lg:col-span-1 min-h-[200px] p-5`;
              const inner = (
                <>
                  <CoverArt tone={tone} seed={i} className="absolute inset-0 -z-10 h-full w-full" />
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-white/20 px-2.5 py-1 text-[0.8125rem] font-bold backdrop-blur-md">Seri {s.order || i + 1}</span>
                    {size !== "sm" && (
                      <span className="rounded-full bg-black/20 px-2.5 py-1 text-xs font-semibold">
                        {live ? `${s._count.articles} bagian` : "Segera"}
                      </span>
                    )}
                  </div>
                  <h3
                    className={`mt-auto font-bold leading-[1.12] tracking-[-0.02em] ${
                      size === "big" ? "max-w-[18ch] text-[clamp(1.75rem,3.2vw,2.375rem)]" : size === "med" ? "max-w-[22ch] text-[1.375rem]" : "text-[1.0625rem]"
                    }`}
                  >
                    {s.title}
                  </h3>
                  {size !== "sm" && s.description && <p className="mt-2 max-w-[46ch] text-[0.9375rem] leading-snug opacity-85">{s.description}</p>}
                  {size === "sm" && !live && <p className="mt-1.5 text-[0.8125rem] font-semibold opacity-80">Segera</p>}
                  {size !== "sm" && live && (
                    <div className="mt-4 flex gap-1" aria-hidden="true">
                      {Array.from({ length: s._count.articles }, (_, k) => (
                        <i key={k} className="h-[5px] flex-1 rounded-full bg-white" />
                      ))}
                    </div>
                  )}
                </>
              );
              const base = `relative isolate flex flex-col overflow-hidden rounded-[24px] text-white ${span}`;
              return live ? (
                <Link key={s.id} href={`/series/${s.slug}`} className={`${base} transition-transform duration-300 hover:-translate-y-[3px]`}>
                  {inner}
                </Link>
              ) : (
                <div key={s.id} className={`${base} opacity-90`}>
                  {inner}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Latest */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <SectionHead title={home.latestTitle || "Terbaru"} sub="Artikel yang baru terbit, langsung dari catatan kerja." href="/articles" more="Semua artikel" />
        {recent.length === 0 ? (
          <EmptyState icon={Newspaper} title="Belum ada artikel yang terbit" description="Artikel pertama akan muncul di sini begitu terbit." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-[18px] md:grid-cols-2 lg:grid-cols-3">
            {recent.map((article, i) => (
              <ArticleCard
                key={article.id}
                article={article}
                featured={i === 0}
                seed={i * 3 + 2}
                badge={i === 0 && publishedThisWeek(article.publishedAt) ? "Terbit minggu ini" : undefined}
              />
            ))}
          </div>
        )}
      </section>

      {/* Tools */}
      {tools.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <SectionHead title={home.toolsTitle || "Tools untuk kerja harian"} sub="Jalan di browser, data yang kamu tempel tidak dikirim ke mana pun." href="/tools" more={`${tools.length} tools`} />
          <div className={`grid grid-cols-1 gap-3.5 ${showAlpha ? "lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.9fr)]" : ""}`}>
            {showAlpha && <AlphaTry />}
            <div className="grid grid-cols-1 content-start gap-3.5 sm:grid-cols-2">
              {toolList.map((t) => (
                <Link
                  key={t.slug}
                  href={`/tools/${t.slug}`}
                  className="grid grid-cols-[44px_minmax(0,1fr)] items-start gap-3.5 rounded-[20px] border border-border bg-surface-elevated p-[18px] shadow-[var(--shadow-1)] transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-brand"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-[13px] bg-brand-tint text-brand-dark">
                    <ToolIcon name={t.icon} className="h-[22px] w-[22px]" />
                  </span>
                  <span>
                    <span className="block text-[1.03125rem] font-semibold tracking-[-0.01em]">{t.name}</span>
                    <span className="mt-0.5 line-clamp-2 text-sm leading-snug text-foreground-muted">{t.blurb}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function SectionHead({ title, sub, href, more }: { title: string; sub?: string; href: string; more: string }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-3 sm:mb-6">
      <div className="min-w-0">
        <h2 className="display text-[clamp(1.7rem,3.4vw,2.4rem)] leading-[1.05] font-bold">{title}</h2>
        {sub && <p className="mt-2 max-w-[56ch] text-foreground-muted">{sub}</p>}
      </div>
      <Link href={href} className="shrink-0 whitespace-nowrap rounded-xl bg-brand-tint px-3.5 py-2 text-[0.9375rem] font-semibold text-brand-dark transition-[filter] hover:brightness-[0.97]">
        {more}
      </Link>
    </div>
  );
}
