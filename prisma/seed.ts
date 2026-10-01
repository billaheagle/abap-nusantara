import { PrismaClient } from "@prisma/client";

/**
 * Seed ABAP Nusantara with the taxonomy from the content plan
 * (abap-nusantara-content/00-plan/BLOG_PLAN_CPI_COMMON.md, sections 3 and 4).
 *
 * - Idempotent: safe to run repeatedly; names/descriptions are kept in sync.
 * - Creates no articles. Articles come from `npm run content:import`.
 * - Removes the old sample data (dummy articles, series, categories, tags)
 *   that earlier versions of this seed created — only by their exact slugs,
 *   and categories/tags only when nothing else uses them anymore.
 */

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: "SAP Integration Suite", slug: "sap-integration-suite", description: "Artikel series belajar SAP Integration Suite (Cloud Integration / CPI)." },
  { name: "Tips & Gotcha", slug: "tips-gotcha", description: "Artikel pendek: gejala, penyebab, dan perbaikan untuk jebakan yang sering ditemui." },
  { name: "Journey", slug: "journey", description: "Artikel pembuka dan refleksi perjalanan belajar." },
];

const TAGS: Array<[slug: string, name: string]> = [
  ["cpi", "CPI"],
  ["integration-suite", "Integration Suite"],
  ["iflow", "iFlow"],
  ["groovy", "Groovy"],
  ["rest-api", "REST API"],
  ["abap-to-cpi", "ABAP to CPI"],
  ["postman", "Postman"],
  ["testing", "Testing"],
  ["security", "Security"],
  ["data-store", "Data Store"],
  ["exception-handling", "Exception Handling"],
  ["message-mapping", "Message Mapping"],
  ["value-mapping", "Value Mapping"],
  ["integration-patterns", "Integration Patterns"],
  ["best-practice", "Best Practice"],
  ["transport", "Transport"],
  ["monitoring", "Monitoring"],
];

const SERIES = [
  {
    order: 1,
    title: "CPI dari Nol untuk ABAPer",
    slug: "cpi-dari-nol-untuk-abaper",
    description: "Langkah pertama dari ABAP ke SAP Integration Suite: konsep, layar, iFlow pertama, dan cara menguji tanpa sistem sungguhan.",
  },
  {
    order: 2,
    title: "Memanggil API dari CPI dengan Benar",
    slug: "memanggil-api-dari-cpi",
    description: "Dari GET sederhana sampai token, signature, dan subflow gateway yang bisa dipakai ulang.",
  },
  {
    order: 3,
    title: "Pola Integrasi yang Tahan Banting",
    slug: "pola-integrasi-tahan-banting-cpi",
    description: "Pola yang membuat integrasi aman dijalankan ulang, tidak memproses data dua kali, dan tetap jalan walau satu item gagal.",
  },
  {
    order: 4,
    title: "Mapping dan Transformasi Data",
    slug: "mapping-transformasi-cpi",
    description: "Mengubah bentuk data dengan cara yang terpelihara: format kanonik, Groovy, Message Mapping, dan Value Mapping.",
  },
  {
    order: 5,
    title: "Error Handling, Monitoring, dan Siap Production",
    slug: "cpi-error-handling-siap-production",
    description: "Membuat integrasi bisa dipercaya: error yang tertangani, alert yang berguna, testing yang lengkap, dan transport yang rapi.",
  },
];

// Sample data created by the previous version of this seed.
const OLD_SAMPLE = {
  articles: [
    "belajar-sap-cpi-1-introduction",
    "belajar-sap-cpi-2-membuat-integration-flow",
    "belajar-sap-cpi-3-calling-rest-api",
    "belajar-sap-cpi-4-error-handling",
    "getting-started-with-sap-btp",
    "abap-restful-application-programming-model-explained",
    "building-a-simple-fiori-elements-list-report",
    "why-i-started-documenting-my-sap-learning-journey",
    "draft-notes-on-event-mesh",
  ],
  series: ["belajar-sap-cpi"],
  categories: ["sap-btp", "integration", "tutorials"],
  tags: ["abap", "sap-btp", "odata", "rfc", "cap", "ui5", "fiori"],
};

async function removeOldSampleData() {
  // Comments, likes and article-tag links cascade with the article.
  const articles = await prisma.article.deleteMany({ where: { slug: { in: OLD_SAMPLE.articles } } });
  const series = await prisma.series.deleteMany({
    where: { slug: { in: OLD_SAMPLE.series }, articles: { none: {} } },
  });
  const categories = await prisma.category.deleteMany({
    where: { slug: { in: OLD_SAMPLE.categories }, articles: { none: {} } },
  });
  const tags = await prisma.tag.deleteMany({
    where: { slug: { in: OLD_SAMPLE.tags }, articles: { none: {} } },
  });
  const total = articles.count + series.count + categories.count + tags.count;
  if (total > 0) {
    console.log(
      `Removed old sample data: ${articles.count} article(s), ${series.count} series, ` +
        `${categories.count} categor(y/ies), ${tags.count} tag(s).`,
    );
  }
}

async function main() {
  console.log("Seeding ABAP Nusantara taxonomy...");

  await removeOldSampleData();

  for (const c of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description },
      create: c,
    });
  }

  for (const [slug, name] of TAGS) {
    await prisma.tag.upsert({ where: { slug }, update: { name }, create: { slug, name } });
  }

  for (const s of SERIES) {
    await prisma.series.upsert({
      where: { slug: s.slug },
      update: { title: s.title, description: s.description, order: s.order },
      create: s,
    });
  }

  console.log(`Seed complete: ${CATEGORIES.length} categories, ${TAGS.length} tags, ${SERIES.length} series.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
