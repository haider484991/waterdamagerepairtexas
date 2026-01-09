import { NextResponse } from "next/server";
import { db, businesses, categories } from "@/lib/db";
import { eq } from "drizzle-orm";
import slugify from "slugify";

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address?: string;
  vicinity?: string;
  geometry: {
    location: { lat: number; lng: number };
  };
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  types?: string[];
  photos?: Array<{ photo_reference: string }>;
  opening_hours?: { open_now?: boolean; weekday_text?: string[] };
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

// Water damage restoration search queries for Google Places API
const categorySearchQueries: Record<string, string[]> = {
  "water-damage-restoration": [
    "water damage restoration Texas",
    "water damage repair Texas",
    "water extraction services",
    "flood restoration company",
  ],
  "flood-cleanup": [
    "flood cleanup Texas",
    "flood damage restoration",
    "emergency flood service",
    "water removal service",
  ],
  "mold-remediation": [
    "mold remediation Texas",
    "mold removal service",
    "mold inspection",
    "mold testing",
  ],
  "emergency-services": [
    "24 hour water damage Texas",
    "emergency restoration service",
    "emergency water extraction",
  ],
  "storm-damage": [
    "storm damage repair Texas",
    "hurricane damage restoration",
    "wind damage repair",
    "hail damage restoration",
  ],
};

// Parse city and state from Google Places formatted address
function parseCityState(formattedAddress: string): { city: string; state: string; zip: string } {
  const parts = formattedAddress.split(",").map(p => p.trim());
  let city = "Unknown";
  let state = "XX";
  let zip = "";
  
  // Typical format: "123 Main St, City, ST 12345, USA"
  if (parts.length >= 3) {
    // City is usually second to last before "ST ZIP" or "ST ZIP, USA"
    const stateZipPart = parts[parts.length - 2] || parts[parts.length - 1];
    
    // Extract state code (2 uppercase letters)
    const stateMatch = stateZipPart.match(/\b([A-Z]{2})\b/);
    if (stateMatch) {
      state = stateMatch[1];
    }
    
    // Extract zip code
    const zipMatch = stateZipPart.match(/\b(\d{5})(?:-\d{4})?\b/);
    if (zipMatch) {
      zip = zipMatch[1];
    }
    
    // City is the part before state/zip
    if (parts.length >= 3) {
      const cityPart = parts[parts.length - 3];
      if (cityPart && !cityPart.match(/^\d/)) {
        city = cityPart;
      }
    }
  }
  
  return { city, state, zip };
}

async function searchGooglePlaces(query: string): Promise<GooglePlace[]> {
  if (!GOOGLE_PLACES_API_KEY) return [];

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
    url.searchParams.set("query", query);
    url.searchParams.set("key", GOOGLE_PLACES_API_KEY);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status === "OK") {
      return data.results || [];
    }
    console.log(`Google Places returned ${data.status} for query: ${query}`);
    return [];
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
}

export async function POST(request: Request) {
  try {
    if (!GOOGLE_PLACES_API_KEY) {
      return NextResponse.json({ error: "Google Places API key not configured" }, { status: 500 });
    }

    // Get all categories from database
    const allCategories = await db.query.categories.findMany();
    
    const results: Record<string, { inserted: number; skipped: number }> = {};
    let totalInserted = 0;
    let totalSkipped = 0;

    for (const category of allCategories) {
      const queries = categorySearchQueries[category.slug];
      if (!queries || queries.length === 0) {
        console.log(`Skipping category ${category.name} - no search queries defined`);
        continue;
      }
      let categoryInserted = 0;
      let categorySkipped = 0;

      console.log(`Syncing category: ${category.name} (${queries.length} queries)`);

      for (const query of queries) {
        const places = await searchGooglePlaces(query);
        
        for (const place of places) {
          // Check if already exists
          const existing = await db
            .select({ id: businesses.id })
            .from(businesses)
            .where(eq(businesses.googlePlaceId, place.place_id))
            .limit(1);

          if (existing.length > 0) {
            categorySkipped++;
            continue;
          }

          // Generate unique slug
          const baseSlug = slugify(place.name, { lower: true, strict: true });
          let slug = baseSlug;
          let counter = 1;
          while (true) {
            const existingSlug = await db
              .select({ id: businesses.id })
              .from(businesses)
              .where(eq(businesses.slug, slug))
              .limit(1);
            if (existingSlug.length === 0) break;
            slug = `${baseSlug}-${counter}`;
            counter++;
          }

          // Parse address to extract city and state
          const address = place.formatted_address || place.vicinity || "";
          const addressParts = address.split(",").map((p) => p.trim());
          const { city, state, zip } = parseCityState(address);

          // Store only thumbnail photo reference
          const thumbnailPhoto = place.photos?.[0]?.photo_reference || null;

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
            categoryId: category.id,
            ratingAvg: place.rating?.toString() || "0",
            reviewCount: place.user_ratings_total || 0,
            priceLevel: place.price_level,
            photos: thumbnailPhoto ? [thumbnailPhoto] : [],
            // Hours, phone, website from Place Details API
            hours,
            phone,
            website,
            isVerified: true, // Auto-approve businesses from API
            isFeatured: (place.rating || 0) >= 4.5 && (place.user_ratings_total || 0) >= 50,
          });

          categoryInserted++;

          // Small delay after details fetch to avoid rate limiting
          await new Promise((r) => setTimeout(r, 100));
        }

        // Rate limiting delay
        await new Promise((r) => setTimeout(r, 300));
      }

      results[category.slug] = { inserted: categoryInserted, skipped: categorySkipped };
      totalInserted += categoryInserted;
      totalSkipped += categorySkipped;
      
      console.log(`  → ${category.name}: +${categoryInserted} new, ${categorySkipped} skipped`);
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalInserted,
        totalSkipped,
        categoriesSynced: Object.keys(results).length,
      },
      byCategory: results,
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}

// GET - status check
export async function GET() {
  const businessCount = await db.select({ count: businesses.id }).from(businesses);
  const categoryCount = await db.select({ count: categories.id }).from(categories);
  
  return NextResponse.json({
    status: "ready",
    businessCount: businessCount.length,
    categoryCount: categoryCount.length,
    apiConfigured: !!GOOGLE_PLACES_API_KEY,
  });
}

