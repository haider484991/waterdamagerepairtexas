/**
 * Cron Endpoint for Blog Content Generation
 *
 * GET /api/cron/blog-generate - Trigger scheduled content generation (Vercel Cron)
 * POST /api/cron/blog-generate - Trigger scheduled content generation (manual/external)
 *
 * Protected by CRON_SECRET environment variable.
 * Designed for Vercel Cron or external cron services.
 *
 * Vercel Cron sends GET requests with Authorization header.
 */

import { NextRequest, NextResponse } from "next/server";
import { db, blogSettings, blogKeywords, blogJobRuns } from "@/lib/db";
import { eq, desc, count } from "drizzle-orm";
import { runGenerationPipeline } from "@/lib/blog";

// Verify cron secret - supports both Vercel Cron and external services
function verifyCronSecret(request: NextRequest): boolean {
  // Vercel Cron uses Authorization: Bearer <secret>
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Also check for Vercel's internal cron header (for Vercel Pro/Enterprise)
  const vercelCronHeader = request.headers.get("x-vercel-cron");

  // In development, allow requests without secret
  if (!cronSecret) {
    console.warn("CRON_SECRET not set - allowing request in development");
    return process.env.NODE_ENV === "development";
  }

  // Check Authorization header
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // Check if it's a legitimate Vercel cron request
  // Vercel sets this header for cron jobs on Pro/Enterprise plans
  if (vercelCronHeader === "true" || vercelCronHeader === "1") {
    return true;
  }

  return false;
}

// POST handler - for manual triggers or external cron services
export async function POST(request: NextRequest) {
  // Verify secret
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[Cron] Blog generation triggered via POST at", new Date().toISOString());

  try {
    const result = await runBlogGeneration();
    console.log("[Cron] Blog generation result:", result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[Cron] Generation error:", error);
    return NextResponse.json(
      {
        error: "Generation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Shared generation logic
async function runBlogGeneration() {
  // Get schedule config
  const [scheduleConfig] = await db
    .select()
    .from(blogSettings)
    .where(eq(blogSettings.key, "schedule_config"))
    .limit(1);

  const config = (scheduleConfig?.value as {
    enabled?: boolean;
    postsPerRun?: number;
  }) || {};

  // Check if scheduling is enabled
  if (!config.enabled) {
    return {
      success: true,
      message: "Scheduled generation is disabled",
      generated: 0,
    };
  }

  const postsPerRun = config.postsPerRun || 1;

  // Check if there's already a running job
  const [runningJob] = await db
    .select()
    .from(blogJobRuns)
    .where(eq(blogJobRuns.status, "running"))
    .limit(1);

  if (runningJob) {
    return {
      success: true,
      message: "A generation job is already running",
      runningJobId: runningJob.id,
      generated: 0,
    };
  }

  // Check available keywords
  const [keywordCount] = await db
    .select({ count: count() })
    .from(blogKeywords)
    .where(eq(blogKeywords.status, "pending"));

  if (!keywordCount?.count || keywordCount.count === 0) {
    return {
      success: true,
      message: "No pending keywords available",
      generated: 0,
    };
  }

  // Run generation for configured number of posts
  const results = [];

  for (let i = 0; i < postsPerRun; i++) {
    const result = await runGenerationPipeline();
    results.push({
      success: result.success,
      postId: result.postId,
      jobRunId: result.jobRunId,
      errors: result.errors,
    });

    // Stop if we fail
    if (!result.success) {
      break;
    }
  }

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  return {
    success: failCount === 0,
    message: `Generated ${successCount} post(s), ${failCount} failed`,
    generated: successCount,
    results,
  };
}

// GET handler - Vercel Cron sends GET requests
export async function GET(request: NextRequest) {
  // Check if this is a status check (no auth) or cron trigger (with auth)
  const hasAuth = request.headers.get("authorization") || request.headers.get("x-vercel-cron");

  // If no auth header, return public status (limited info)
  if (!hasAuth) {
    try {
      const [lastJob] = await db
        .select()
        .from(blogJobRuns)
        .orderBy(desc(blogJobRuns.createdAt))
        .limit(1);

      return NextResponse.json({
        status: "ok",
        lastJobAt: lastJob?.createdAt || null,
        lastJobStatus: lastJob?.status || null,
      });
    } catch (error) {
      return NextResponse.json({ status: "ok" });
    }
  }

  // Verify secret for actual cron execution
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[Cron] Blog generation triggered via GET at", new Date().toISOString());

  try {
    const result = await runBlogGeneration();
    console.log("[Cron] Blog generation result:", result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[Cron] Generation error:", error);
    return NextResponse.json(
      {
        error: "Generation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
