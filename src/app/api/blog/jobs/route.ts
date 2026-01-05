/**
 * Blog Job Runs API
 * 
 * GET /api/blog/jobs - List job runs (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, blogJobRuns, blogKeywords, blogTopics, blogPosts } from "@/lib/db";
import { eq, desc, and, count, sql } from "drizzle-orm";

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
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    const offset = (page - 1) * limit;

    // Build where clause
    const conditions = [];
    
    if (status && status !== "all") {
      conditions.push(eq(blogJobRuns.status, status as "pending" | "running" | "completed" | "failed"));
    }

    if (type && type !== "all") {
      conditions.push(eq(blogJobRuns.type, type as typeof blogJobRuns.$inferSelect.type));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(blogJobRuns)
      .where(whereClause);
    
    const total = totalResult?.count || 0;

    // Get job runs with related data
    const jobs = await db
      .select({
        id: blogJobRuns.id,
        type: blogJobRuns.type,
        status: blogJobRuns.status,
        keywordId: blogJobRuns.keywordId,
        topicId: blogJobRuns.topicId,
        postId: blogJobRuns.postId,
        startedAt: blogJobRuns.startedAt,
        finishedAt: blogJobRuns.finishedAt,
        durationMs: blogJobRuns.durationMs,
        logs: blogJobRuns.logs,
        error: blogJobRuns.error,
        tokenUsage: blogJobRuns.tokenUsage,
        imageGenerated: blogJobRuns.imageGenerated,
        createdAt: blogJobRuns.createdAt,
      })
      .from(blogJobRuns)
      .where(whereClause)
      .orderBy(desc(blogJobRuns.createdAt))
      .limit(limit)
      .offset(offset);

    // Enrich with related entity names
    const enrichedJobs = await Promise.all(
      jobs.map(async (job) => {
        let keywordText = null;
        let topicTitle = null;
        let postTitle = null;

        if (job.keywordId) {
          const [keyword] = await db
            .select({ keyword: blogKeywords.keyword })
            .from(blogKeywords)
            .where(eq(blogKeywords.id, job.keywordId))
            .limit(1);
          keywordText = keyword?.keyword || null;
        }

        if (job.topicId) {
          const [topic] = await db
            .select({ title: blogTopics.title })
            .from(blogTopics)
            .where(eq(blogTopics.id, job.topicId))
            .limit(1);
          topicTitle = topic?.title || null;
        }

        if (job.postId) {
          const [post] = await db
            .select({ title: blogPosts.title, slug: blogPosts.slug })
            .from(blogPosts)
            .where(eq(blogPosts.id, job.postId))
            .limit(1);
          postTitle = post?.title || null;
        }

        return {
          ...job,
          keywordText,
          topicTitle,
          postTitle,
        };
      })
    );

    // Get stats using SQL aggregation
    const [statsResult] = await db
      .select({
        completed: sql<number>`count(*) filter (where ${blogJobRuns.status} = 'completed')`,
        failed: sql<number>`count(*) filter (where ${blogJobRuns.status} = 'failed')`,
        running: sql<number>`count(*) filter (where ${blogJobRuns.status} = 'running')`,
        pending: sql<number>`count(*) filter (where ${blogJobRuns.status} = 'pending')`,
      })
      .from(blogJobRuns);

    return NextResponse.json({
      jobs: enrichedJobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + jobs.length < total,
      },
      stats: {
        completed: Number(statsResult?.completed) || 0,
        failed: Number(statsResult?.failed) || 0,
        running: Number(statsResult?.running) || 0,
        pending: Number(statsResult?.pending) || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching job runs:", error);
    return NextResponse.json(
      { error: "Failed to fetch job runs" },
      { status: 500 }
    );
  }
}
