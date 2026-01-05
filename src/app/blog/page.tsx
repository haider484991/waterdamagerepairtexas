/**
 * Blog Listing Page
 * 
 * Public page displaying all published blog posts with pagination
 */

import { Metadata } from "next";
import Link from "next/link";
import { db, blogPosts } from "@/lib/db";
import { eq, desc, count, sql } from "drizzle-orm";
import { getSiteUrl } from "@/lib/site-url";
import { Clock, Calendar, ArrowRight, BookOpen } from "lucide-react";

const SITE_URL = getSiteUrl();
const POSTS_PER_PAGE = 12;

interface BlogPageProps {
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Pickleball Blog | Tips, Guides & News | PickleballCourts.io",
    description: "Explore our pickleball blog for expert tips, court guides, equipment reviews, and the latest news. Everything you need to improve your game and find great places to play.",
    alternates: {
      canonical: `${SITE_URL}/blog`,
    },
    openGraph: {
      title: "Pickleball Blog | Tips, Guides & News",
      description: "Expert tips, court guides, equipment reviews, and the latest pickleball news.",
      url: `${SITE_URL}/blog`,
      type: "website",
      siteName: "PickleballCourts.io",
      images: [
        {
          url: `${SITE_URL}/pickleball-logo.png`,
          width: 1200,
          height: 630,
          alt: "PickleballCourts.io Blog",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Pickleball Blog | PickleballCourts.io",
      description: "Expert tips, court guides, equipment reviews, and the latest pickleball news.",
    },
  };
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const currentPage = parseInt(params.page || "1", 10);
  const offset = (currentPage - 1) * POSTS_PER_PAGE;

  // Get total count
  const [totalResult] = await db
    .select({ count: count() })
    .from(blogPosts)
    .where(eq(blogPosts.status, "published"));
  
  const total = totalResult?.count || 0;
  const totalPages = Math.ceil(total / POSTS_PER_PAGE);

  // Get posts
  const posts = await db
    .select({
      id: blogPosts.id,
      title: blogPosts.title,
      slug: blogPosts.slug,
      excerpt: blogPosts.excerpt,
      coverImageUrl: blogPosts.coverImageUrl,
      coverImageAlt: blogPosts.coverImageAlt,
      readingTime: blogPosts.readingTime,
      publishedAt: blogPosts.publishedAt,
    })
    .from(blogPosts)
    .where(eq(blogPosts.status, "published"))
    .orderBy(desc(blogPosts.publishedAt))
    .limit(POSTS_PER_PAGE)
    .offset(offset);

  // JSON-LD for blog listing
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "PickleballCourts.io Blog",
    description: "Expert tips, guides, and news for pickleball enthusiasts",
    url: `${SITE_URL}/blog`,
    publisher: {
      "@type": "Organization",
      name: "PickleballCourts.io",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/pickleball-logo.png`,
      },
    },
    blogPost: posts.map(post => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: `${SITE_URL}/blog/${post.slug}`,
      datePublished: post.publishedAt?.toISOString(),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-green-500/5" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-amber-600 to-green-600 bg-clip-text text-transparent">
                Pickleball Blog
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                Expert tips, court guides, equipment reviews, and everything you need 
                to improve your game and find great places to play.
              </p>
            </div>
          </div>
        </section>

        {/* Posts Grid */}
        <section className="container mx-auto px-4 pb-16">
          {posts.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h2 className="text-2xl font-semibold mb-2">No Posts Yet</h2>
              <p className="text-muted-foreground">
                Check back soon for new pickleball content!
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((post, index) => (
                  <article
                    key={post.id}
                    className={`group relative bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-lg transition-all duration-300 ${
                      index === 0 ? "md:col-span-2 lg:col-span-1" : ""
                    }`}
                  >
                    {/* Image */}
                    <Link href={`/blog/${post.slug}`} className="block">
                      <div className="aspect-[16/9] bg-muted relative overflow-hidden">
                        {post.coverImageUrl ? (
                          <img
                            src={post.coverImageUrl}
                            alt={post.coverImageAlt || post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading={index < 3 ? "eager" : "lazy"}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-green-100 dark:from-amber-900/20 dark:to-green-900/20">
                            <BookOpen className="w-12 h-12 text-amber-600/50" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>

                    {/* Content */}
                    <div className="p-6">
                      <Link href={`/blog/${post.slug}`}>
                        <h2 className="text-xl font-semibold mb-3 group-hover:text-amber-600 transition-colors line-clamp-2">
                          {post.title}
                        </h2>
                      </Link>
                      
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                          {post.publishedAt && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(post.publishedAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          )}
                          {post.readingTime && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {post.readingTime} min read
                            </span>
                          )}
                        </div>
                      </div>

                      <Link
                        href={`/blog/${post.slug}`}
                        className="inline-flex items-center gap-1 mt-4 text-amber-600 hover:text-amber-700 font-medium text-sm group/link"
                      >
                        Read more
                        <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav className="flex justify-center items-center gap-2 mt-12" aria-label="Pagination">
                  {currentPage > 1 && (
                    <Link
                      href={`/blog?page=${currentPage - 1}`}
                      className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                    >
                      Previous
                    </Link>
                  )}
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        // Show first, last, current, and adjacent pages
                        return (
                          page === 1 ||
                          page === totalPages ||
                          Math.abs(page - currentPage) <= 1
                        );
                      })
                      .map((page, index, array) => {
                        // Add ellipsis
                        const prevPage = array[index - 1];
                        const showEllipsis = prevPage && page - prevPage > 1;
                        
                        return (
                          <span key={page} className="flex items-center gap-1">
                            {showEllipsis && (
                              <span className="px-2 text-muted-foreground">...</span>
                            )}
                            <Link
                              href={`/blog?page=${page}`}
                              className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                                page === currentPage
                                  ? "bg-amber-600 text-white"
                                  : "bg-muted hover:bg-muted/80"
                              }`}
                              aria-current={page === currentPage ? "page" : undefined}
                            >
                              {page}
                            </Link>
                          </span>
                        );
                      })}
                  </div>

                  {currentPage < totalPages && (
                    <Link
                      href={`/blog?page=${currentPage + 1}`}
                      className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                    >
                      Next
                    </Link>
                  )}
                </nav>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}
