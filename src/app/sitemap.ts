import { MetadataRoute } from "next";
import { getAllStates, getAllCities } from "@/lib/location-data";
import { getCategories, getAllBusinessesForSitemap } from "@/lib/local-data";
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

    // Category pages
    const allCategories = getCategories();
    const categoryPages: MetadataRoute.Sitemap = allCategories.map((category) => ({
      url: `${SITE_URL}/categories/${category.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.9,
    }));

    // State pages
    const statesData = getAllStates();
    const statePages: MetadataRoute.Sitemap = statesData.map((state) => ({
      url: `${SITE_URL}/states/${state.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    }));

    // City pages
    const citiesData = getAllCities();
    const cityPages: MetadataRoute.Sitemap = citiesData
      .map((city) => {
        const state = statesData.find((s) => s.code === city.stateCode);
        if (!state) return null;
        return {
          url: `${SITE_URL}/states/${state.slug}/${city.slug}`,
          lastModified: now,
          changeFrequency: "weekly" as const,
          priority: 0.75,
        };
      })
      .filter(Boolean) as MetadataRoute.Sitemap;

    // State + Category combination pages
    const stateCategoryPages: MetadataRoute.Sitemap = statesData.flatMap((state) =>
      allCategories.map((category) => ({
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

    // Search pages
    const waterDamageSearches = [
      "water damage restoration",
      "emergency flood cleanup",
      "mold remediation",
      "water extraction services",
      "flood damage repair",
      "storm damage restoration",
      "24 hour water damage",
      "water damage near me",
      "residential water damage",
      "commercial water damage",
      "insurance claim water damage",
      "water damage USA",
    ];
    const searchPages: MetadataRoute.Sitemap = waterDamageSearches.map((query) => ({
      url: `${SITE_URL}/search?q=${encodeURIComponent(query)}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.65,
    }));

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
