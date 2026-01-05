/**
 * Single Job Run API
 * 
 * GET /api/blog/jobs/[id] - Get single job run with logs (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, blogJobRuns, blogKeywords, blogTopics, blogPosts } from "@/lib/db";
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

    // Get job run
    const [job] = await db
      .select()
      .from(blogJobRuns)
      .where(eq(blogJobRuns.id, id))
      .limit(1);

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Enrich with related entity names
    let keywordText = null;
    let topicTitle = null;
    let postTitle = null;
    let postSlug = null;

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
      postSlug = post?.slug || null;
    }

    return NextResponse.json({ 
      job: {
        ...job,
        keywordText,
        topicTitle,
        postTitle,
        postSlug
      }
    });
  } catch (error) {
    console.error("Error fetching job run:", error);
    return NextResponse.json(
      { error: "Failed to fetch job run" },
      { status: 500 }
    );
  }
}
