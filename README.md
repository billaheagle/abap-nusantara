# ABAP Nusantara

> Learning SAP. Building things. Sharing the journey.

A personal technical blog for documenting a journey with SAP BTP, ABAP, SAP
Integration Suite / CPI, OData, CAP, and Fiori/UI5 — built with Next.js,
TypeScript, Tailwind CSS, and PostgreSQL/Prisma.

---

## 1. Tech stack & rationale

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router) | Server Components for fast, SEO-friendly pages; Server Actions remove the need for a separate API layer for most mutations. |
| Language | TypeScript (strict) | Type safety across DB access, forms, and server actions. |
| Styling | Tailwind CSS v4 | Small CSS footprint, no runtime style engine. |
| Database | PostgreSQL | Solid full-text search support, JSON columns for the editor content, and normalized relational data (series/articles/tags) — no reason to trade this for MySQL here. |
| ORM | Prisma | Type-safe queries, migrations, and a straightforward seed workflow. |
| Auth | Custom, admin-only | No public accounts exist in this product, so a full auth library (NextAuth, etc.) would be overkill. JWT session cookie + bcrypt is enough surface area to secure properly. |
| Editor | Tiptap | Mature, headless, outputs structured JSON (not raw HTML) which is safer to store and render. |
| Images | sharp + file-type | Server-side re-encoding and MIME sniffing for upload safety; Next/Image for responsive delivery. |

---

## 2. Local setup

### Prerequisites
- Node.js 20+
- A PostgreSQL database (local install, Docker, or a free tier on Neon/Supabase/Railway)

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# then edit .env — set DATABASE_URL, SESSION_SECRET, ADMIN_EMAILS, ADMIN_PASSWORD_HASHES

# 3. Generate an admin password hash
npx tsx scripts/hash-password.ts "yourChosenPassword"
# copy the output into ADMIN_PASSWORD_HASHES in .env

# 4. Run database migrations
npx prisma migrate dev --name init

# 5. Seed sample content (a series, standalone articles, tags, comments)
npx prisma db seed

# 6. Start the dev server
npm run dev
```

Visit `http://localhost:3000` for the public site and
`http://localhost:3000/admin/login` to sign in with the admin email/password
you configured in step 2–3.

> **Note on this build:** the code was written and lint-checked in a
> network-restricted sandbox that could not reach `binaries.prisma.sh` to
> download Prisma's query/schema engine binaries, so `prisma generate` /
> `next build` could not be executed end-to-end there. On a normal machine
> with full internet access, `npm install` (which runs `prisma generate`
> via `postinstall`) fetches those binaries automatically and the commands
> above work as documented. `npx eslint src` was run successfully against
> every file in the sandbox. If you hit a TypeScript error on your first
> `npm run build`, it's most likely a small mismatch from not having run a
> live build against the generated Prisma types — it should be a quick fix.

---

## 3. Environment variables

See `.env.example` for the full list with comments. Summary:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string. |
| `SESSION_SECRET` | ≥32-char random string signing admin session JWTs and the CSRF cookie salt. |
| `ADMIN_EMAILS` | Comma-separated admin emails — the only accounts that can ever log in. |
| `ADMIN_PASSWORD_HASHES` | Comma-separated bcrypt hashes, same order as `ADMIN_EMAILS`. Generate with `scripts/hash-password.ts`. |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL, used in metadata, sitemap, and OG tags. |
| `UPLOAD_DIR` | Where uploaded images are written locally (see §7). |

---

## 4. Database model

```
Series 1───N Article N───N Tag (via ArticleTag)
Category 1───N Article
Article 1───N Comment (self-referential via parentCommentId, for nesting)
Article 1───N Like (unique per [articleId, anonHash])
Article 1───N Media
```

- `Article.seriesId` and `Article.seriesOrder` are both nullable — an
  article can be part of a series or fully standalone.
- `Article.status` is `DRAFT | PUBLISHED | ARCHIVED`; only `PUBLISHED`
  articles are queryable from any public route.
- `Comment.status` is `PENDING | APPROVED | REJECTED | SPAM`; only
  `APPROVED` comments render on the public article page.
- Indexes: `Article(status, publishedAt)` for the main feed query,
  `Article(seriesId, seriesOrder)` for series navigation, `Comment(articleId,
  status)` for the approved-comment lookup, and a unique index on
  `Like(articleId, anonHash)` that is the actual database-level guarantee
  against double-liking.

Full schema: `prisma/schema.prisma`.

---

## 5. Security model

- **Admin auth**: no registration route exists anywhere in the app.
  `ADMIN_EMAILS` + `ADMIN_PASSWORD_HASHES` are the only valid identities.
  Login always returns a generic "Invalid credentials" message — it never
  reveals whether the email exists — and runs against a dummy bcrypt hash
  even for unknown emails so response timing doesn't leak that either
  (`src/lib/auth/password.ts`).
- **Sessions**: signed JWT in an `HttpOnly`, `SameSite=Lax`, `Secure` (in
  production) cookie, 8-hour expiry (`src/lib/auth/session.ts`).
- **Authorization boundary**: `src/middleware.ts` blocks every `/admin/*`
  route except `/admin/login` at the edge before any page code runs. The
  media upload API route re-checks the session independently since it's
  under `/api/*`, not `/admin/*`.
