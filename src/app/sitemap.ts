import { MetadataRoute } from "next";
import {
  getCategories,
  getAllBusinessesForSitemap,
  getStatesWithBusinesses,
  getCitiesWithBusinessesForState,
  getBusinessesByCategory,
} from "@/lib/local-data";
import { getSiteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const now = new Date();

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
      { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1.0 },
      { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
      { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
      { url: `${SITE_URL}/dmca`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
      { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
      { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
      { url: `${SITE_URL}/categories`, lastModified: now, changeFrequency: "daily", priority: 0.95 },
      { url: `${SITE_URL}/states`, lastModified: now, changeFrequency: "weekly", priority: 0.95 },
      { url: `${SITE_URL}/search`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
      { url: `${SITE_URL}/add-business`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    ];

    // Category pages (only categories with businesses)
    const allCategories = getCategories();
    const categoryPages: MetadataRoute.Sitemap = allCategories
      .filter((cat) => {
        const businesses = getBusinessesByCategory(cat.slug);
        return businesses.length > 0;
      })
      .map((category) => ({
        url: `${SITE_URL}/categories/${category.slug}`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.9,
      }));

    // Only states with actual businesses
    const statesWithBiz = getStatesWithBusinesses();

    const statePages: MetadataRoute.Sitemap = statesWithBiz.map((state) => ({
      url: `${SITE_URL}/states/${state.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    }));

    // Only cities with actual businesses
    const cityPages: MetadataRoute.Sitemap = statesWithBiz.flatMap((state) => {
      const cities = getCitiesWithBusinessesForState(state.code);
      return cities.map((city) => ({
        url: `${SITE_URL}/states/${state.slug}/${city.slug}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.75,
      }));
    });

    // State + Category combos (only where businesses exist)
    const stateCategoryPages: MetadataRoute.Sitemap = statesWithBiz.flatMap((state) =>
      allCategories
        .filter((cat) => {
          const businesses = getBusinessesByCategory(cat.slug, { state: state.code });
          return businesses.length > 0;
        })
        .map((category) => ({
          url: `${SITE_URL}/categories/${category.slug}?state=${state.code}`,
          lastModified: now,
          changeFrequency: "weekly" as const,
          priority: 0.7,
        }))
    );

    // Business pages from local JSON
    const allBusinesses = getAllBusinessesForSitemap();
    const businessPages: MetadataRoute.Sitemap = allBusinesses.map((business) => {
      let priority = 0.55;
      if (business.isFeatured) priority += 0.05;
      if (business.isVerified) priority += 0.03;
      priority = Math.min(0.85, priority);

      return {
        url: `${SITE_URL}/business/${business.slug}`,
        lastModified: business.updatedAt ? new Date(business.updatedAt) : now,
        changeFrequency: "weekly" as const,
        priority: Math.round(priority * 100) / 100,
      };
    });

    return [
      ...staticPages,
      ...statePages,
      ...categoryPages,
      ...cityPages,
      ...stateCategoryPages,
      ...businessPages,
    ];
  } catch (error) {
    console.error("Error generating sitemap:", error);
    const now = new Date();
    return [
      { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1.0 },
      { url: `${SITE_URL}/states`, lastModified: now, changeFrequency: "weekly", priority: 0.95 },
      { url: `${SITE_URL}/categories`, lastModified: now, changeFrequency: "daily", priority: 0.95 },
      { url: `${SITE_URL}/search`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    ];
  }
}
