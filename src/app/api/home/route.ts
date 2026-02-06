import { NextResponse } from "next/server";
import {
  getFeaturedBusinesses,
  getRecentBusinesses,
  getCategoryStats,
  getStats,
} from "@/lib/local-data";

export async function GET() {
  try {
    const featured = getFeaturedBusinesses(8);
    const recent = getRecentBusinesses(8);
    const stats = getStats();
    const categoryStats = getCategoryStats();

    const categoriesWithCount = categoryStats.map((cs) => ({
      ...cs.category,
      businessCount: cs.count,
    }));

    return NextResponse.json({
      featured,
      recent,
      categories: categoriesWithCount,
      stats: {
        totalBusinesses: stats.totalBusinesses,
        totalReviews: stats.totalReviews,
        avgRating: stats.avgRating,
        totalCategories: stats.totalCategories,
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
