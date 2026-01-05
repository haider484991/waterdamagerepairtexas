/**
 * Single Blog Post API
 * 
 * GET /api/blog/posts/[id] - Get single post
 * PUT /api/blog/posts/[id] - Update post (admin only)
 * DELETE /api/blog/posts/[id] - Delete post (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { db, blogPosts, blogPostKeywords, blogInternalLinks } from "@/lib/db";
import { eq } from "drizzle-orm";
import { processMarkdown, generateSlug, generateCanonicalUrl } from "@/lib/blog";
import { isAdmin, verifyAdmin } from "@/lib/auth/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if ID is a slug or UUID
    const isSlug = !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    
    const whereClause = isSlug 
      ? eq(blogPosts.slug, id) 
      : eq(blogPosts.id, id);

    const [post] = await db
      .select()
      .from(blogPosts)
      .where(whereClause)
      .limit(1);

    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // Check access for non-published posts
    if (post.status !== "published") {
      const userIsAdmin = await isAdmin();
      if (!userIsAdmin) {
        return NextResponse.json(
          { error: "Post not found" },
          { status: 404 }
        );
      }
    }

    // Get associated keywords
    const keywords = await db
      .select({
        keywordId: blogPostKeywords.keywordId,
        isPrimary: blogPostKeywords.isPrimary,
      })
      .from(blogPostKeywords)
      .where(eq(blogPostKeywords.postId, post.id));

    return NextResponse.json({ 
      post,
      keywords,
    });
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check
    await verifyAdmin();

    const { id } = await params;
    const body = await request.json();

    // Check post exists
    const [existing] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // Build update object
    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.title !== undefined) {
      updates.title = body.title;
    }

    if (body.contentMd !== undefined) {
      const processed = processMarkdown(body.contentMd);
      updates.contentMd = body.contentMd;
      updates.contentHtml = processed.html;
      updates.tocJson = processed.toc;
      updates.readingTime = processed.readingTime;
      updates.wordCount = processed.wordCount;
      
      if (!body.excerpt) {
        updates.excerpt = processed.excerpt;
      }
    }

    if (body.excerpt !== undefined) {
      updates.excerpt = body.excerpt;
    }

    if (body.seoTitle !== undefined) {
      updates.seoTitle = body.seoTitle;
    }

    if (body.metaDescription !== undefined) {
      updates.metaDescription = body.metaDescription;
    }

    if (body.slug !== undefined && body.slug !== existing.slug) {
      // Check for duplicate slug
      const [duplicate] = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.slug, body.slug))
        .limit(1);

      if (duplicate) {
        return NextResponse.json(
          { error: "Slug already exists" },
          { status: 400 }
        );
      }

      updates.slug = body.slug;
      updates.canonicalUrl = generateCanonicalUrl(body.slug);
    }

    if (body.coverImageUrl !== undefined) {
      updates.coverImageUrl = body.coverImageUrl;
    }

    if (body.ogImageUrl !== undefined) {
      updates.ogImageUrl = body.ogImageUrl;
    }

    if (body.coverImageAlt !== undefined) {
      updates.coverImageAlt = body.coverImageAlt;
    }

    if (body.faqJson !== undefined) {
      updates.faqJson = body.faqJson;
    }

    if (body.status !== undefined) {
      updates.status = body.status;
      
      // Set publishedAt when publishing
      if (body.status === "published" && existing.status !== "published") {
        updates.publishedAt = new Date();
      }
    }

    if (body.scheduledAt !== undefined) {
      updates.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
    }

    // Update post
    const [updated] = await db
      .update(blogPosts)
      .set(updates)
      .where(eq(blogPosts.id, id))
      .returning();

    // Update keywords if provided
    if (body.keywordIds !== undefined) {
      // Remove existing
      await db
        .delete(blogPostKeywords)
        .where(eq(blogPostKeywords.postId, id));

      // Add new
      for (let i = 0; i < body.keywordIds.length; i++) {
        await db.insert(blogPostKeywords).values({
          postId: id,
          keywordId: body.keywordIds[i],
          isPrimary: i === 0,
        });
      }
    }

    return NextResponse.json({ post: updated });
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check
    await verifyAdmin();

    const { id } = await params;

    // Check post exists
    const [existing] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // Delete associated records (cascades handle most of this)
    await db
      .delete(blogPostKeywords)
      .where(eq(blogPostKeywords.postId, id));

    await db
      .delete(blogInternalLinks)
      .where(eq(blogInternalLinks.sourcePostId, id));

    // Delete post
    await db
      .delete(blogPosts)
      .where(eq(blogPosts.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
