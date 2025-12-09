import { NextResponse } from "next/server";
import { db, businesses } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    // Get all unique neighborhoods with business counts and stats
    const neighborhoodStats = await db
      .select({
        neighborhood: businesses.neighborhood,
        businessCount: sql<number>`count(*)`,
        avgRating: sql<number>`COALESCE(AVG(CAST(${businesses.ratingAvg} AS DECIMAL)), 0)`,
        totalReviews: sql<number>`COALESCE(SUM(${businesses.reviewCount}), 0)`,
      })
      .from(businesses)
      .where(sql`${businesses.neighborhood} IS NOT NULL AND ${businesses.neighborhood} != ''`)
      .groupBy(businesses.neighborhood)
      .orderBy(sql`count(*) DESC`);

    // Format the results
    const neighborhoods = neighborhoodStats.map((stat) => ({
      name: stat.neighborhood,
      slug: stat.neighborhood?.toLowerCase().replace(/\s+/g, "-") || "",
      businessCount: Number(stat.businessCount),
      avgRating: Number(stat.avgRating).toFixed(1),
      totalReviews: Number(stat.totalReviews),
    }));

    return NextResponse.json({
      neighborhoods,
      total: neighborhoods.length,
    });
  } catch (error) {
    console.error("Error fetching neighborhoods:", error);
    return NextResponse.json(
      { error: "Failed to fetch neighborhoods", neighborhoods: [] },
      { status: 500 }
    );
  }
}
