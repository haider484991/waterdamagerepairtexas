import { NextResponse } from "next/server";
import { db, syncJobs, businesses, categories } from "@/lib/db";
import { eq, desc, sql } from "drizzle-orm";

export async function GET() {
  try {
    // Get current/latest sync job
    const [currentJob] = await db
      .select()
      .from(syncJobs)
      .orderBy(desc(syncJobs.createdAt))
      .limit(1);

    // Get recent sync history (last 10 jobs)
    const recentJobs = await db
      .select()
      .from(syncJobs)
      .orderBy(desc(syncJobs.createdAt))
      .limit(10);

    // Get business counts by state
    const businessCountsByState = await db
      .select({
        state: businesses.state,
        count: sql<number>`count(*)`,
      })
      .from(businesses)
      .groupBy(businesses.state)
      .orderBy(desc(sql<number>`count(*)`));

    // Get business counts by category
    const businessCountsByCategory = await db
      .select({
        categoryId: businesses.categoryId,
        categoryName: categories.name,
        categorySlug: categories.slug,
        count: sql<number>`count(*)`,
      })
      .from(businesses)
      .leftJoin(categories, eq(businesses.categoryId, categories.id))
      .groupBy(businesses.categoryId, categories.name, categories.slug)
      .orderBy(desc(sql<number>`count(*)`));

    // Get total business count
    const [totalBusinesses] = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(businesses);

    // Calculate progress percentage if job is running
    let progressPercentage = 0;
    if (currentJob && currentJob.status === "running" && currentJob.totalCities > 0) {
      progressPercentage = Math.round(
        (currentJob.completedCities / currentJob.totalCities) * 100
      );
    }

    return NextResponse.json({
      currentJob: currentJob || null,
      progress: {
        percentage: progressPercentage,
        completedCities: currentJob?.completedCities || 0,
        totalCities: currentJob?.totalCities || 0,
        inserted: currentJob?.totalBusinessesInserted || 0,
        skipped: currentJob?.totalBusinessesSkipped || 0,
        apiCalls: currentJob?.totalApiCalls || 0,
      },
      stats: {
        totalBusinesses: Number(totalBusinesses?.count || 0),
        byState: businessCountsByState.map(s => ({
          state: s.state,
          count: Number(s.count),
        })),
        byCategory: businessCountsByCategory.map(c => ({
          categoryId: c.categoryId,
          categoryName: c.categoryName,
          categorySlug: c.categorySlug,
          count: Number(c.count),
        })),
      },
      history: recentJobs.map(job => ({
        id: job.id,
        status: job.status,
        totalCities: job.totalCities,
        completedCities: job.completedCities,
        totalBusinessesInserted: job.totalBusinessesInserted,
        totalBusinessesSkipped: job.totalBusinessesSkipped,
        totalApiCalls: job.totalApiCalls,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        errorMessage: job.errorMessage,
      })),
    });
  } catch (error) {
    console.error("Error fetching sync status:", error);
    return NextResponse.json(
      { error: "Failed to fetch sync status" },
      { status: 500 }
    );
  }
}

