/**
 * Blog Keywords API
 * 
 * GET /api/blog/keywords - List keywords
 * POST /api/blog/keywords - Create new keyword(s) (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, blogKeywords, blogKeywordLists } from "@/lib/db";
import { eq, desc, asc, and, or, like, count, sql } from "drizzle-orm";

// Admin check helper
function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return (
    email === "admin@pickleballcourts.io" ||
    email.endsWith("@admin.com") ||
    email === "admin@test.com"
  );
}

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const listId = searchParams.get("listId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "priority";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const offset = (page - 1) * limit;

    // Build where clause
    const conditions = [];
    
    if (listId) {
      conditions.push(eq(blogKeywords.listId, listId));
    }

    if (status && status !== "all") {
      conditions.push(eq(blogKeywords.status, status as "pending" | "used" | "skipped" | "exhausted"));
    }

    if (search) {
      conditions.push(like(blogKeywords.keyword, `%${search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(blogKeywords)
      .where(whereClause);
    
    const total = totalResult?.count || 0;

    // Get keywords
    const orderColumn = sortBy === "priority" ? blogKeywords.priority 
      : sortBy === "keyword" ? blogKeywords.keyword 
      : sortBy === "lastUsedAt" ? blogKeywords.lastUsedAt
      : sortBy === "usageCount" ? blogKeywords.usageCount
      : blogKeywords.createdAt;
    
    const orderDirection = sortOrder === "asc" ? asc : desc;

    const keywords = await db
      .select()
      .from(blogKeywords)
      .where(whereClause)
      .orderBy(orderDirection(orderColumn))
      .limit(limit)
      .offset(offset);

    // Get stats
    const [statsResult] = await db
      .select({
        pending: sql<number>`count(*) filter (where ${blogKeywords.status} = 'pending')`,
        used: sql<number>`count(*) filter (where ${blogKeywords.status} = 'used')`,
        skipped: sql<number>`count(*) filter (where ${blogKeywords.status} = 'skipped')`,
        exhausted: sql<number>`count(*) filter (where ${blogKeywords.status} = 'exhausted')`,
      })
      .from(blogKeywords);

    return NextResponse.json({
      keywords,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + keywords.length < total,
      },
      stats: {
        pending: Number(statsResult?.pending) || 0,
        used: Number(statsResult?.used) || 0,
        skipped: Number(statsResult?.skipped) || 0,
        exhausted: Number(statsResult?.exhausted) || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching keywords:", error);
    return NextResponse.json(
      { error: "Failed to fetch keywords" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Support single keyword or array of keywords
    const keywordsData = Array.isArray(body) ? body : [body];
    
    if (keywordsData.length === 0) {
      return NextResponse.json(
        { error: "At least one keyword is required" },
        { status: 400 }
      );
    }

    // Validate first keyword has required fields
    if (!keywordsData[0].listId || !keywordsData[0].keyword) {
      return NextResponse.json(
        { error: "listId and keyword are required" },
        { status: 400 }
      );
    }

    // Verify list exists
    const [list] = await db
      .select()
      .from(blogKeywordLists)
      .where(eq(blogKeywordLists.id, keywordsData[0].listId))
      .limit(1);

    if (!list) {
      return NextResponse.json(
        { error: "Keyword list not found" },
        { status: 404 }
      );
    }

    // Create keywords
    const createdKeywords = [];
    for (const kw of keywordsData) {
      const [created] = await db
        .insert(blogKeywords)
        .values({
          listId: kw.listId || keywordsData[0].listId,
          keyword: kw.keyword.trim(),
          intent: kw.intent || "informational",
          locale: kw.locale || "en-US",
          priority: kw.priority ?? 5,
          status: "pending",
        })
        .returning();
      createdKeywords.push(created);
    }

    return NextResponse.json(
      { keywords: createdKeywords },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating keywords:", error);
    return NextResponse.json(
      { error: "Failed to create keywords" },
      { status: 500 }
    );
  }
}
