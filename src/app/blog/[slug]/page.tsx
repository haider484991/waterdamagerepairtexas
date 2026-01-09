/**
 * Blog Post Page
 * 
 * Individual blog post with full SEO, schema markup, TOC, FAQs
 */

import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db, blogPosts, blogPostKeywords, blogKeywords, blogInternalLinks } from "@/lib/db";
import { eq, desc, ne, and, sql, notInArray } from "drizzle-orm";
import { getSiteUrl } from "@/lib/site-url";
import { generateBlogPostSchema } from "@/lib/blog";
import { ShareButton } from "@/components/blog/ShareButton";
import { Clock, Calendar, ChevronLeft, Bookmark, ChevronRight } from "lucide-react";

const SITE_URL = getSiteUrl();

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

// Generate static params for published posts
export async function generateStaticParams() {
  const posts = await db
    .select({ slug: blogPosts.slug })
    .from(blogPosts)
    .where(eq(blogPosts.status, "published"))
    .limit(100);

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;

  const [post] = await db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, "published")))
    .limit(1);

  if (!post) {
    return {
      title: "Post Not Found | Water Damage Repair Texas",
    };
  }

  const title = post.seoTitle || post.title;
  const description = post.metaDescription || post.excerpt || "";
  const canonicalUrl = post.canonicalUrl || `${SITE_URL}/blog/${post.slug}`;
  const ogImage = post.ogImageUrl || post.coverImageUrl || `${SITE_URL}/water-damage-logo.png`;

  return {
    title: `${title} | Water Damage Repair Texas`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "article",
      siteName: "Water Damage Repair Texas",
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt?.toISOString(),
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: post.coverImageAlt || post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;

  // Get post
  const [post] = await db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, "published")))
    .limit(1);

  if (!post) {
    notFound();
  }

  // Get related posts via internal links
  const internalLinks = await db
    .select({
      targetId: blogPosts.id, // Need ID to exclude from next query
      targetSlug: blogPosts.slug,
      targetTitle: blogPosts.title,
    })
    .from(blogInternalLinks)
    .innerJoin(blogPosts, eq(blogInternalLinks.targetPostId, blogPosts.id))
    .where(eq(blogInternalLinks.sourcePostId, post.id))
    .limit(4);

  // Get more related posts if needed
  let relatedPosts = internalLinks;
  if (relatedPosts.length < 4) {
    const excludedIds = [post.id, ...internalLinks.map(link => link.targetId)];

    const moreRelated = await db
      .select({
        targetId: blogPosts.id,
        targetSlug: blogPosts.slug,
        targetTitle: blogPosts.title,
      })
      .from(blogPosts)
      .where(
        and(
          eq(blogPosts.status, "published"),
          notInArray(blogPosts.id, excludedIds)
        )
      )
      .orderBy(desc(blogPosts.publishedAt))
      .limit(4 - relatedPosts.length);

    relatedPosts = [...relatedPosts, ...moreRelated];
  }

  // Get prev/next posts for navigation
  const [prevPost] = await db
    .select({ slug: blogPosts.slug, title: blogPosts.title })
    .from(blogPosts)
    .where(
      and(
        eq(blogPosts.status, "published"),
        post.publishedAt ? eq(blogPosts.publishedAt, post.publishedAt) : undefined
      )
    )
    .orderBy(desc(blogPosts.publishedAt))
    .limit(1);

  const [nextPost] = await db
    .select({ slug: blogPosts.slug, title: blogPosts.title })
    .from(blogPosts)
    .where(eq(blogPosts.status, "published"))
    .orderBy(blogPosts.publishedAt)
    .limit(1);

  // Generate JSON-LD schemas
  const schemas = generateBlogPostSchema({
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || "",
    publishedAt: post.publishedAt || post.createdAt,
    updatedAt: post.updatedAt,
    coverImageUrl: post.coverImageUrl || undefined,
    wordCount: post.wordCount || undefined,
    faqs: (post.faqJson as Array<{ question: string; answer: string }>) || undefined,
  });

  const toc = (post.tocJson as Array<{ id: string; text: string; level: number }>) || [];
  const faqs = (post.faqJson as Array<{ question: string; answer: string }>) || [];

  return (
    <>
      {/* JSON-LD Schemas */}
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <article className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        {/* Breadcrumb */}
        <nav className="container mx-auto px-4 pt-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-muted-foreground">
            <li>
              <Link href="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
            </li>
            <ChevronRight className="w-4 h-4" />
            <li>
              <Link href="/blog" className="hover:text-foreground transition-colors">
                Blog
              </Link>
            </li>
            <ChevronRight className="w-4 h-4" />
            <li className="text-foreground font-medium truncate max-w-[200px]">
              {post.title}
            </li>
          </ol>
        </nav>

        {/* Header */}
        <header className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-8">
              {post.publishedAt && (
                <span className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <time dateTime={post.publishedAt.toISOString()}>
                    {new Date(post.publishedAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </time>
                </span>
              )}
              {post.readingTime && (
                <span className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  {post.readingTime} min read
                </span>
              )}
              {post.wordCount && (
                <span className="text-sm">
                  {post.wordCount.toLocaleString()} words
                </span>
              )}
            </div>

            {/* Cover Image */}
            {post.coverImageUrl && (
              <div className="rounded-2xl overflow-hidden mb-8 shadow-lg">
                <img
                  src={post.coverImageUrl}
                  alt={post.coverImageAlt || post.title}
                  className="w-full aspect-[2/1] object-cover"
                />
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 pb-16">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Table of Contents (sidebar on desktop) */}
              {toc.length > 0 && (
                <aside className="lg:w-64 lg:flex-shrink-0">
                  <div className="lg:sticky lg:top-24">
                    <nav className="p-6 bg-card rounded-xl border border-border">
                      <h2 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">
                        Table of Contents
                      </h2>
                      <ul className="space-y-2 text-sm">
                        {toc.map((item) => (
                          <li
                            key={item.id}
                            style={{ paddingLeft: `${(item.level - 2) * 12}px` }}
                          >
                            <a
                              href={`#${item.id}`}
                              className="text-muted-foreground hover:text-foreground transition-colors block py-1"
                            >
                              {item.text}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </nav>
                  </div>
                </aside>
              )}

              {/* Article Content */}
              <div className="flex-1 min-w-0">
                <div
                  className="prose prose-lg dark:prose-invert max-w-none
                    prose-headings:scroll-mt-24 
                    prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                    prose-blockquote:border-l-blue-500 prose-blockquote:bg-muted/30
                    prose-img:rounded-xl prose-img:shadow-lg
                    prose-pre:bg-muted prose-pre:border prose-pre:border-border"
                  dangerouslySetInnerHTML={{ __html: post.contentHtml || "" }}
                />

                {/* FAQ Section */}
                {faqs.length > 0 && (
                  <section className="mt-16 pt-8 border-t border-border">
                    <h2 className="text-2xl font-bold mb-8">
                      Frequently Asked Questions
                    </h2>
                    <div className="space-y-6">
                      {faqs.map((faq, index) => (
                        <div
                          key={index}
                          className="p-6 bg-card rounded-xl border border-border"
                        >
                          <h3 className="text-lg font-semibold mb-3">
                            {faq.question}
                          </h3>
                          <p className="text-muted-foreground leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Share & Save */}
                <div className="flex items-center gap-4 mt-12 pt-8 border-t border-border">
                  <span className="text-sm font-medium text-muted-foreground">Share:</span>
                  <ShareButton
                    title={post.title}
                    url={`${SITE_URL}/blog/${post.slug}`}
                  />
                </div>

                {/* Related Posts */}
                {relatedPosts.length > 0 && (
                  <section className="mt-16 pt-8 border-t border-border">
                    <h2 className="text-2xl font-bold mb-8">Related Articles</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {relatedPosts.map((related) => (
                        <Link
                          key={related.targetSlug}
                          href={`/blog/${related.targetSlug}`}
                          className="p-4 bg-card rounded-xl border border-border hover:border-blue-500/50 transition-colors group"
                        >
                          <h3 className="font-medium group-hover:text-blue-600 transition-colors line-clamp-2">
                            {related.targetTitle}
                          </h3>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {/* Post Navigation */}
                <nav className="mt-12 pt-8 border-t border-border">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <Link
                      href="/blog"
                      className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                      Back to Blog
                    </Link>
                  </div>
                </nav>

                {/* Last Updated */}
                {post.updatedAt && post.publishedAt && post.updatedAt > post.publishedAt && (
                  <p className="mt-8 text-sm text-muted-foreground italic">
                    Last updated:{" "}
                    {new Date(post.updatedAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </article>
    </>
  );
}
