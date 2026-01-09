import { NextResponse } from "next/server";
import { db, businesses, categories } from "@/lib/db";
import { eq } from "drizzle-orm";
import slugify from "slugify";

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const SEARCH_RADIUS = 25000; // 25km radius (covers metro areas)

interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address?: string;
  vicinity?: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  types?: string[];
  photos?: Array<{
    photo_reference: string;
  }>;
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
  website?: string;
  formatted_phone_number?: string;
}

interface PlaceDetails {
  opening_hours?: {
    weekday_text?: string[];
    open_now?: boolean;
  };
  website?: string;
  formatted_phone_number?: string;
}

// Fetch detailed place info including hours, phone, website
async function fetchPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  if (!GOOGLE_PLACES_API_KEY) return null;

  try {
    const fields = "opening_hours,website,formatted_phone_number";
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_PLACES_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.result) {
      return data.result;
    }
    return null;
  } catch (error) {
    console.error("Error fetching place details:", error);
    return null;
  }
}

// Parse Google's weekday_text to our hours format
function parseHoursFromGoogle(weekdayText?: string[]): Record<string, string> | null {
  if (!weekdayText || weekdayText.length === 0) return null;

  const dayMap: Record<string, string> = {
    "Monday": "monday",
    "Tuesday": "tuesday",
    "Wednesday": "wednesday",
    "Thursday": "thursday",
    "Friday": "friday",
    "Saturday": "saturday",
    "Sunday": "sunday",
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

// Map Google Places types to water damage service categories
const typeToCategory: Record<string, string> = {
  plumber: "water-damage-restoration",
  general_contractor: "water-damage-restoration",
  roofing_contractor: "storm-damage",
  home_improvement_store: "water-damage-restoration",
  moving_company: "flood-cleanup",
  fire_station: "emergency-services",
  local_government_office: "emergency-services",
};

// Water damage restoration search queries
const categorySearchQueries: Record<string, string[]> = {
  "water-damage-restoration": ["water damage restoration Texas", "water damage repair", "water extraction"],
  "flood-cleanup": ["flood cleanup Texas", "flood damage restoration", "water removal"],
  "mold-remediation": ["mold remediation Texas", "mold removal", "mold inspection"],
  "emergency-services": ["24 hour water damage", "emergency restoration", "emergency water extraction"],
  "storm-damage": ["storm damage repair Texas", "hurricane damage restoration", "hail damage repair"],
};

async function searchGooglePlaces(query: string, cityName?: string, stateCode?: string, location?: string): Promise<GooglePlace[]> {
  if (!GOOGLE_PLACES_API_KEY) {
    throw new Error("Google Places API key not configured");
  }

  const searchQuery = cityName && stateCode ? `${query} in ${cityName}, ${stateCode}` : query;
  const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
  url.searchParams.set("query", searchQuery);
  url.searchParams.set("key", GOOGLE_PLACES_API_KEY);

  if (location) {
    url.searchParams.set("location", location);
    url.searchParams.set("radius", SEARCH_RADIUS.toString());
  }

  const response = await fetch(url.toString());
  const data = await response.json();

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    console.error("Google Places API error:", data.status, data.error_message);
    return [];
  }

  return data.results || [];
}

// Store photo reference directly - our image proxy API will handle the actual URL
function getPhotoReference(photoReference: string): string {
  return photoReference;
}

// Neighborhood detection removed - not applicable for multi-location directory

function getCategorySlugFromTypes(types: string[]): string | null {
  for (const type of types) {
    if (typeToCategory[type]) {
      return typeToCategory[type];
    }
  }
  return null;
}

export async function POST(request: Request) {
  try {
    if (!GOOGLE_PLACES_API_KEY) {
      return NextResponse.json(
        { error: "Google Places API key not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { categorySlug, query, cityName, stateCode, location } = body;

    // Get the category
    let categoryId: string | null = null;
    if (categorySlug) {
      const [category] = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, categorySlug))
        .limit(1);

      if (category) {
        categoryId = category.id;
      }
    }

    // Determine search queries
    let searchQueries: string[] = [];
    if (query) {
      searchQueries = [query];
    } else if (categorySlug && categorySearchQueries[categorySlug]) {
      searchQueries = categorySearchQueries[categorySlug];
    } else {
      // Default: search for restaurants
      searchQueries = ["restaurants", "businesses"];
    }

    let totalInserted = 0;
    let totalSkipped = 0;

    for (const searchQuery of searchQueries) {
      const places = await searchGooglePlaces(searchQuery, cityName, stateCode, location);

      for (const place of places) {
        // Check if business already exists
        const existing = await db
          .select()
          .from(businesses)
          .where(eq(businesses.googlePlaceId, place.place_id))
          .limit(1);

        if (existing.length > 0) {
          totalSkipped++;
          continue;
        }

        // Determine category from place types
        let businessCategoryId = categoryId;
        if (!businessCategoryId && place.types) {
          const detectedSlug = getCategorySlugFromTypes(place.types);
          if (detectedSlug) {
            const [cat] = await db
              .select()
              .from(categories)
              .where(eq(categories.slug, detectedSlug))
              .limit(1);
            if (cat) {
              businessCategoryId = cat.id;
            }
          }
        }

        // Generate unique slug
        const baseSlug = slugify(place.name, { lower: true, strict: true });
        let slug = baseSlug;
        let counter = 1;
        while (true) {
          const existingSlug = await db
            .select()
            .from(businesses)
            .where(eq(businesses.slug, slug))
            .limit(1);
          if (existingSlug.length === 0) break;
          slug = `${baseSlug}-${counter}`;
          counter++;
        }

        // Store only ONE photo reference for thumbnail (lean database)
        // Full photos will be fetched from Google API on demand
        const thumbnailPhoto = place.photos?.[0]?.photo_reference || null;

        // Parse address
        const address = place.formatted_address || place.vicinity || "";
        const addressParts = address.split(",").map((p) => p.trim());

        // Extract city, state, zip from address or use provided values
        let city = cityName || "Unknown";
        let state = stateCode || "XX";
        let zip = "";

        if (addressParts.length >= 2) {
          const secondLastPart = addressParts[addressParts.length - 2];

          // Extract zip code
          const zipMatch = secondLastPart?.match(/\b\d{5}(?:-\d{4})?\b/);
          if (zipMatch) {
            zip = zipMatch[0];
          }

          // Extract state
          const stateMatch = secondLastPart?.match(/\b([A-Z]{2})\b/);
          if (stateMatch && !stateCode) {
            state = stateMatch[1];
          }

          // Extract city
          if (addressParts.length >= 3 && !cityName) {
            const cityPart = addressParts[addressParts.length - 2];
            const cityWithoutZipState = cityPart.replace(/\b([A-Z]{2})\b/, '').replace(/\b\d{5}(?:-\d{4})?\b/, '').trim();
            if (cityWithoutZipState) {
              city = cityWithoutZipState;
            }
          }
        }

        // Fetch place details for hours, phone, website
        const placeDetails = await fetchPlaceDetails(place.place_id);
        const hours = parseHoursFromGoogle(placeDetails?.opening_hours?.weekday_text);
        const phone = placeDetails?.formatted_phone_number || null;
        const website = placeDetails?.website || null;

        // Insert business with hours, phone, website from Place Details API
        // Auto-approve businesses from API (isVerified: true)
        await db.insert(businesses).values({
          googlePlaceId: place.place_id,
          name: place.name,
          slug,
          address: addressParts[0] || address,
          city,
          state,
          zip,
          lat: place.geometry.location.lat.toString(),
          lng: place.geometry.location.lng.toString(),
          categoryId: businessCategoryId,
          // Store Google's rating/review count as reference (updated periodically)
          ratingAvg: place.rating?.toString() || "0",
          reviewCount: place.user_ratings_total || 0,
          priceLevel: place.price_level,
          // Only store single thumbnail photo reference
          photos: thumbnailPhoto ? [thumbnailPhoto] : [],
          // Hours, phone, website from Place Details API
          hours,
          phone,
          website,
          isVerified: true, // Auto-approve businesses from API
          isFeatured: (place.rating || 0) >= 4.5 && (place.user_ratings_total || 0) >= 100,
        });

        totalInserted++;

        // Small delay after details fetch to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    return NextResponse.json({
      success: true,
      inserted: totalInserted,
      skipped: totalSkipped,
      message: `Synced ${totalInserted} new businesses, skipped ${totalSkipped} existing`,
    });
  } catch (error) {
    console.error("Error syncing Google Places:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to sync" },
      { status: 500 }
    );
  }
}

// GET endpoint to sync all categories
export async function GET() {
  if (!GOOGLE_PLACES_API_KEY) {
    return NextResponse.json(
      { error: "Google Places API key not configured. Add GOOGLE_PLACES_API_KEY to your .env.local" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: "Use POST to sync water damage restoration businesses. Provide cityName and stateCode for location-specific sync.",
    availableCategories: Object.keys(categorySearchQueries),
    examples: [
      { categorySlug: "water-damage-restoration", cityName: "Houston", stateCode: "TX" },
      { query: "water damage restoration", cityName: "Dallas", stateCode: "TX" },
    ],
  });
}