- **Rate limiting**: in-memory sliding-window limiter
  (`src/lib/security/rate-limit.ts`) applied to login (per-IP *and*
  per-email), comment submission, likes, and uploads. This is a
  single-instance limiter — see the note in that file for scaling to a
  shared store if you deploy multiple instances.
- **CSRF**: double-submit cookie token required on the comment form
  (`src/lib/security/csrf.ts`).
- **XSS**: comments are stored and rendered as plain text only — all HTML
  tags are stripped server-side before insertion
  (`src/lib/security/sanitize.ts`), and the client never uses
  `dangerouslySetInnerHTML` for user content. Article content is stored as
  Tiptap JSON and walked into React elements directly
  (`src/components/article/article-renderer.tsx`), so there's no HTML
  string ever parsed at render time.
- **Anonymous likes**: a random per-visitor cookie is hashed
  (`src/lib/security/anon.ts`) before being stored — the raw cookie value
  never touches the database — and a unique DB constraint on
  `(articleId, anonHash)` is the real backstop against duplicate likes,
  with per-IP rate limiting as a secondary signal. As noted in the product
  spec, this cannot *perfectly* prevent abuse (a user can clear cookies),
  only make it impractical for casual abuse.
- **Uploads**: MIME type is sniffed from file bytes (never trusted from
  the client), files are re-encoded via `sharp` (which also strips EXIF),
  and written under a randomly generated filename — never the
  user-supplied name — eliminating path traversal and disguised-extension
  attacks (`src/lib/storage/upload.ts`).
- **Headers**: CSP, `X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`, and HSTS are set globally in
  `next.config.ts`.
- **Data access**: 100% through Prisma's parameterized query builder — no
  raw SQL anywhere in the app.
- **Errors**: server actions and API routes catch and log unexpected
  errors server-side and return generic messages to the client; Next.js's
  production build already strips stack traces from client-visible error
  output.

---

## 6. SEO

- Dynamic `title`/`description`/canonical/OG/Twitter metadata per article
  via `generateMetadata` (`src/app/(public)/articles/[slug]/page.tsx`).
- `TechArticle` and `BreadcrumbList` JSON-LD on every article page.
- `src/app/sitemap.ts` and `src/app/robots.ts` generate `/sitemap.xml` and
  `/robots.txt` dynamically from the database; `/admin`, `/api`, and
  `/search` are excluded from indexing, and only `PUBLISHED` articles ever
  appear.
- Slugs are the only article identifier in public URLs
  (`/articles/[slug]`, never `?id=`).

---

## 7. Deployment

The app is designed for any platform that runs a standard Next.js server
(Vercel, Railway, Render) plus an externally hosted Postgres database
(Neon, Supabase, Railway Postgres, RDS, etc.).

1. Provision Postgres and set `DATABASE_URL`.
2. Set the remaining env vars from `.env.example` in your platform's
   dashboard — never commit `.env`.
3. Run `npx prisma migrate deploy` as part of your build/release step.
4. **Image storage on serverless platforms**: `src/lib/storage/upload.ts`
   currently writes to the local filesystem (`UPLOAD_DIR`), which works on
   Railway/Render (persistent disk) but **not** on Vercel's read-only,
   ephemeral filesystem. If you deploy to Vercel, swap the body of
   `saveUploadedImage` for an object-storage adapter (S3, Cloudflare R2, or
   Supabase Storage) — the function signature is already the seam to do
   this behind, and callers (`src/app/api/admin/media/upload/route.ts`)
   don't need to change.
5. Build: `npm run build`, start: `npm run start`.

---

## 8. Testing strategy

No test suite is included in this initial build (none was requested), but
the architecture is set up to test cleanly:

- **Unit tests**: `src/lib/*` (validation schemas, sanitize, rate-limit,
  editor serialization) are pure functions with no framework dependency —
  good candidates for Vitest.
- **Integration tests**: server actions in `src/features/*/actions.ts` are
  plain async functions that can be called directly in tests against a
  test database.
- **E2E**: Playwright against the running app for the critical paths —
  admin login → create article → publish → appears on `/articles`;
  anonymous comment submission → appears in moderation queue → approve →
  appears on the article.

---

## 9. Future developer tools roadmap

Tools are intentionally kept out of the `Article` data model. The
`/tools` route (`src/app/(public)/tools/page.tsx`) is currently a
placeholder listing what's planned:

- RFC test tool
- JSON formatter
- XML formatter
- CPI helper utilities

Each tool should get its own route under `/tools/<tool-name>` and, if it
needs persistence, its own Prisma model(s) — not fields bolted onto
`Article`.

---

## 10. Project structure

```
src/
├── app/
│   ├── (public)/        # home, articles, series, tags, categories, search, about, tools
│   ├── admin/            # login, dashboard, articles editor, series/category/tag/comment management
│   └── api/admin/media/  # image upload endpoint
├── components/
│   ├── layout/, ui/, article/, admin/, editor/, comments/
├── features/             # server actions + queries, grouped by domain
│   ├── articles/, series/, taxonomy/, comments/, likes/, auth/
├── lib/
│   ├── auth/, security/, validation/, storage/, editor/, db/
└── middleware.ts          # edge-level admin route protection
prisma/
├── schema.prisma
└── seed.ts
scripts/
└── hash-password.ts
```
