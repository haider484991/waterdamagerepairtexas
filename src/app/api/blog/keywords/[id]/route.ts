/**
 * Single Keyword API
 * 
 * GET /api/blog/keywords/[id] - Get single keyword
 * PUT /api/blog/keywords/[id] - Update keyword (admin only)
 * DELETE /api/blog/keywords/[id] - Delete keyword (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, blogKeywords, blogTopics, blogPostKeywords } from "@/lib/db";
import { eq, count } from "drizzle-orm";

// Admin check helper
function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return (
    email === "admin@pickleballcourts.io" ||
    email.endsWith("@admin.com") ||
    email === "admin@test.com"
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Get keyword
    const [keyword] = await db
      .select()
      .from(blogKeywords)
      .where(eq(blogKeywords.id, id))
      .limit(1);

    if (!keyword) {
      return NextResponse.json(
        { error: "Keyword not found" },
        { status: 404 }
      );
    }

    // Get topic count
    const [topicCount] = await db
      .select({ count: count() })
      .from(blogTopics)
      .where(eq(blogTopics.keywordId, id));

    // Get post count
    const [postCount] = await db
      .select({ count: count() })
      .from(blogPostKeywords)
      .where(eq(blogPostKeywords.keywordId, id));

    return NextResponse.json({ 
      keyword,
      stats: {
        topicCount: topicCount?.count || 0,
        postCount: postCount?.count || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching keyword:", error);
    return NextResponse.json(
      { error: "Failed to fetch keyword" },
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
    const session = await auth();
    if (!session?.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Check keyword exists
    const [existing] = await db
      .select()
      .from(blogKeywords)
      .where(eq(blogKeywords.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Keyword not found" },
        { status: 404 }
      );
    }

    // Build update object
    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.keyword !== undefined) {
      updates.keyword = body.keyword.trim();
    }

    if (body.intent !== undefined) {
      updates.intent = body.intent;
    }

    if (body.locale !== undefined) {
      updates.locale = body.locale;
    }

    if (body.priority !== undefined) {
      updates.priority = body.priority;
    }

    if (body.status !== undefined) {
      updates.status = body.status;
    }

    if (body.listId !== undefined) {
      updates.listId = body.listId;
    }

    // Update keyword
    const [updated] = await db
      .update(blogKeywords)
      .set(updates)
      .where(eq(blogKeywords.id, id))
      .returning();

    return NextResponse.json({ keyword: updated });
  } catch (error) {
    console.error("Error updating keyword:", error);
    return NextResponse.json(
      { error: "Failed to update keyword" },
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
    const session = await auth();
    if (!session?.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check keyword exists
    const [existing] = await db
      .select()
      .from(blogKeywords)
      .where(eq(blogKeywords.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Keyword not found" },
        { status: 404 }
      );
    }

    // Delete keyword (cascades to topics and post_keywords)
    await db
      .delete(blogKeywords)
      .where(eq(blogKeywords.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting keyword:", error);
    return NextResponse.json(
      { error: "Failed to delete keyword" },
      { status: 500 }
    );
  }
}
