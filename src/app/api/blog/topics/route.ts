/**
 * Blog Topics API
 * 
 * GET /api/blog/topics - List topics (admin only)
 * POST /api/blog/topics - Generate topics for a keyword (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, blogTopics, blogKeywords, blogPosts } from "@/lib/db";
import { eq, desc, asc, and, count, sql } from "drizzle-orm";
import { createGeminiClient } from "@/lib/gemini";
import { getAIConfig } from "@/lib/blog";

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
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
    const keywordId = searchParams.get("keywordId");
    const status = searchParams.get("status");
    const sortBy = searchParams.get("sortBy") || "score";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const offset = (page - 1) * limit;

    // Build where clause
    const conditions = [];
    
    if (keywordId) {
      conditions.push(eq(blogTopics.keywordId, keywordId));
    }

    if (status && status !== "all") {
      conditions.push(eq(blogTopics.status, status as "pending" | "approved" | "rejected" | "used"));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(blogTopics)
      .where(whereClause);
    
    const total = totalResult?.count || 0;

    // Get topics
    const orderColumn = sortBy === "score" ? blogTopics.score 
      : sortBy === "title" ? blogTopics.title 
      : blogTopics.createdAt;
    
    const orderDirection = sortOrder === "asc" ? asc : desc;

    const topics = await db
      .select({
        id: blogTopics.id,
        keywordId: blogTopics.keywordId,
        title: blogTopics.title,
        angle: blogTopics.angle,
        outline: blogTopics.outline,
        score: blogTopics.score,
        status: blogTopics.status,
        createdAt: blogTopics.createdAt,
        updatedAt: blogTopics.updatedAt,
      })
      .from(blogTopics)
      .where(whereClause)
      .orderBy(orderDirection(orderColumn))
      .limit(limit)
      .offset(offset);

    // Enrich with keyword text
    const enrichedTopics = await Promise.all(
      topics.map(async (topic) => {
        const [keyword] = await db
          .select({ keyword: blogKeywords.keyword })
          .from(blogKeywords)
          .where(eq(blogKeywords.id, topic.keywordId))
          .limit(1);

        return {
          ...topic,
          keywordText: keyword?.keyword || null,
        };
      })
    );

    // Get stats
    const [statsResult] = await db
      .select({
        pending: sql<number>`count(*) filter (where ${blogTopics.status} = 'pending')`,
        approved: sql<number>`count(*) filter (where ${blogTopics.status} = 'approved')`,
        rejected: sql<number>`count(*) filter (where ${blogTopics.status} = 'rejected')`,
        used: sql<number>`count(*) filter (where ${blogTopics.status} = 'used')`,
      })
      .from(blogTopics);

    return NextResponse.json({
      topics: enrichedTopics,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + topics.length < total,
      },
      stats: {
        pending: Number(statsResult?.pending) || 0,
        approved: Number(statsResult?.approved) || 0,
        rejected: Number(statsResult?.rejected) || 0,
        used: Number(statsResult?.used) || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching topics:", error);
    return NextResponse.json(
      { error: "Failed to fetch topics" },
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
    const { keywordId, count: topicCount = 5 } = body;

    if (!keywordId) {
      return NextResponse.json(
        { error: "keywordId is required" },
        { status: 400 }
      );
    }

    // Get keyword
    const [keyword] = await db
      .select()
      .from(blogKeywords)
      .where(eq(blogKeywords.id, keywordId))
      .limit(1);

    if (!keyword) {
      return NextResponse.json(
        { error: "Keyword not found" },
        { status: 404 }
      );
    }

    // Get existing titles to avoid duplicates
    const existingPosts = await db
      .select({ title: blogPosts.title })
      .from(blogPosts)
      .limit(50);
    const existingTitles = existingPosts.map(p => p.title);

    // Generate topics using Gemini
    const aiConfig = await getAIConfig();
    const gemini = createGeminiClient(aiConfig);
    const result = await gemini.generateTopics(
      keyword.keyword,
      Math.min(topicCount, 20),
      existingTitles
    );

    // Save topics
    const createdTopics = [];
    for (const topicIdea of result.data) {
      const [created] = await db
        .insert(blogTopics)
        .values({
          keywordId: keyword.id,
          title: topicIdea.title,
          angle: topicIdea.angle,
          score: topicIdea.relevanceScore,
          status: "pending",
        })
        .returning();
      createdTopics.push(created);
    }

    return NextResponse.json({
      topics: createdTopics,
      tokenUsage: result.tokenUsage,
    }, { status: 201 });
  } catch (error) {
    console.error("Error generating topics:", error);
    return NextResponse.json(
      { error: "Failed to generate topics" },
      { status: 500 }
    );
  }
}
