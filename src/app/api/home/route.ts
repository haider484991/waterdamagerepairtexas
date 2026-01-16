import { NextResponse } from "next/server";
import { db, businesses, categories } from "@/lib/db";
import { eq, desc, sql } from "drizzle-orm";
import { BusinessData } from "@/lib/hybrid-data";

export async function GET() {
  try {
    // Fetch all data in parallel for performance
    const [
      featuredResults,
      recentResults,
      allCategories,
      statsResult,
    ] = await Promise.all([
      // Featured businesses
      db
        .select({
          business: businesses,
          category: categories,
        })
        .from(businesses)
        .leftJoin(categories, eq(businesses.categoryId, categories.id))
        .where(eq(businesses.isFeatured, true))
        .orderBy(desc(businesses.ratingAvg))
        .limit(8),

      // Recent businesses
      db
        .select({
          business: businesses,
          category: categories,
        })
        .from(businesses)
        .leftJoin(categories, eq(businesses.categoryId, categories.id))
        .orderBy(desc(businesses.createdAt))
        .limit(8),

      // All categories
      db.select().from(categories).orderBy(categories.displayOrder),

      // Stats
      db
        .select({
          totalBusinesses: sql<number>`count(*)`,
          totalReviews: sql<number>`COALESCE(SUM(${businesses.reviewCount}), 0)`,
          avgRating: sql<number>`COALESCE(AVG(CAST(${businesses.ratingAvg} AS DECIMAL)), 0)`,
        })
        .from(businesses),
    ]);

    // Format featured businesses (use cached data only - NO API calls)
    const formattedFeatured: BusinessData[] = featuredResults.map((r) => ({
      ...r.business,
      // Prefer cached image URLs, fallback to photo references
      photos: ((r.business.cachedImageUrls as string[]) || []).length > 0
        ? (r.business.cachedImageUrls as string[])
        : (r.business.photos as string[]) || [],
      hours: (r.business.cachedHours as Record<string, string>) || (r.business.hours as Record<string, string> | null),
      cachedImageUrls: r.business.cachedImageUrls as string[] | null,
      lastEnrichedAt: r.business.lastEnrichedAt,
      cachedPhone: r.business.cachedPhone,
      cachedWebsite: r.business.cachedWebsite,
      cachedHours: r.business.cachedHours as Record<string, string> | null,
      category: r.category
        ? {
          name: r.category.name,
          slug: r.category.slug,
          section: r.category.section,
        }
        : null,
      dataSource: "database" as const,
    }));

    // Format recent businesses (use cached data only - NO API calls)
    const formattedRecent: BusinessData[] = recentResults.map((r) => ({
      ...r.business,
      // Prefer cached image URLs, fallback to photo references
      photos: ((r.business.cachedImageUrls as string[]) || []).length > 0
        ? (r.business.cachedImageUrls as string[])
        : (r.business.photos as string[]) || [],
      hours: (r.business.cachedHours as Record<string, string>) || (r.business.hours as Record<string, string> | null),
      cachedImageUrls: r.business.cachedImageUrls as string[] | null,
      lastEnrichedAt: r.business.lastEnrichedAt,
      cachedPhone: r.business.cachedPhone,
      cachedWebsite: r.business.cachedWebsite,
      cachedHours: r.business.cachedHours as Record<string, string> | null,
      category: r.category
        ? {
          name: r.category.name,
          slug: r.category.slug,
          section: r.category.section,
        }
        : null,
      dataSource: "database" as const,
    }));

    // NO hybrid enrichment - saves Google API costs
    // Data is served directly from database cache

    // Get top categories by business count
    const categoriesWithCount = await Promise.all(
      allCategories.map(async (cat) => {
        const [countResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(businesses)
          .where(eq(businesses.categoryId, cat.id));
        return {
          ...cat,
          businessCount: Number(countResult?.count || 0),
        };
      })
    );

    return NextResponse.json({
      featured: formattedFeatured,
      recent: formattedRecent,
      categories: categoriesWithCount,
      stats: {
        totalBusinesses: Number(statsResult[0]?.totalBusinesses || 0),
        totalReviews: Number(statsResult[0]?.totalReviews || 0),
        avgRating: Number(statsResult[0]?.avgRating || 0).toFixed(1),
        totalCategories: allCategories.length,
      },
    });
  } catch (error) {
    console.error("Home data fetch error:", error);
    return NextResponse.json(
      {
        featured: [],
        recent: [],
        categories: [],
        stats: {
          totalBusinesses: 0,
          totalReviews: 0,
          avgRating: "0.0",
          totalCategories: 0,
        },
      },
      { status: 500 }
    );
  }
}

