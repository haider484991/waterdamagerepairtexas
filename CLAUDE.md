# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Water Damage Repair Directory — a full-stack Next.js business directory for water damage repair services across the USA. Features Google Places API integration, AI-powered blog generation via Gemini, hybrid data fetching (local DB + Google Places enrichment), and Supabase image storage.

**Production URL:** https://www.waterdamagerepair.io

## Commands

```bash
npm run dev              # Start dev server (next dev)
npm run build            # Production build
npm run start            # Start production server
npm run lint             # ESLint

npm run db:generate      # Generate Drizzle migrations
npm run db:migrate       # Run Drizzle migrations
npm run db:push          # Push schema directly to database
npm run db:studio        # Open Drizzle Studio GUI
npm run db:seed          # Seed database (npx tsx src/lib/db/seed.ts)
```

No test framework is configured.

## Tech Stack

- **Next.js 16** (App Router, Server Components) + **React 19** + **TypeScript**
- **Neon PostgreSQL** with **Drizzle ORM** (`@neondatabase/serverless`)
- **NextAuth.js v5** (beta.30) — credentials provider, JWT sessions, role-based (admin/user)
- **Tailwind CSS 4** + **shadcn/ui** (new-york style) + **Framer Motion**
- **Google Places/Maps API** for business data enrichment
- **Google Gemini API** for blog content generation
- **Supabase Storage** for persistent image caching
- **React Hook Form** + **Zod** for form validation
- **TipTap** for rich text editing (blog admin)
- **Nodemailer** (Gmail SMTP) for emails

## Architecture

### Routing & Layout
- App Router with route groups: `(auth)` for login/register, `(dashboard)` for protected user pages
- `/admin/*` routes require `role === "admin"` — checked via NextAuth authorized callback
- `/dashboard/*` routes require any authenticated user
- Path alias: `@/*` maps to `./src/*`

### Database
- **Active schema:** `src/lib/db/wd-schema.ts` — all tables use `wd_` prefix
- **Legacy schema:** `src/lib/db/schema.ts` — old pickleball tables, not actively used
- **Drizzle config** (`drizzle.config.ts`) currently points to `schema.ts` — the active water damage schema is `wd-schema.ts`
- Core tables: `wd_businesses`, `wd_categories`, `wd_users`, `wd_reviews`, `wd_favorites`, `wd_business_claims`, `wd_states`, `wd_cities`, `wd_sync_jobs`
- Blog tables: `wd_blog_posts`, `wd_blog_keywords`, `wd_blog_keyword_lists`, `wd_blog_topics`, `wd_blog_settings`

### Hybrid Data Fetching (`src/lib/hybrid-data.ts`)
Business listings are fetched from the local DB and enriched on-demand with Google Places API data (photos, reviews, hours). Results are cached in the database (7-day expiry) and in-memory (30-minute expiry) to minimize API calls.

### Blog Generation Pipeline (`src/lib/blog/generator.ts`)
Keyword selection → topic generation → outline → full article via Gemini → SEO processing → internal link insertion → quality gates → save as draft. Supporting modules: `quality-gates.ts`, `seo-processor.ts`, `internal-linker.ts`.

### Dynamic Content (`src/lib/content-generator.ts`)
Business detail pages use Gemini to generate descriptions, amenities, and tips. Results are cached in the database. Served via `/api/businesses/[slug]/content`.

### Google Places Sync
- Single category sync: `/api/admin/sync-categories`
- Multi-location batch sync: `/api/admin/sync-multi-location`
- Progress tracked in `wd_sync_jobs` table

### SEO
- Schema.org structured data via `src/components/seo/JsonLd.tsx` (LocalBusiness, Organization, WebSite, FAQ, BreadcrumbList)
- Dynamic sitemap at `src/app/sitemap.ts`
- `public/llms.txt` for AI assistant discovery
- `next-seo` for metadata generation

## Key Conventions

- shadcn/ui components live in `src/components/ui/` — add new ones via `npx shadcn@latest add <component>`
- Business-related components in `src/components/business/`, layout in `src/components/layout/`
- API routes follow REST patterns in `src/app/api/`
- Environment variables: copy `env.example` to `.env.local` — server-side Google key is `GOOGLE_PLACES_API_KEY`, client-side is `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- The project evolved from a Plano, TX pickleball directory to a national water damage repair directory — some legacy references (README, old schema) remain
