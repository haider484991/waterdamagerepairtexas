import { MetadataRoute } from "next";
import { db, categories, businesses, states, cities } from "@/lib/db";
import { desc, isNotNull, or, eq, and } from "drizzle-orm";
import { getAllStates, getAllCities } from "@/lib/location-data";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://uspickleballdirectory.com";

// Route segment config - allow dynamic rendering
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const now = new Date();
    
    // Static pages with proper priority hierarchy
    const staticPages: MetadataRoute.Sitemap = [
      {
        url: SITE_URL,
        lastModified: now,
        changeFrequency: "daily",
        priority: 1.0,
      },
      {
        url: `${SITE_URL}/about`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
      },
      {
        url: `${SITE_URL}/privacy`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
      },
      {
        url: `${SITE_URL}/dmca`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.6,
      },
      {
        url: `${SITE_URL}/terms`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.6,
      },
      {
        url: `${SITE_URL}/contact`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
      },
      {
        url: `${SITE_URL}/categories`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.95,
      },
      {
        url: `${SITE_URL}/states`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.95,
      },
      {
        url: `${SITE_URL}/search`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.9,
      },
      {
        url: `${SITE_URL}/add-business`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.6,
      },
    ];

    // Category pages - high priority for navigation
    let categoryPages: MetadataRoute.Sitemap = [];
    try {
      if (db && categories) {
        const allCategories = await db.select().from(categories);
        categoryPages = allCategories.map((category) => ({
          url: `${SITE_URL}/categories/${category.slug}`,
          lastModified: now,
          changeFrequency: "daily" as const,
          priority: 0.90,
        }));
      }
    } catch (error) {
      console.error("Error fetching categories for sitemap:", error);
    }

    // State pages - high priority for location SEO
    const statesData = getAllStates();
    const statePages: MetadataRoute.Sitemap = statesData.map((state) => ({
      url: `${SITE_URL}/states/${state.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    }));

    // City pages - important for local SEO
    const citiesData = getAllCities();
    const cityPages: MetadataRoute.Sitemap = citiesData.map((city) => {
      const state = statesData.find(s => s.code === city.stateCode);
      if (!state) return null;
      
      return {
        url: `${SITE_URL}/states/${state.slug}/${city.slug}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.75,
      };
    }).filter(Boolean) as MetadataRoute.Sitemap;

    // State + Category combination pages (for filtering)
    let stateCategoryPages: MetadataRoute.Sitemap = [];
    try {
      if (db && categories) {
        const allCategories = await db.select().from(categories);
        stateCategoryPages = statesData.flatMap((state) =>
          allCategories.map((category) => ({
            url: `${SITE_URL}/categories/${category.slug}?state=${state.code}`,
            lastModified: now,
            changeFrequency: "weekly" as const,
            priority: 0.70,
          }))
        );
      }
    } catch (error) {
      console.error("Error generating state-category pages for sitemap:", error);
    }

    // Business pages - prioritize by rating and verification
    let businessPages: MetadataRoute.Sitemap = [];
    try {
      if (db && businesses) {
        const allBusinesses = await db
          .select({
            slug: businesses.slug,
            updatedAt: businesses.updatedAt,
            ratingAvg: businesses.ratingAvg,
            reviewCount: businesses.reviewCount,
            isVerified: businesses.isVerified,
            isFeatured: businesses.isFeatured,
            googlePlaceId: businesses.googlePlaceId,
          })
          .from(businesses)
          .where(
            and(
              isNotNull(businesses.slug),
              or(
                eq(businesses.isVerified, true),
                isNotNull(businesses.googlePlaceId)
              )
            )
          )
          .orderBy(desc(businesses.ratingAvg));

        businessPages = allBusinesses.map((business) => {
          // Calculate priority based on business quality signals
          let priority = 0.55; // Base priority
          
          const rating = Number(business.ratingAvg) || 0;
          const reviews = business.reviewCount || 0;
          
          // Boost for high ratings
          if (rating >= 4.5) priority += 0.15;
          else if (rating >= 4.0) priority += 0.1;
          else if (rating >= 3.5) priority += 0.05;
          
          // Boost for review count
          if (reviews >= 100) priority += 0.1;
          else if (reviews >= 50) priority += 0.05;
          else if (reviews >= 10) priority += 0.02;
          
          // Boost for verification
          if (business.isVerified) priority += 0.03;
          if (business.isFeatured) priority += 0.05;
          
          // Cap at 0.85 (below category/state pages)
          priority = Math.min(0.85, priority);
          
          return {
            url: `${SITE_URL}/business/${business.slug}`,
            lastModified: business.updatedAt || now,
            changeFrequency: "weekly" as const,
            priority: Math.round(priority * 100) / 100,
          };
        });
      }
    } catch (error) {
      console.error("Error fetching businesses for sitemap:", error);
    }

    // Pickleball-specific search queries for long-tail SEO
    const pickleballSearches = [
      "pickleball courts",
      "indoor pickleball",
      "outdoor pickleball",
      "pickleball clubs",
      "pickleball leagues",
      "pickleball equipment",
      "pickleball paddles",
      "pickleball lessons",
      "pickleball coaches",
      "pickleball tournaments",
      "where to play pickleball",
      "beginner pickleball",
    ];

    const searchPages: MetadataRoute.Sitemap = pickleballSearches.map((query) => ({
      url: `${SITE_URL}/search?q=${encodeURIComponent(query)}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.65,
    }));

    // Combine all pages
    return [
      ...staticPages,
      ...statePages,
      ...categoryPages,
      ...cityPages,
      ...stateCategoryPages,
      ...businessPages,
      ...searchPages,
    ];
  } catch (error) {
    // If anything fails, return at least the static pages
    console.error("Error generating sitemap:", error);
    const now = new Date();
    return [
      {
        url: SITE_URL,
        lastModified: now,
        changeFrequency: "daily",
        priority: 1.0,
      },
      {
        url: `${SITE_URL}/states`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.95,
      },
      {
        url: `${SITE_URL}/categories`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.95,
      },
      {
        url: `${SITE_URL}/search`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.9,
      },
    ];
  }
}
