/**
 * Blog Keyword Lists API
 * 
 * GET /api/blog/keyword-lists - List all keyword lists
 * POST /api/blog/keyword-lists - Create a new keyword list (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { db, blogKeywordLists, blogKeywords } from "@/lib/db";
import { eq, desc, count } from "drizzle-orm";
import { verifyAdmin } from "@/lib/auth/utils";

export async function GET(request: NextRequest) {
  try {
    // Auth check - keyword lists are admin only
    await verifyAdmin();

    const { searchParams } = new URL(request.url);
    const includeKeywordCount = searchParams.get("includeCount") === "true";

    // Get all keyword lists
    const lists = await db
      .select()
      .from(blogKeywordLists)
      .orderBy(desc(blogKeywordLists.createdAt));

    // Optionally include keyword counts
    if (includeKeywordCount) {
      const listsWithCounts = await Promise.all(
        lists.map(async (list) => {
          const [countResult] = await db
            .select({ count: count() })
            .from(blogKeywords)
            .where(eq(blogKeywords.listId, list.id));
          
          return {
            ...list,
            keywordCount: countResult?.count || 0,
          };
        })
      );

      return NextResponse.json({ lists: listsWithCounts });
    }

    return NextResponse.json({ lists });
  } catch (error) {
    console.error("Error fetching keyword lists:", error);
    return NextResponse.json(
      { error: "Failed to fetch keyword lists" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Auth check
    await verifyAdmin();

    const body = await request.json();
    const { name, description, settings } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // Create keyword list
    const [list] = await db
      .insert(blogKeywordLists)
      .values({
        name,
        description: description || null,
        settings: settings || {},
        isActive: true,
      })
      .returning();

    return NextResponse.json({ list }, { status: 201 });
  } catch (error) {
    console.error("Error creating keyword list:", error);
    return NextResponse.json(
      { error: "Failed to create keyword list" },
      { status: 500 }
    );
  }
}
