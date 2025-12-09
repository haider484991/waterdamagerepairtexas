import { NextResponse } from "next/server";
import { db, categories, businesses } from "@/lib/db";
import { eq } from "drizzle-orm";
import slugify from "slugify";
import { TOP_25_STATES, MAJOR_CITIES } from "@/lib/location-data";

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
  photos?: Array<{ photo_reference: string }>;
}

// Pickleball search queries - optimized for maximum results
const PICKLEBALL_QUERIES = [
  "pickleball courts",
  "pickleball facilities",
  "indoor pickleball",
  "pickleball club",
  "pickleball center",
];

// Parse city and state from Google Places formatted address
function parseCityState(formattedAddress: string, fallbackCity: string, fallbackState: string): { city: string; state: string; zip: string } {
  const parts = formattedAddress.split(",").map(p => p.trim());
  let city = fallbackCity;
  let state = fallbackState;
  let zip = "";
  
  if (parts.length >= 3) {
    const stateZipPart = parts[parts.length - 2] || parts[parts.length - 1];
    const stateMatch = stateZipPart.match(/\b([A-Z]{2})\b/);
    if (stateMatch) state = stateMatch[1];
    const zipMatch = stateZipPart.match(/\b(\d{5})(?:-\d{4})?\b/);
    if (zipMatch) zip = zipMatch[1];
    const cityPart = parts[parts.length - 3];
    if (cityPart && !cityPart.match(/^\d/)) city = cityPart;
  }
  
  return { city, state, zip };
}

async function searchGooglePlaces(query: string, cityName: string, stateCode: string): Promise<GooglePlace[]> {
  if (!GOOGLE_PLACES_API_KEY) return [];

  try {
    const searchQuery = `${query} in ${cityName}, ${stateCode}`;
    const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
    url.searchParams.set("query", searchQuery);
    url.searchParams.set("key", GOOGLE_PLACES_API_KEY);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status === "OK") {
      return data.results || [];
    }
    return [];
  } catch (error) {
    console.error(`Search error for ${cityName}, ${stateCode}:`, error);
    return [];
  }
}

async function getNextPageResults(nextPageToken: string): Promise<GooglePlace[]> {
  if (!GOOGLE_PLACES_API_KEY || !nextPageToken) return [];

  // Google requires a short delay before using next_page_token
  await new Promise(r => setTimeout(r, 2000));

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
    url.searchParams.set("pagetoken", nextPageToken);
    url.searchParams.set("key", GOOGLE_PLACES_API_KEY);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status === "OK") {
      return data.results || [];
    }
    return [];
  } catch {
    return [];
  }
}

