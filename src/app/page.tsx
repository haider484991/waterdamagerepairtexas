import { Suspense } from "react";
import { HomePageClient } from "@/components/home/HomePageClient";
import {
  getFeaturedBusinesses,
  getRecentBusinesses,
  getCategories,
  getStats,
} from "@/lib/local-data";

async function getHomePageData() {
  try {
    const featuredBusinesses = getFeaturedBusinesses(8);
    const recentBusinesses = getRecentBusinesses(8);
    const categories = getCategories();
    const stats = getStats();

    return {
      featuredBusinesses,
      recentBusinesses,
      categories,
      stats: {
        totalBusinesses: stats.totalBusinesses,
        totalReviews: stats.totalReviews,
        totalCategories: stats.totalCategories,
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
