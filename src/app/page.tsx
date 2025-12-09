import { Suspense } from "react";
import { db, businesses, categories } from "@/lib/db";
import { desc, eq, sql } from "drizzle-orm";
import { HomePageClient } from "@/components/home/HomePageClient";
import { enrichBusinesses, BusinessData } from "@/lib/hybrid-data";

async function getHomePageData() {
  try {
    // Fetch all data in parallel for performance
    const [featuredResults, recentResults, allCategories, statsResult] =
      await Promise.all([
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
          })
          .from(businesses),
      ]);

    // Format featured businesses
    const formattedFeatured: BusinessData[] = featuredResults.map((r) => ({
      ...r.business,
      photos: (r.business.photos as string[]) || [],
      hours: r.business.hours as Record<string, string> | null,
      category: r.category
        ? {
            name: r.category.name,
            slug: r.category.slug,
            section: r.category.section,
          }
        : null,
    }));

    // Format recent businesses
    const formattedRecent: BusinessData[] = recentResults.map((r) => ({
      ...r.business,
      photos: (r.business.photos as string[]) || [],
      hours: r.business.hours as Record<string, string> | null,
      category: r.category
        ? {
            name: r.category.name,
            slug: r.category.slug,
            section: r.category.section,
          }
        : null,
    }));

    // Hybrid enrichment - get live Google data for photos
    let enrichedFeatured = formattedFeatured;
    let enrichedRecent = formattedRecent;

    try {
      // Enrich in parallel for performance
      const [enrichedF, enrichedR] = await Promise.all([
        enrichBusinesses(formattedFeatured, { limit: 4, parallel: true }),
        enrichBusinesses(formattedRecent, { limit: 4, parallel: true }),
      ]);
      enrichedFeatured = enrichedF;
      enrichedRecent = enrichedR;
    } catch (error) {
      console.error("Hybrid enrichment failed, using database data:", error);
      // Graceful fallback to DB data
    }

    return {
      featuredBusinesses: enrichedFeatured,
      recentBusinesses: enrichedRecent,
      categories: allCategories,
      stats: {
        totalBusinesses: Number(statsResult[0]?.totalBusinesses || 0),
        totalReviews: Number(statsResult[0]?.totalReviews || 0),
        totalCategories: allCategories.length,
      },
    };
  } catch (error) {
    console.error("Error fetching home page data:", error);
    return {
      featuredBusinesses: [],
      recentBusinesses: [],
      categories: [],
      stats: {
        totalBusinesses: 0,
        totalReviews: 0,
        totalCategories: 0,
      },
    };
  }
}

export default async function HomePage() {
  const data = await getHomePageData();

  return (
    <Suspense fallback={<HomePageSkeleton />}>
      <HomePageClient
        featuredBusinesses={data.featuredBusinesses}
        categories={data.categories}
        recentBusinesses={data.recentBusinesses}
      />
    </Suspense>
  );
}

function HomePageSkeleton() {
  return (
    <div className="min-h-screen animate-pulse">
      <div className="h-[500px] bg-card/30" />
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="h-24 bg-card rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
