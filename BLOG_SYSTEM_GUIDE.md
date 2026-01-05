# Automated Blog System

A fully automated, SEO-optimized blogging system built with Next.js, Neon Postgres, and Gemini AI.

## Overview

This system provides end-to-end automated blog content generation:

1. **Keyword Management** - Organize and prioritize target keywords
2. **Topic Generation** - AI-generated topic clusters with outlines
3. **Article Generation** - Full article creation with SEO optimization
4. **Auto-publishing** - Scheduled content publishing with quality gates
5. **SEO Features** - JSON-LD schema, OpenGraph, sitemap integration

## Setup

### Environment Variables

Add these to your `.env` file:

```env
# Required: Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Database (already configured)
DATABASE_URL=your_neon_postgres_url

# Cron Secret (for Vercel Cron)
CRON_SECRET=your_random_secret_32_chars
```

### Getting a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Click "Get API Key"
3. Create a new API key or use an existing one
4. Copy the key to your `.env` file

### Database Migration

The blog tables are automatically created with Drizzle:

```bash
npm run db:generate
npm run db:push
```

### Vercel Cron Setup

The `vercel.json` file configures automated content generation:

```json
{
  "crons": [
    {
      "path": "/api/cron/generate",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

This runs the generation pipeline every 6 hours. Adjust as needed:

- `0 * * * *` - Every hour
- `0 */6 * * *` - Every 6 hours
- `0 0 * * *` - Daily at midnight
- `0 0 */2 * *` - Every 2 days

## Usage

### Admin Panel

Access the blog admin at `/admin/blog`:

- **Dashboard** - Overview of posts, keywords, topics, and jobs
- **Keywords** - Manage keyword lists and individual keywords
- **Topics** - Generate and approve topic ideas
- **Posts** - View, edit, and publish articles
- **Jobs** - Monitor automation job history
- **Settings** - Configure automation and AI parameters

### Workflow

#### Manual Generation

1. Add keywords in **Keywords** page
2. Generate topics in **Topics** page
3. Approve topics you want to write about
4. Click "Generate Article" on approved topics
5. Review and publish in **Posts** page

#### Automated Generation

1. Configure settings in **Settings** page
2. Enable "Auto-publish" if desired
3. Add keywords to the system
4. The cron job will:
   - Pick a pending keyword
   - Generate topic ideas
   - Create a full article
   - Apply SEO optimization
   - Publish (if auto-publish enabled)

### API Endpoints

#### Public

- `GET /api/blog/posts` - List published posts
- `GET /api/blog/posts/[id]` - Get single post

#### Admin (Protected)

- `GET/POST /api/blog/keyword-lists` - Manage keyword lists
- `GET/POST /api/blog/keywords` - Manage keywords
- `GET/POST /api/blog/topics` - Manage topics
- `POST /api/blog/generate` - Trigger generation
- `GET/PUT /api/blog/settings` - Manage settings
- `GET /api/blog/jobs` - View job history

#### Cron

- `GET /api/cron/generate` - Automated generation trigger

## SEO Features

### Per-Post SEO

Each generated article includes:

- **SEO Title** - Optimized for search (≤60 chars)
- **Meta Description** - Compelling summary (≤160 chars)
- **Clean Slug** - URL-friendly permalink
- **Canonical URL** - Prevent duplicate content
- **Heading Hierarchy** - Proper H1/H2/H3 structure
- **Table of Contents** - Auto-generated from headings
- **FAQ Section** - 3-6 questions with FAQPage schema
- **Article Schema** - JSON-LD for rich snippets
- **Internal Links** - 3-7 contextual links to other posts
- **Reading Time** - Estimated read duration

### Site-wide SEO

- **Dynamic Sitemap** - `/sitemap.xml` includes all blog posts
- **RSS Feed** - `/rss.xml` for syndication
- **Robots.txt** - Properly configured for crawlers
- **OpenGraph** - Social sharing metadata
- **Twitter Cards** - Enhanced Twitter previews

## Content Quality

### Quality Gates

Before publishing, posts must pass:

1. **SEO Completeness** - Title, description, schema present
2. **Heading Structure** - Proper hierarchy (H1 → H2 → H3)
3. **Keyword Usage** - Natural keyword integration (2-5%)
4. **Length Requirements** - 1200-2500 words (configurable)
5. **Duplication Check** - No duplicate slugs/titles
6. **Spam Detection** - No keyword stuffing

### Helpful Content Guidelines

The system is designed to create valuable content:

- Focus on user intent, not just keywords
- Include practical examples and steps
- Avoid thin content (minimum 1200 words)
- No medical/legal claims without qualification
- Natural language, not keyword-stuffed text

## Database Schema

### Key Tables

- `blog_keyword_lists` - Organize keywords by theme
- `blog_keywords` - Individual target keywords
- `blog_topics` - Generated topic ideas
- `blog_posts` - Published articles
- `blog_post_keywords` - Post-keyword relationships
- `blog_internal_links` - Track internal linking
- `blog_job_runs` - Automation logs
- `blog_settings` - Configuration storage

## Troubleshooting

### Generation Failed

Check the **Jobs** page for error details. Common issues:

- **Rate Limited** - Gemini API quota exceeded
- **Invalid API Key** - Check GEMINI_API_KEY
- **No Keywords** - Add keywords before generating

### Posts Not Appearing

- Verify post status is "published"
- Check `publishedAt` date is set
- Clear Next.js cache: `npm run dev -- --force`

### Cron Not Running

- Verify `CRON_SECRET` is set
- Check Vercel deployment logs
- Test manually: `curl -H "Authorization: Bearer $CRON_SECRET" https://yoursite.com/api/cron/generate`