export async function POST(request: Request) {
  try {
    if (!GOOGLE_PLACES_API_KEY) {
      return NextResponse.json({ error: "Google Places API key not configured" }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const { 
      stateCode,           // Optional: sync specific state
      maxStates = 25,      // How many states to sync
      citiesPerState = 5,  // How many cities per state
      queriesPerCity = 2,  // How many search queries per city
    } = body;

    // Get all pickleball categories
    const allCategories = await db.select().from(categories);
    
    if (allCategories.length === 0) {
      return NextResponse.json({ error: "No categories found. Run category sync first." }, { status: 400 });
    }
    
    // Create a map of category slugs to IDs
    const categoryMap = new Map(allCategories.map(c => [c.slug, c.id]));
    const courtsCategory = allCategories.find(c => c.slug === "pickleball-courts-facilities");
    
    if (!courtsCategory) {
      return NextResponse.json({ error: "Pickleball courts category not found. Run category sync first." }, { status: 400 });
    }

    // Determine which states to sync
    let statesToSync = stateCode 
      ? TOP_25_STATES.filter(s => s.code === stateCode)
      : TOP_25_STATES.slice(0, maxStates);

    let totalInserted = 0;
    let totalSkipped = 0;
    let totalApiCalls = 0;
    const stateResults: Record<string, { inserted: number; skipped: number; cities: string[] }> = {};

    console.log(`\n🏓 BULK SYNC STARTED`);
    console.log(`📍 Syncing ${statesToSync.length} states, ${citiesPerState} cities each`);
    console.log(`🔍 ${queriesPerCity} queries per city\n`);

    for (const state of statesToSync) {
      // Get cities for this state
      const citiesInState = MAJOR_CITIES
        .filter(c => c.stateCode === state.code)
        .sort((a, b) => b.population - a.population)
        .slice(0, citiesPerState);

      if (citiesInState.length === 0) {
        console.log(`⚠️ No cities found for ${state.name}, skipping`);
        continue;
      }

      stateResults[state.code] = { inserted: 0, skipped: 0, cities: [] };
      console.log(`\n📍 ${state.name} (${state.code}) - ${citiesInState.length} cities`);

      for (const city of citiesInState) {
        const queriesToUse = PICKLEBALL_QUERIES.slice(0, queriesPerCity);
        let cityInserted = 0;
        let citySkipped = 0;

        for (const query of queriesToUse) {
          try {
            const places = await searchGooglePlaces(query, city.name, state.code);
            totalApiCalls++;

            for (const place of places) {
              // Check if already exists
              const existing = await db
                .select({ id: businesses.id })
                .from(businesses)
                .where(eq(businesses.googlePlaceId, place.place_id))
                .limit(1);

              if (existing.length > 0) {
                citySkipped++;
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

              // Parse address
              const address = place.formatted_address || place.vicinity || "";
              const addressParts = address.split(",").map(p => p.trim());
              const { city: parsedCity, state: parsedState, zip } = parseCityState(address, city.name, state.code);

              const thumbnailPhoto = place.photos?.[0]?.photo_reference || null;

              // Insert business
              await db.insert(businesses).values({
                googlePlaceId: place.place_id,
                name: place.name,
                slug,
                address: addressParts[0] || address,
                city: parsedCity,
                state: parsedState,
                zip,
                lat: place.geometry.location.lat.toString(),
                lng: place.geometry.location.lng.toString(),
                categoryId: courtsCategory.id,
                ratingAvg: place.rating?.toString() || "0",
                reviewCount: place.user_ratings_total || 0,
                priceLevel: place.price_level,
                photos: thumbnailPhoto ? [thumbnailPhoto] : [],
                isVerified: true,
                isFeatured: (place.rating || 0) >= 4.5 && (place.user_ratings_total || 0) >= 50,
              });

              cityInserted++;
            }

            // Rate limiting - be nice to Google API
            await new Promise(r => setTimeout(r, 300));
          } catch (error) {
            console.error(`Error syncing ${query} in ${city.name}:`, error);
          }
        }

        if (cityInserted > 0 || citySkipped > 0) {
          console.log(`   📍 ${city.name}: +${cityInserted} new, ${citySkipped} existing`);
          stateResults[state.code].cities.push(city.name);
        }

        stateResults[state.code].inserted += cityInserted;
        stateResults[state.code].skipped += citySkipped;
        totalInserted += cityInserted;
        totalSkipped += citySkipped;
      }

      console.log(`   ✅ ${state.code} total: +${stateResults[state.code].inserted} new`);
    }

    console.log(`\n🎉 BULK SYNC COMPLETE`);
    console.log(`📊 Total: ${totalInserted} inserted, ${totalSkipped} skipped`);
    console.log(`🔍 API calls made: ${totalApiCalls}\n`);

    return NextResponse.json({
      success: true,
      summary: {
        totalInserted,
        totalSkipped,
        statesSynced: Object.keys(stateResults).length,
        apiCallsMade: totalApiCalls,
      },
      byState: stateResults,
      message: `Synced ${totalInserted} pickleball businesses across ${Object.keys(stateResults).length} states`,
    });
  } catch (error) {
    console.error("Bulk sync error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Bulk sync failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const stateCount = TOP_25_STATES.length;
  const cityCount = MAJOR_CITIES.length;

  return NextResponse.json({
    endpoint: "Bulk Sync - Populate database with pickleball businesses",
    availableData: {
      states: stateCount,
      cities: cityCount,
    },
    usage: {
      method: "POST",
      body: {
        stateCode: "Optional: 2-letter state code to sync single state",
        maxStates: "Number of states to sync (default: 25)",
        citiesPerState: "Cities per state (default: 5)",
        queriesPerCity: "Search queries per city (default: 2)",
      },
    },
    examples: [
      { description: "Sync all states (full sync)", body: {} },
      { description: "Sync Texas only", body: { stateCode: "TX" } },
      { description: "Sync top 10 states, 3 cities each", body: { maxStates: 10, citiesPerState: 3 } },
      { description: "Quick test - 5 states, 2 cities", body: { maxStates: 5, citiesPerState: 2, queriesPerCity: 1 } },
    ],
    estimatedApiCalls: {
      fullSync: `${stateCount} states × 5 cities × 2 queries = ${stateCount * 5 * 2} calls`,
      quickSync: "5 states × 2 cities × 1 query = 10 calls",
    },
  });
}
