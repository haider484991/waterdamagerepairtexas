import { NextResponse } from "next/server";
import { db, categories, businesses, cities, states } from "@/lib/db";
import { eq } from "drizzle-orm";
import slugify from "slugify";

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

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
}

// Water damage restoration search queries
const categorySearchQueries: Record<string, string[]> = {
  "water-damage-restoration": ["water damage restoration", "water damage repair", "water extraction services"],
  "flood-cleanup": ["flood cleanup", "flood damage restoration", "water removal service"],
  "mold-remediation": ["mold remediation", "mold removal service", "mold inspection"],
  "emergency-services": ["24 hour water damage", "emergency restoration service", "emergency water extraction"],
  "storm-damage": ["storm damage repair", "hurricane damage restoration", "hail damage restoration"],
};

async function searchGooglePlaces(query: string, cityName: string, stateCode: string): Promise<GooglePlace[]> {
  if (!GOOGLE_PLACES_API_KEY) {
    return [];
  }

  try {
    const searchQuery = `${query} in ${cityName}, ${stateCode}`;
    const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
    url.searchParams.set("query", searchQuery);
    url.searchParams.set("key", GOOGLE_PLACES_API_KEY);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error(`Google Places API error for "${searchQuery}":`, data.status);
      return [];
    }

    return data.results || [];
  } catch (error) {
    console.error("Error searching Google Places:", error);
    return [];
  }
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
    const { stateCode, cityName, categorySlug, limit = 5 } = body;

    // Get categories
    const allCategories = await db.select().from(categories);
    const categoryMap = new Map(allCategories.map(c => [c.slug, c]));

    // Determine which categories and locations to sync
    let categoriesToSync = categorySlug 
      ? allCategories.filter(c => c.slug === categorySlug)
      : allCategories;

    let citiesToSync: Array<{ name: string; stateCode: string }> = [];
    
    if (cityName && stateCode) {
      citiesToSync = [{ name: cityName, stateCode }];
    } else if (stateCode) {
      // Get all cities for this state
      const stateData = await db.select().from(states).where(eq(states.code, stateCode)).limit(1);
      if (stateData.length > 0) {
        const citiesInState = await db
          .select()
          .from(cities)
          .where(eq(cities.stateId, stateData[0].id))
          .limit(limit);
        citiesToSync = citiesInState.map(c => ({ name: c.name, stateCode }));
      }
    } else {
      // Get top cities from top states (limited)
      const topStates = await db.select().from(states).limit(limit);
      for (const state of topStates) {
        const topCities = await db
          .select()
          .from(cities)
          .where(eq(cities.stateId, state.id))
          .limit(2); // 2 cities per state to limit API calls
        citiesToSync.push(...topCities.map(c => ({ name: c.name, stateCode: state.code })));
      }
    }

    let totalInserted = 0;
    let totalSkipped = 0;
    const results: Record<string, Record<string, { inserted: number; skipped: number }>> = {};

    console.log(`💧 Starting multi-location sync for ${categoriesToSync.length} categories across ${citiesToSync.length} cities`);

    for (const category of categoriesToSync) {
      const queries = categorySearchQueries[category.slug] || ["water damage restoration Texas"];
      results[category.slug] = {};

      for (const city of citiesToSync) {
        const locationKey = `${city.name}, ${city.stateCode}`;
        results[category.slug][locationKey] = { inserted: 0, skipped: 0 };

        for (const query of queries) {
          try {
            const places = await searchGooglePlaces(query, city.name, city.stateCode);

            for (const place of places) {
              // Check if business already exists
              const existing = await db
                .select()
                .from(businesses)
                .where(eq(businesses.googlePlaceId, place.place_id))
                .limit(1);

              if (existing.length > 0) {
                results[category.slug][locationKey].skipped++;
                totalSkipped++;
                continue;
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

              // Parse address
              const address = place.formatted_address || place.vicinity || "";
              const addressParts = address.split(",").map((p) => p.trim());
              const zipMatch = addressParts.find((p) => /\b\d{5}(?:-\d{4})?\b/.test(p));
              const zip = zipMatch?.match(/\b\d{5}(?:-\d{4})?\b/)?.[0] || "";

              // Store thumbnail photo
              const thumbnailPhoto = place.photos?.[0]?.photo_reference || null;

              // Insert business
              await db.insert(businesses).values({
                googlePlaceId: place.place_id,
                name: place.name,
                slug,
                address: addressParts[0] || address,
                city: city.name,
                state: city.stateCode,
                zip,
                lat: place.geometry.location.lat.toString(),
                lng: place.geometry.location.lng.toString(),
                categoryId: category.id,
                ratingAvg: place.rating?.toString() || "0",
                reviewCount: place.user_ratings_total || 0,
                priceLevel: place.price_level,
                photos: thumbnailPhoto ? [thumbnailPhoto] : [],
                isVerified: true,
                isFeatured: (place.rating || 0) >= 4.5 && (place.user_ratings_total || 0) >= 50,
              });

              results[category.slug][locationKey].inserted++;
              totalInserted++;
            }

            // Rate limiting delay
            await new Promise((resolve) => setTimeout(resolve, 500));
          } catch (error) {
            console.error(`Error syncing ${query} in ${locationKey}:`, error);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      inserted: totalInserted,
      skipped: totalSkipped,
      categoriesSynced: categoriesToSync.length,
      citiesSynced: citiesToSync.length,
      results,
      message: `Synced ${totalInserted} new water damage businesses across ${citiesToSync.length} cities, skipped ${totalSkipped} existing`,
    });
  } catch (error) {
    console.error("Error in multi-location sync:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to sync" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "POST to sync water damage restoration businesses across Texas locations",
    parameters: {
      stateCode: "Optional: 2-letter state code (e.g., 'TX')",
      cityName: "Optional: City name (requires stateCode)",
      categorySlug: "Optional: Specific category slug",
      limit: "Optional: Limit cities per state (default: 5)",
    },
    examples: [
      { stateCode: "TX", limit: 10 },
      { stateCode: "TX", cityName: "Houston" },
      { categorySlug: "water-damage-restoration", limit: 3 },
    ],
  });
}