## Configuration Options

### Settings Page Options

| Setting | Description | Default |
|---------|-------------|---------|
| Auto-publish | Publish immediately after generation | Off |
| Schedule Frequency | How often to generate | Daily |
| Writing Style | Tone of content | Conversational |
| Brand Voice | AI personality guidance | Pickleball enthusiast |
| Word Count | Target article length | 1500-2500 |
| Internal Links | Links per article | 3-7 |
| FAQ Count | Questions per article | 3-6 |
| Gemini Model | AI model to use | gemini-2.0-flash |
| Temperature | AI creativity level | 0.7 |

## File Structure

```
src/
├── app/
│   ├── admin/
│   │   └── blog/
│   │       ├── page.tsx        # Dashboard
│   │       ├── keywords/       # Keyword manager
│   │       ├── topics/         # Topic generator
│   │       ├── posts/          # Post manager
│   │       ├── jobs/           # Job history
│   │       └── settings/       # Configuration
│   ├── api/
│   │   ├── blog/               # Blog API routes
│   │   │   ├── keyword-lists/
│   │   │   ├── keywords/
│   │   │   ├── topics/
│   │   │   ├── posts/
│   │   │   ├── generate/
│   │   │   ├── settings/
│   │   │   └── jobs/
│   │   └── cron/
│   │       └── generate/       # Automated trigger
│   ├── blog/
│   │   ├── page.tsx            # Blog listing
│   │   └── [slug]/
│   │       └── page.tsx        # Individual post
│   └── rss.xml/
│       └── route.ts            # RSS feed
├── lib/
│   ├── blog/
│   │   ├── generator.ts        # Content pipeline
│   │   ├── seo-processor.ts    # SEO optimization
│   │   ├── internal-linker.ts  # Link insertion
│   │   ├── quality-gates.ts    # Content validation
│   │   └── markdown.ts         # Rendering
│   └── gemini/
│       └── index.ts            # AI client
└── lib/db/
    └── schema.ts               # Drizzle schema
```

## Support

For issues or questions:

1. Check the **Jobs** page for error logs
2. Review this documentation
3. Check Vercel deployment logs
4. Open an issue on GitHub

## License

This blog system is part of the Pickleball Courts project.
