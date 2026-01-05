/**
 * Blog Content Generation API
 * 
 * POST /api/blog/generate - Trigger content generation pipeline (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { runGenerationPipeline, type GenerationConfig } from "@/lib/blog";
import { verifyAdmin } from "@/lib/auth/utils";

export async function POST(request: NextRequest) {
  try {
    // Auth check
    await verifyAdmin();

    const body = await request.json().catch(() => ({}));
    
    const { keywordId, topicId, config, background = false } = body as {
      keywordId?: string;
      topicId?: string;
      config?: Partial<GenerationConfig>;
      background?: boolean;
    };

    if (background) {
      // In background mode, we start the pipeline and return the jobRunId immediately
      return new Promise<NextResponse>((resolve) => {
        let resolved = false;
        runGenerationPipeline(keywordId, topicId, config, (jobId) => {
          if (!resolved) {
            resolved = true;
            resolve(NextResponse.json({ success: true, jobRunId: jobId }));
          }
        }).catch(err => {
          console.error("Background generation failed:", err);
          // If we already resolved with the jobId, we can't do much here
          // But if we haven't, we should reject or resolve with error
          if (!resolved) {
            resolved = true;
            resolve(NextResponse.json({ success: false, error: "Background job failed to start" }, { status: 500 }));
          }
        });
      });
    }

    // Run the generation pipeline
    const result = await runGenerationPipeline(keywordId, topicId, config);

    if (result.success) {
      return NextResponse.json({
        success: true,
        postId: result.postId,
        post: result.post,
        jobRunId: result.jobRunId,
        warnings: result.warnings,
        qualityReport: result.qualityReport,
        tokenUsage: result.tokenUsage,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          jobRunId: result.jobRunId,
          errors: result.errors,
          warnings: result.warnings,
          tokenUsage: result.tokenUsage,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in generation pipeline:", error);
    return NextResponse.json(
      { 
        error: "Generation pipeline failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
