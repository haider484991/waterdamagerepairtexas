/**
 * Single Topic API
 * 
 * GET /api/blog/topics/[id] - Get single topic
 * PUT /api/blog/topics/[id] - Update topic (admin only)
 * DELETE /api/blog/topics/[id] - Delete topic (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, blogTopics, blogKeywords, blogPosts } from "@/lib/db";
import { eq } from "drizzle-orm";

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

    // Get topic
    const [topic] = await db
      .select()
      .from(blogTopics)
      .where(eq(blogTopics.id, id))
      .limit(1);

    if (!topic) {
      return NextResponse.json(
        { error: "Topic not found" },
        { status: 404 }
      );
    }

    // Get keyword
    const [keyword] = await db
      .select()
      .from(blogKeywords)
      .where(eq(blogKeywords.id, topic.keywordId))
      .limit(1);

    // Get associated posts
    const posts = await db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        status: blogPosts.status,
      })
      .from(blogPosts)
      .where(eq(blogPosts.topicId, id));

    return NextResponse.json({ 
      topic,
      keyword,
      posts,
    });
  } catch (error) {
    console.error("Error fetching topic:", error);
    return NextResponse.json(
      { error: "Failed to fetch topic" },
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

    // Check topic exists
    const [existing] = await db
      .select()
      .from(blogTopics)
      .where(eq(blogTopics.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Topic not found" },
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

    if (body.angle !== undefined) {
      updates.angle = body.angle;
    }

    if (body.outline !== undefined) {
      updates.outline = body.outline;
    }

    if (body.score !== undefined) {
      updates.score = body.score;
    }

    if (body.status !== undefined) {
      updates.status = body.status;
    }

    // Update topic
    const [updated] = await db
      .update(blogTopics)
      .set(updates)
      .where(eq(blogTopics.id, id))
      .returning();

    return NextResponse.json({ topic: updated });
  } catch (error) {
    console.error("Error updating topic:", error);
    return NextResponse.json(
      { error: "Failed to update topic" },
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

    // Check topic exists
    const [existing] = await db
      .select()
      .from(blogTopics)
      .where(eq(blogTopics.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Topic not found" },
        { status: 404 }
      );
    }

    // Delete topic
    await db
      .delete(blogTopics)
      .where(eq(blogTopics.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting topic:", error);
    return NextResponse.json(
      { error: "Failed to delete topic" },
      { status: 500 }
    );
  }
}
