/**
 * Hybrid Data Fetching System
 * 
 * This module provides robust data fetching that works with both:
 * - Local database (primary source for business listings)
 * - Google Places API (for live photos, reviews, hours, contact info)
 * 
 * If one source fails, the other continues to work.
 * Data is merged intelligently without duplication.
 */

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export interface BusinessData {
  id: string;
  googlePlaceId: string | null;
  name: string;
  slug: string;
  description: string | null;
  address: string;
  city: string;
  state: string;
  zip: string | null;
  phone: string | null;
  website: string | null;
  email: string | null;
  lat: string | null;
  lng: string | null;
  neighborhood: string | null;
  hours: Record<string, string> | null;
  photos: string[];
  priceLevel: number | null;
  ratingAvg: string | null;
  reviewCount: number | null;
  isVerified: boolean | null;
  isFeatured: boolean | null;
  category?: { name: string; slug: string; section?: string | null } | null;
}

export interface GoogleEnrichment {
  photos: string[];
  rating: number;
  reviewCount: number;
  priceLevel: number | null;
  hours: Record<string, string> | null;
  isOpenNow: boolean;
  website: string | null;
  phone: string | null;
}

// In-memory cache with TTL
const cache = new Map<string, { data: GoogleEnrichment; expiry: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Fetch enrichment data from Google Places API
 * Returns null if API fails or is not configured
 */
export async function fetchGoogleEnrichment(
  placeId: string
): Promise<GoogleEnrichment | null> {
  if (!GOOGLE_PLACES_API_KEY || !placeId) return null;

  // Check cache first
  const cached = cache.get(placeId);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }

  try {
    const fields = [
      "rating",
      "user_ratings_total",
      "price_level",
      "opening_hours",
      "photos",
      "website",
      "formatted_phone_number",
    ].join(",");

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_PLACES_API_KEY}`;

    const response = await fetch(url, {
      next: { revalidate: 1800 }, // Cache for 30 minutes
    });

    if (!response.ok) return null;

    const json = await response.json();
    if (json.status !== "OK" || !json.result) return null;

    const result = json.result;
    const enrichment: GoogleEnrichment = {
      photos: result.photos?.map((p: any) => p.photo_reference) || [],
      rating: result.rating || 0,
      reviewCount: result.user_ratings_total || 0,
      priceLevel: result.price_level ?? null,
      hours: formatHours(result.opening_hours?.weekday_text),
      isOpenNow: result.opening_hours?.open_now || false,
      website: result.website || null,
      phone: result.formatted_phone_number || null,
    };

    // Cache the result
    cache.set(placeId, { data: enrichment, expiry: Date.now() + CACHE_TTL });

    return enrichment;
  } catch (error) {
    console.error("Google enrichment fetch failed:", error);
    return null;
  }
}

/**
 * Merge database business with Google enrichment
 * Database is the source of truth, Google provides live updates
 */
export function mergeBusinessWithGoogle(
  business: BusinessData,
  google: GoogleEnrichment | null
): BusinessData {
  if (!google) return business;

  return {
    ...business,
    // Use Google photos if available, otherwise keep DB photos
    photos: google.photos.length > 0 ? google.photos : business.photos,
    // Use live rating if available
    ratingAvg: google.rating > 0 ? google.rating.toString() : business.ratingAvg,
    // Use live review count
    reviewCount: google.reviewCount > 0 ? google.reviewCount : business.reviewCount,
    // Use Google price level if available
    priceLevel: google.priceLevel ?? business.priceLevel,
    // Merge hours - prefer Google for accuracy
    hours: google.hours || business.hours,
    // Use Google contact info if DB is missing
    website: google.website || business.website,
    phone: google.phone || business.phone,
  };
}

/**
 * Enrich a single business with Google data
 * Gracefully handles failures
 */
export async function enrichBusiness(
  business: BusinessData
): Promise<BusinessData & { isOpenNow?: boolean; dataSource: "hybrid" | "database" }> {
  if (!business.googlePlaceId) {
    return { ...business, dataSource: "database" };
  }

  const google = await fetchGoogleEnrichment(business.googlePlaceId);
  
  if (google) {
    return {
      ...mergeBusinessWithGoogle(business, google),
      isOpenNow: google.isOpenNow,
      dataSource: "hybrid",
    };
  }

  return { ...business, dataSource: "database" };
}

/**
 * Enrich multiple businesses with Google data
 * Rate-limited to avoid API quota issues
 * Only enriches first N items for performance
 */
export async function enrichBusinesses(
  businesses: BusinessData[],
  options: { limit?: number; parallel?: boolean } = {}
): Promise<(BusinessData & { isOpenNow?: boolean; dataSource: "hybrid" | "database" })[]> {
  const { limit = 8, parallel = false } = options;

  if (!GOOGLE_PLACES_API_KEY) {
    // API not configured, return DB data only
    return businesses.map((b) => ({ ...b, dataSource: "database" as const }));
  }

  const results: (BusinessData & { isOpenNow?: boolean; dataSource: "hybrid" | "database" })[] = [];

  if (parallel) {
    // Parallel fetching for first N businesses
    const enrichPromises = businesses.slice(0, limit).map(async (business) => {
      return enrichBusiness(business);
    });

    const enrichedFirst = await Promise.all(enrichPromises);
    results.push(...enrichedFirst);

    // Add remaining businesses without enrichment
    results.push(
      ...businesses.slice(limit).map((b) => ({ ...b, dataSource: "database" as const }))
    );
  } else {
    // Sequential fetching with rate limiting
    for (let i = 0; i < businesses.length; i++) {
      if (i < limit && businesses[i].googlePlaceId) {
        const enriched = await enrichBusiness(businesses[i]);
        results.push(enriched);
        // Small delay between requests
        if (i < limit - 1) {
          await new Promise((r) => setTimeout(r, 50));
        }
      } else {
        results.push({ ...businesses[i], dataSource: "database" as const });
      }
    }
  }

  return results;
}

/**
 * Format Google's weekday_text to our hours format
 */
function formatHours(weekdayText?: string[]): Record<string, string> | null {
  if (!weekdayText) return null;

  const dayMap: Record<string, string> = {
    Monday: "monday",
    Tuesday: "tuesday",
    Wednesday: "wednesday",
    Thursday: "thursday",
    Friday: "friday",
    Saturday: "saturday",
    Sunday: "sunday",
  };

  const hours: Record<string, string> = {};

  for (const line of weekdayText) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;

    const day = line.substring(0, colonIndex).trim();
    const time = line.substring(colonIndex + 1).trim();

    const dayKey = dayMap[day];
    if (dayKey) {
      hours[dayKey] = time;
    }
  }

  return Object.keys(hours).length > 0 ? hours : null;
}

/**
 * Get image URL from photo reference
 * Returns placeholder if no photo
 */
export function getImageUrl(
  photo: string | null | undefined,
  width = 400
): string {
  const placeholder = `https://placehold.co/${width}x${Math.floor(width * 0.75)}/f5f5f4/a3a3a3?text=No+Image`;

  if (!photo) return placeholder;

  // Already a full URL
  if (photo.startsWith("http")) {
    // Extract Google photo reference if present
    if (photo.includes("photo_reference=")) {
      const match = photo.match(/photo_reference=([^&]+)/);
      if (match) {
        return `/api/images?ref=${match[1]}&maxwidth=${width}`;
      }
    }
    return photo;
  }

  // Local placeholder path
  if (photo.startsWith("/images/")) return placeholder;

  // Photo reference - use proxy
  return `/api/images?ref=${photo}&maxwidth=${width}`;
}

/**
 * Check if a business is currently open
 */
export function isBusinessOpen(hours: Record<string, string> | null): boolean {
  if (!hours) return false;

  const now = new Date();
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const currentDay = days[now.getDay()];
  const todayHours = hours[currentDay];

  if (!todayHours || todayHours.toLowerCase() === "closed") return false;

  // Simple check - for production, parse time ranges properly
  return true;
}

