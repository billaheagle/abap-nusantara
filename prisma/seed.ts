import { PrismaClient, ArticleStatus, CommentStatus } from "@prisma/client";

const prisma = new PrismaClient();

function doc(paragraphs: string[]) {
  return {
    type: "doc",
    content: paragraphs.map((text) => ({ type: "paragraph", content: [{ type: "text", text }] })),
  };
}

async function main() {
  console.log("Seeding ABAP Nusantara...");

  // --- Categories ---------------------------------------------------------
  const [catBTP, catIntegration, catTutorials, catJourney] = await Promise.all([
    prisma.category.upsert({ where: { slug: "sap-btp" }, update: {}, create: { name: "SAP BTP", slug: "sap-btp", description: "Platform-level topics on SAP Business Technology Platform." } }),
    prisma.category.upsert({ where: { slug: "integration" }, update: {}, create: { name: "Integration", slug: "integration", description: "SAP Integration Suite, CPI, and API integration." } }),
    prisma.category.upsert({ where: { slug: "tutorials" }, update: {}, create: { name: "Tutorials", slug: "tutorials", description: "Step-by-step how-tos." } }),
    prisma.category.upsert({ where: { slug: "journey" }, update: {}, create: { name: "Career / Journey", slug: "journey", description: "Notes on the learning journey itself." } }),
  ]);

  // --- Tags -----------------------------------------------------------------
  const tagNames = ["ABAP", "SAP BTP", "CPI", "Integration Suite", "OData", "RFC", "CAP", "UI5", "Fiori"];
  const tags = await Promise.all(
    tagNames.map((name) =>
      prisma.tag.upsert({
        where: { slug: name.toLowerCase().replace(/\s+/g, "-") },
        update: {},
        create: { name, slug: name.toLowerCase().replace(/\s+/g, "-") },
      })
    )
  );
  const tagBySlug = Object.fromEntries(tags.map((t) => [t.slug, t]));

  // --- Series: "Belajar SAP CPI" ---------------------------------------------
  const cpiSeries = await prisma.series.upsert({
    where: { slug: "belajar-sap-cpi" },
    update: {},
    create: {
      title: "Belajar SAP CPI",
      slug: "belajar-sap-cpi",
      description: "A hands-on series learning SAP Cloud Platform Integration from scratch — building real integration flows step by step.",
      order: 1,
    },
  });

  const cpiArticlesData = [
    {
      title: "Belajar SAP CPI #1 — Introduction",
      slug: "belajar-sap-cpi-1-introduction",
      excerpt: "Starting the journey into SAP Cloud Platform Integration: what it is, and why it matters for SAP BTP developers.",
      order: 1,
      tags: ["cpi", "integration-suite", "sap-btp"],
      body: [
        "SAP Cloud Platform Integration (CPI) is the integration runtime inside SAP Integration Suite, used to connect SAP and non-SAP systems through integration flows (iFlows).",
        "In this series I'll document building real integration flows from zero — starting with the tenant setup, the Web UI, and the core building blocks: sender/receiver channels, message mapping, and content modifiers.",
        "By the end of this series, the goal is to have called a real external REST API from a CPI iFlow and handled its response and errors properly.",
      ],
    },
    {
      title: "Belajar SAP CPI #2 — Membuat Integration Flow",
      slug: "belajar-sap-cpi-2-membuat-integration-flow",
      excerpt: "Building the first integration flow: sender adapter, content modifier, and a simple routing step.",
      order: 2,
      tags: ["cpi", "integration-suite"],
      body: [
        "With the tenant provisioned, the next step is creating our first Integration Flow inside an Integration Package.",
        "We start with a simple HTTPS sender adapter, add a Content Modifier to set a couple of headers, and route the message to a Groovy script step for basic logging.",
        "This flow does nothing business-critical yet — the goal here is purely to get comfortable with the CPI canvas, deployment, and the monitoring tools before adding real integration logic.",
      ],
    },
    {
      title: "Belajar SAP CPI #3 — Calling REST API",
      slug: "belajar-sap-cpi-3-calling-rest-api",
      excerpt: "Extending the flow to call an external REST API, and mapping its JSON response.",
      order: 3,
      tags: ["cpi", "odata", "integration-suite"],
      body: [
        "Now that the base flow works, it's time to call a real external REST API using the HTTP receiver adapter.",
        "This covers setting up the receiver channel, configuring authentication, and using a Message Mapping step to transform the JSON response into the shape our downstream system expects.",
        "We also cover a common gotcha: making sure the Content-Type headers are set correctly on both the request and response sides, which trips up a lot of people new to CPI.",
      ],
    },
    {
      title: "Belajar SAP CPI #4 — Error Handling",
      slug: "belajar-sap-cpi-4-error-handling",
      excerpt: "Making the integration flow production-ready with proper exception subprocesses and alerting.",
      order: 4,
      tags: ["cpi", "integration-suite"],
      body: [
        "A flow that only handles the happy path isn't production-ready. This part covers exception subprocesses, retry strategies, and how to surface failures without silently swallowing them.",
        "We also look at CPI's built-in monitoring and alerting so failed messages get noticed quickly rather than discovered days later by an angry business user.",
        "This wraps up the introductory CPI series — future articles will dig into specific adapter types and more advanced mapping scenarios.",
      ],
    },
  ];

  const cpiArticles = [];
  for (const data of cpiArticlesData) {
    const article = await prisma.article.upsert({
      where: { slug: data.slug },
      update: {},
      create: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        contentJson: doc(data.body),
        status: ArticleStatus.PUBLISHED,
        publishedAt: new Date(Date.now() - (5 - data.order) * 86400000),
        readingTimeMin: Math.max(1, Math.round(data.body.join(" ").split(" ").length / 200)),
        seriesId: cpiSeries.id,
        seriesOrder: data.order,
        categoryId: catIntegration.id,
        tags: { create: data.tags.map((slug) => ({ tagId: tagBySlug[slug].id })) },
      },
    });
    cpiArticles.push(article);
  }

  // --- Standalone articles -----------------------------------------------
  const standaloneData = [
    {
      title: "Getting Started with SAP BTP",
      slug: "getting-started-with-sap-btp",
      excerpt: "A practical first-week guide to setting up a SAP BTP trial account and understanding the core services.",
      tags: ["sap-btp"],
      categoryId: catBTP.id,
      body: [
        "SAP Business Technology Platform bundles a lot under one name — database and data management, application development, integration, and analytics.",
        "This article walks through setting up a free trial account, understanding the subaccount/space model, and deploying a first 'hello world' application to get oriented before diving into deeper topics.",
      ],
    },
    {
      title: "ABAP RESTful Application Programming Model, Explained Simply",
      slug: "abap-restful-application-programming-model-explained",
      excerpt: "Breaking down RAP — behavior definitions, projections, and why it replaced classic OData service generation.",
      tags: ["abap", "cap", "odata"],
      categoryId: catBTP.id,
      body: [
        "The ABAP RESTful Application Programming Model (RAP) is SAP's current model for building OData-based Fiori apps on top of ABAP.",
        "This article covers the core building blocks — behavior definitions, behavior implementations, and service definitions/bindings — using a small, deliberately minimal example.",
      ],
    },
    {
      title: "Building a Simple Fiori Elements List Report",
      slug: "building-a-simple-fiori-elements-list-report",
      excerpt: "Step-by-step: from a CDS view to a working Fiori Elements List Report app.",
      tags: ["fiori", "ui5", "odata"],
      categoryId: catTutorials.id,
      body: [
        "Fiori Elements lets you get a fully functional List Report and Object Page from annotations alone, without hand-writing UI5 views for the common cases.",
        "This walkthrough starts from a consumption CDS view with basic UI annotations, and ends with a running list report app in the Fiori Launchpad sandbox.",
      ],
    },
    {
      title: "Why I Started Documenting My SAP Learning Journey",
      slug: "why-i-started-documenting-my-sap-learning-journey",
      excerpt: "The reasoning behind ABAP Nusantara, and what to expect from this blog going forward.",
      tags: ["sap-btp"],
      categoryId: catJourney.id,
      body: [
        "Writing things down while learning forces a level of clarity that just reading documentation doesn't.",
        "ABAP Nusantara exists mainly for that reason — a public notebook of what I learn building on SAP BTP, shared in case it helps someone else along a similar path.",
      ],
    },
  ];

  const standaloneArticles = [];
  for (const [i, data] of standaloneData.entries()) {
    const article = await prisma.article.upsert({
      where: { slug: data.slug },
      update: {},
      create: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        contentJson: doc(data.body),
        status: ArticleStatus.PUBLISHED,
        publishedAt: new Date(Date.now() - (standaloneData.length - i) * 2 * 86400000),
        readingTimeMin: Math.max(1, Math.round(data.body.join(" ").split(" ").length / 200)),
        categoryId: data.categoryId,
        tags: { create: data.tags.map((slug) => ({ tagId: tagBySlug[slug].id })) },
      },
    });
    standaloneArticles.push(article);
  }

  // One draft, for testing the admin dashboard/draft filtering.
  await prisma.article.upsert({
    where: { slug: "draft-notes-on-event-mesh" },
    update: {},
    create: {
      title: "Draft Notes on SAP Event Mesh",
      slug: "draft-notes-on-event-mesh",
      excerpt: "Unfinished notes — not ready for publishing yet.",
      contentJson: doc(["Still researching this topic — come back later."]),
      status: ArticleStatus.DRAFT,
      categoryId: catIntegration.id,
    },
  });

  // --- Sample comments (including nested replies) --------------------------
  const firstCpiArticle = cpiArticles[0];
  const rootComment = await prisma.comment.create({
    data: {
      articleId: firstCpiArticle.id,
      authorName: "John",
      authorEmail: "john@example.com",
      body: "Great article, looking forward to the rest of the series!",
      status: CommentStatus.APPROVED,
    },
  });
  await prisma.comment.create({
    data: {
      articleId: firstCpiArticle.id,
      parentCommentId: rootComment.id,
      authorName: "ABAP Nusantara",
      authorEmail: "admin@example.com",
      body: "Thanks! Part 2 is up now.",
      status: CommentStatus.APPROVED,
    },
  });
  const sarahReply = await prisma.comment.create({
    data: {
      articleId: firstCpiArticle.id,
      parentCommentId: rootComment.id,
      authorName: "Sarah",
      authorEmail: "sarah@example.com",
      body: "This helped me too, thanks for writing it up so clearly.",
      status: CommentStatus.APPROVED,
    },
  });
  void sarahReply;

  await prisma.comment.create({
    data: {
      articleId: standaloneArticles[0].id,
      authorName: "Budi",
      authorEmail: "budi@example.com",
      body: "Awaiting moderation — this is a pending sample comment.",
      status: CommentStatus.PENDING,
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
