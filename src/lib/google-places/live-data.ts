// Utility to fetch live data from Google Places API for businesses

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export interface GoogleLiveData {
  photos: string[];
  rating: number;
  reviewCount: number;
  priceLevel: number | null;
  hours: Record<string, string> | null;
  isOpenNow: boolean;
  website: string | null;
  phone: string | null;
  googleMapsUrl: string | null;
}

interface PlaceDetailsResult {
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
  photos?: Array<{ photo_reference: string }>;
  website?: string;
  formatted_phone_number?: string;
  url?: string;
}

// Cache for Google data (in-memory, resets on server restart)
const cache = new Map<string, { data: GoogleLiveData; expiry: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export async function fetchGoogleLiveData(placeId: string): Promise<GoogleLiveData | null> {
  if (!GOOGLE_PLACES_API_KEY || !placeId) return null;

  // Check cache
  const cached = cache.get(placeId);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }

  try {
    const fields = "rating,user_ratings_total,price_level,opening_hours,photos,website,formatted_phone_number,url";
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_PLACES_API_KEY}`;

    const response = await fetch(url);
    const json = await response.json();

    if (json.status !== "OK" || !json.result) {
      return null;
    }

    const result: PlaceDetailsResult = json.result;

    const liveData: GoogleLiveData = {
      photos: result.photos?.map((p) => p.photo_reference) || [],
      rating: result.rating || 0,
      reviewCount: result.user_ratings_total || 0,
      priceLevel: result.price_level ?? null,
      hours: formatHours(result.opening_hours?.weekday_text),
      isOpenNow: result.opening_hours?.open_now || false,
      website: result.website || null,
      phone: result.formatted_phone_number || null,
      googleMapsUrl: result.url || null,
    };

    // Cache the result
    cache.set(placeId, { data: liveData, expiry: Date.now() + CACHE_TTL });

    return liveData;
  } catch (error) {
    console.error("Error fetching Google live data:", error);
    return null;
  }
}

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

// Enrich a single business with Google live data
export async function enrichBusinessWithGoogleData<T extends { googlePlaceId?: string | null }>(
  business: T
): Promise<T & { liveData?: GoogleLiveData }> {
  if (!business.googlePlaceId) {
    return business;
  }

  const liveData = await fetchGoogleLiveData(business.googlePlaceId);
  
  if (liveData) {
    return { ...business, liveData };
  }

  return business;
}

// Enrich multiple businesses (with rate limiting)
export async function enrichBusinessesWithGoogleData<T extends { googlePlaceId?: string | null }>(
  businesses: T[],
  limit = 10 // Only enrich first N businesses to avoid API limits
): Promise<(T & { liveData?: GoogleLiveData })[]> {
  const results: (T & { liveData?: GoogleLiveData })[] = [];

  for (let i = 0; i < businesses.length; i++) {
    if (i < limit && businesses[i].googlePlaceId) {
      const enriched = await enrichBusinessWithGoogleData(businesses[i]);
      results.push(enriched);
      // Small delay between requests
      if (i < limit - 1) {
        await new Promise((r) => setTimeout(r, 100));
      }
    } else {
      results.push(businesses[i]);
    }
  }

  return results;
}

