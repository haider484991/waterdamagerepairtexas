/**
 * Blog Posts API
 * 
 * GET /api/blog/posts - List posts (with pagination and filters)
 * POST /api/blog/posts - Create a new post (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db, blogPosts, blogPostKeywords, blogKeywords, users } from "@/lib/db";
import { eq, desc, asc, and, or, like, sql, count } from "drizzle-orm";
import { processMarkdown, generateSlug, generateCanonicalUrl } from "@/lib/blog";
import { isAdmin, verifyAdmin } from "@/lib/auth/utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50);
    const statusParam = searchParams.get("status");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "publishedAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const includeAll = searchParams.get("all") === "true"; // For admin to see all

    const offset = (page - 1) * limit;

    // Build where clause
    const conditions = [];
    
    // Check if user is admin for non-published posts
    const userIsAdmin = await isAdmin();
    
    if (!userIsAdmin || !includeAll) {
      // Non-admins or when not requesting all: only show published
      conditions.push(eq(blogPosts.status, "published"));
    } else if (statusParam && statusParam !== "all") {
      // Admin requesting specific status
      conditions.push(eq(blogPosts.status, statusParam as "draft" | "published" | "scheduled" | "archived"));
    }
    // If admin with includeAll=true and no status filter (or status=all), show everything

    if (search) {
      conditions.push(
        or(
          like(blogPosts.title, `%${search}%`),
          like(blogPosts.excerpt, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(blogPosts)
      .where(whereClause);
    
    const total = totalResult?.count || 0;

    // Get posts - use createdAt for drafts if sorting by publishedAt
    const orderColumn = sortBy === "publishedAt" ? blogPosts.createdAt // Use createdAt to include drafts
      : sortBy === "title" ? blogPosts.title 
      : sortBy === "wordCount" ? blogPosts.wordCount
      : blogPosts.createdAt;
    
    const orderDirection = sortOrder === "asc" ? asc : desc;

    const posts = await db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        excerpt: blogPosts.excerpt,
        seoTitle: blogPosts.seoTitle,
        metaDescription: blogPosts.metaDescription,
        coverImageUrl: blogPosts.coverImageUrl,
        readingTime: blogPosts.readingTime,
        wordCount: blogPosts.wordCount,
        status: blogPosts.status,
        publishedAt: blogPosts.publishedAt,
        createdAt: blogPosts.createdAt,
        updatedAt: blogPosts.updatedAt,
      })
      .from(blogPosts)
      .where(whereClause)
      .orderBy(orderDirection(orderColumn))
      .limit(limit)
      .offset(offset);

    // Get stats
    const [statsResult] = await db
      .select({
        published: sql<number>`count(*) filter (where ${blogPosts.status} = 'published')`,
        drafts: sql<number>`count(*) filter (where ${blogPosts.status} = 'draft')`,
        scheduled: sql<number>`count(*) filter (where ${blogPosts.status} = 'scheduled')`,
        archived: sql<number>`count(*) filter (where ${blogPosts.status} = 'archived')`,
      })
      .from(blogPosts);

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + posts.length < total,
      },
      stats: {
        published: Number(statsResult?.published) || 0,
        drafts: Number(statsResult?.drafts) || 0,
        scheduled: Number(statsResult?.scheduled) || 0,
        archived: Number(statsResult?.archived) || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Auth check
    await verifyAdmin();

    const body = await request.json();
    const { title, contentMd, seoTitle, metaDescription, coverImageUrl, status, publishedAt, keywordIds } = body;

    if (!title || !contentMd) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    // Process markdown
    const processed = processMarkdown(contentMd);

    // Generate slug
    const existingSlugs = await db.select({ slug: blogPosts.slug }).from(blogPosts);
    const slug = generateSlug(title, existingSlugs.map(s => s.slug));
    const canonicalUrl = generateCanonicalUrl(slug);

    // Create post
    const [post] = await db
      .insert(blogPosts)
      .values({
        title,
        slug,
        contentMd,
        contentHtml: processed.html,
        excerpt: processed.excerpt,
        seoTitle: seoTitle || title.substring(0, 60),
        metaDescription: metaDescription || processed.excerpt.substring(0, 155),
        canonicalUrl,
        coverImageUrl,
        tocJson: processed.toc,
        readingTime: processed.readingTime,
        wordCount: processed.wordCount,
        status: status || "draft",
        publishedAt: status === "published" ? new Date() : publishedAt ? new Date(publishedAt) : null,
        faqJson: [],
      })
      .returning();

    // Revalidate paths to clear cache
    try {
      revalidatePath("/blog");
      revalidatePath(`/blog/${post.slug}`);
    } catch (e) {
      console.error("Error revalidating blog paths:", e);
    }

    // Associate keywords if provided
    if (keywordIds && keywordIds.length > 0) {
      for (let i = 0; i < keywordIds.length; i++) {
        await db.insert(blogPostKeywords).values({
          postId: post.id,
          keywordId: keywordIds[i],
          isPrimary: i === 0,
        });
      }
    }

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
