/**
 * Cron Endpoint for Blog Content Generation
 * 
 * POST /api/cron/generate - Trigger scheduled content generation
 * 
 * Protected by CRON_SECRET environment variable.
 * Designed for Vercel Cron or external cron services.
 */

import { NextRequest, NextResponse } from "next/server";
import { db, blogSettings, blogKeywords, blogJobRuns } from "@/lib/db";
import { eq, and, desc, count } from "drizzle-orm";
import { runGenerationPipeline } from "@/lib/blog";

// Verify cron secret
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    console.warn("CRON_SECRET not set - allowing request in development");
    return process.env.NODE_ENV === "development";
  }
  
  return authHeader === `Bearer ${cronSecret}`;
}

export async function POST(request: NextRequest) {
  // Verify secret
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
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
      return NextResponse.json({
        success: true,
        message: "Scheduled generation is disabled",
        generated: 0,
      });
    }

    const postsPerRun = config.postsPerRun || 1;

    // Check if there's already a running job
    const [runningJob] = await db
      .select()
      .from(blogJobRuns)
      .where(eq(blogJobRuns.status, "running"))
      .limit(1);

    if (runningJob) {
      return NextResponse.json({
        success: true,
        message: "A generation job is already running",
        runningJobId: runningJob.id,
        generated: 0,
      });
    }

    // Check available keywords
    const [keywordCount] = await db
      .select({ count: count() })
      .from(blogKeywords)
      .where(eq(blogKeywords.status, "pending"));

    if (!keywordCount?.count || keywordCount.count === 0) {
      return NextResponse.json({
        success: true,
        message: "No pending keywords available",
        generated: 0,
      });
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

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: failCount === 0,
      message: `Generated ${successCount} post(s), ${failCount} failed`,
      generated: successCount,
      results,
    });
  } catch (error) {
    console.error("Cron generation error:", error);
    return NextResponse.json(
      { 
        error: "Generation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Also support GET for simple health checks
export async function GET(request: NextRequest) {
  // Verify secret
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // Return stats
    const [keywordCount] = await db
      .select({ count: count() })
      .from(blogKeywords)
      .where(eq(blogKeywords.status, "pending"));

    const [scheduleConfig] = await db
      .select()
      .from(blogSettings)
      .where(eq(blogSettings.key, "schedule_config"))
      .limit(1);

    const [lastJob] = await db
      .select()
      .from(blogJobRuns)
      .orderBy(desc(blogJobRuns.createdAt))
      .limit(1);

    return NextResponse.json({
      status: "ok",
      pendingKeywords: keywordCount?.count || 0,
      scheduleEnabled: (scheduleConfig?.value as { enabled?: boolean })?.enabled || false,
      lastJobAt: lastJob?.createdAt || null,
      lastJobStatus: lastJob?.status || null,
    });
  } catch (error) {
    console.error("Cron status check error:", error);
    return NextResponse.json(
      { error: "Status check failed" },
      { status: 500 }
    );
  }
}
