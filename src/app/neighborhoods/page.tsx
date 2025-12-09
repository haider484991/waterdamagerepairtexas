import { Suspense } from "react";
import { NeighborhoodsPageClient } from "./NeighborhoodsPageClient";
import { Skeleton } from "@/components/ui/skeleton";
import type { Metadata } from "next";
import { db, businesses } from "@/lib/db";
import { sql } from "drizzle-orm";

export const metadata: Metadata = {
  title: "Plano Neighborhoods – Explore Businesses by Area | Henry Harrison Plano Texas",
  description:
    "Discover businesses across Plano's vibrant neighborhoods including Legacy West, Downtown Plano, West Plano, and East Plano. Find local businesses near you.",
};

async function getNeighborhoods() {
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
      name: stat.neighborhood || "",
      slug: stat.neighborhood?.toLowerCase().replace(/\s+/g, "-") || "",
      businessCount: Number(stat.businessCount),
      avgRating: Number(stat.avgRating).toFixed(1),
      totalReviews: Number(stat.totalReviews),
    }));

    return neighborhoods;
  } catch (error) {
    console.error("Error fetching neighborhoods:", error);
    return [];
  }
}

export default async function NeighborhoodsPage() {
  const neighborhoods = await getNeighborhoods();

  return (
    <Suspense fallback={<NeighborhoodsPageSkeleton />}>
      <NeighborhoodsPageClient neighborhoods={neighborhoods} />
    </Suspense>
  );
}

function NeighborhoodsPageSkeleton() {
  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Skeleton className="h-10 w-64 mx-auto mb-4" />
          <Skeleton className="h-5 w-96 mx-auto" />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
