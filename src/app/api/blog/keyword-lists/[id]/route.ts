/**
 * Single Keyword List API
 * 
 * GET /api/blog/keyword-lists/[id] - Get single keyword list with keywords
 * PUT /api/blog/keyword-lists/[id] - Update keyword list (admin only)
 * DELETE /api/blog/keyword-lists/[id] - Delete keyword list (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, blogKeywordLists, blogKeywords } from "@/lib/db";
import { eq, desc } from "drizzle-orm";

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

    // Get keyword list
    const [list] = await db
      .select()
      .from(blogKeywordLists)
      .where(eq(blogKeywordLists.id, id))
      .limit(1);

    if (!list) {
      return NextResponse.json(
        { error: "Keyword list not found" },
        { status: 404 }
      );
    }

    // Get keywords in this list
    const keywords = await db
      .select()
      .from(blogKeywords)
      .where(eq(blogKeywords.listId, id))
      .orderBy(desc(blogKeywords.priority), desc(blogKeywords.createdAt));

    return NextResponse.json({ 
      list,
      keywords,
    });
  } catch (error) {
    console.error("Error fetching keyword list:", error);
    return NextResponse.json(
      { error: "Failed to fetch keyword list" },
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

    // Check list exists
    const [existing] = await db
      .select()
      .from(blogKeywordLists)
      .where(eq(blogKeywordLists.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Keyword list not found" },
        { status: 404 }
      );
    }

    // Build update object
    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) {
      updates.name = body.name;
    }

    if (body.description !== undefined) {
      updates.description = body.description;
    }

    if (body.settings !== undefined) {
      updates.settings = body.settings;
    }

    if (body.isActive !== undefined) {
      updates.isActive = body.isActive;
    }

    // Update list
    const [updated] = await db
      .update(blogKeywordLists)
      .set(updates)
      .where(eq(blogKeywordLists.id, id))
      .returning();

    return NextResponse.json({ list: updated });
  } catch (error) {
    console.error("Error updating keyword list:", error);
    return NextResponse.json(
      { error: "Failed to update keyword list" },
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

    // Check list exists
    const [existing] = await db
      .select()
      .from(blogKeywordLists)
      .where(eq(blogKeywordLists.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Keyword list not found" },
        { status: 404 }
      );
    }

    // Delete list (cascades to keywords)
    await db
      .delete(blogKeywordLists)
      .where(eq(blogKeywordLists.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting keyword list:", error);
    return NextResponse.json(
      { error: "Failed to delete keyword list" },
      { status: 500 }
    );
  }
}
