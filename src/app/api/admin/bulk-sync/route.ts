import { NextResponse } from "next/server";
import { db, categories, businesses, syncJobs } from "@/lib/db";
import { eq } from "drizzle-orm";
import slugify from "slugify";
import { TOP_25_STATES, MAJOR_CITIES, type CityData } from "@/lib/location-data";
import { mapGoogleCategoryToPickleball } from "@/lib/google-places";

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
  types?: string[];
}

interface GooglePlacesResponse {
  results: GooglePlace[];
  next_page_token?: string;
  status: string;
}

// Pickleball search queries - optimized for all categories
const PICKLEBALL_QUERIES = [
  // Courts & Facilities
  "pickleball courts",
  "pickleball facilities",
  "indoor pickleball",
  "pickleball center",
  "pickleball recreation center",
  // Clubs & Leagues
  "pickleball club",
  "pickleball league",
  "pickleball association",
  // Equipment Stores
  "pickleball equipment",
  "pickleball store",
  "pickleball shop",
  "pickleball gear",
  // Coaches & Instructors
  "pickleball coach",
  "pickleball instructor",
  "pickleball lessons",
  "pickleball academy",
  // Tournaments & Events
  "pickleball tournament",
  "pickleball event",
  "pickleball championship",
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

async function searchGooglePlaces(
  query: string, 
  cityName: string, 
  stateCode: string,
  includePagination: boolean = true
): Promise<{ places: GooglePlace[]; nextPageToken?: string }> {
  if (!GOOGLE_PLACES_API_KEY) return { places: [] };

  try {
    const searchQuery = `${query} in ${cityName}, ${stateCode}`;
    const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
    url.searchParams.set("query", searchQuery);
    url.searchParams.set("key", GOOGLE_PLACES_API_KEY);

    const response = await fetch(url.toString());
    const data: GooglePlacesResponse = await response.json();

    if (data.status === "OK") {
      return {
        places: data.results || [],
        nextPageToken: data.next_page_token,
      };
    }
    return { places: [] };
  } catch (error) {
    console.error(`Search error for ${cityName}, ${stateCode}:`, error);
    return { places: [] };
  }
}

async function getNextPageResults(nextPageToken: string): Promise<{ places: GooglePlace[]; nextPageToken?: string }> {
  if (!GOOGLE_PLACES_API_KEY || !nextPageToken) return { places: [] };

  // Google requires a short delay before using next_page_token
  await new Promise(r => setTimeout(r, 2000));

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
    url.searchParams.set("pagetoken", nextPageToken);
    url.searchParams.set("key", GOOGLE_PLACES_API_KEY);

    const response = await fetch(url.toString());
    const data: GooglePlacesResponse = await response.json();

    if (data.status === "OK") {
      return {
        places: data.results || [],
        nextPageToken: data.next_page_token,
      };
    }
    return { places: [] };
  } catch {
    return { places: [] };
  }
}

// Fetch all pages for a search query (up to 3 pages = 60 results)
async function fetchAllPages(
  query: string,
  cityName: string,
  stateCode: string
): Promise<GooglePlace[]> {
  const allPlaces: GooglePlace[] = [];
  let pageToken: string | undefined;
  let pageCount = 0;
  const maxPages = 3; // Google allows up to 3 pages (60 results)

  // First page
  const firstPage = await searchGooglePlaces(query, cityName, stateCode, true);
  allPlaces.push(...firstPage.places);
  pageToken = firstPage.nextPageToken;
  pageCount++;

  // Subsequent pages
  while (pageToken && pageCount < maxPages) {
    const nextPage = await getNextPageResults(pageToken);
    allPlaces.push(...nextPage.places);
    pageToken = nextPage.nextPageToken;
    pageCount++;
  }

  return allPlaces;
}

export async function POST(request: Request) {
  let syncJobId: string | null = null;
  
  try {
    if (!GOOGLE_PLACES_API_KEY) {
      return NextResponse.json({ error: "Google Places API key not configured" }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const { 
      stateCode,           // Optional: sync specific state (legacy support)
      selectedStates,      // Array of state codes to sync
      selectedCities,      // Array of city names to sync (overrides citiesPerState)
      maxStates = 25,      // How many states to sync (if no states/cities selected)
      citiesPerState = 6,  // How many cities per state (if no specific cities selected)
      queriesPerCity = 3,  // How many search queries per city
    } = body;

    // Create sync job record
    const [syncJob] = await db.insert(syncJobs).values({
      status: "running",
      config: {
        maxStates,
        citiesPerState,
        queriesPerCity,
        stateCode: stateCode || undefined,
        selectedStates: selectedStates || undefined,
        selectedCities: selectedCities || undefined,
      },
      startedAt: new Date(),
    }).returning();
    
    syncJobId = syncJob.id;

    // Get all pickleball categories
    const allCategories = await db.select().from(categories);
    
    if (allCategories.length === 0) {
      return NextResponse.json({ error: "No categories found. Run category sync first." }, { status: 400 });
    }
    
    // Create a map of category slugs to IDs
    const categoryMap = new Map(allCategories.map(c => [c.slug, c.id]));
    
    // Verify all categories exist
    const requiredCategories = [
      "pickleball-courts-facilities",
      "pickleball-clubs-leagues",
      "pickleball-equipment-stores",
      "pickleball-coaches-instructors",
      "pickleball-tournaments-events",
    ];
    
    for (const slug of requiredCategories) {
      if (!categoryMap.has(slug)) {
        return NextResponse.json({ error: `Category ${slug} not found. Run category sync first.` }, { status: 400 });
      }
    }

    // Determine which states and cities to sync
    let statesToSync: typeof TOP_25_STATES = [];
    let citiesToSync: Array<{ name: string; stateCode: string }> = [];

    if (selectedCities && selectedCities.length > 0) {
      // If specific cities are selected, use those
      citiesToSync = selectedCities.map((cityName: string) => {
        const cityData = MAJOR_CITIES.find(c => c.name === cityName);
        if (!cityData) {
          throw new Error(`City "${cityName}" not found in location data`);
        }
        return { name: cityData.name, stateCode: cityData.stateCode };
      });
      // Get unique states from selected cities
      const uniqueStateCodes = [...new Set(citiesToSync.map(c => c.stateCode))];
      statesToSync = TOP_25_STATES.filter(s => uniqueStateCodes.includes(s.code));
    } else if (selectedStates && selectedStates.length > 0) {
      // If specific states are selected, use those
      statesToSync = TOP_25_STATES.filter(s => selectedStates.includes(s.code));
    } else if (stateCode) {
      // Legacy support: single state code
      statesToSync = TOP_25_STATES.filter(s => s.code === stateCode);
    } else {
      // Default: all states up to maxStates
      statesToSync = TOP_25_STATES.slice(0, maxStates);
    }

    // Calculate total cities for progress tracking
    const totalCities = citiesToSync.length > 0
      ? citiesToSync.length
      : statesToSync.reduce((sum, state) => {
          const citiesInState = MAJOR_CITIES.filter(c => c.stateCode === state.code).length;
          return sum + Math.min(citiesInState, citiesPerState);
        }, 0);

    // Update sync job with total cities
    await db.update(syncJobs)
      .set({ totalCities })
      .where(eq(syncJobs.id, syncJobId));

    let totalInserted = 0;
    let totalSkipped = 0;
    let totalApiCalls = 0;
    let completedCities = 0;
    const stateResults: Record<string, { inserted: number; skipped: number; cities: string[] }> = {};
    const businessesToInsert: Array<{
      googlePlaceId: string;
      name: string;
      slug: string;
      address: string;
      city: string;
      state: string;
      zip: string | null;
      lat: string;
      lng: string;
      categoryId: string;
      ratingAvg: string;
      reviewCount: number;
      priceLevel: number | null;
      photos: string[];
      isVerified: boolean;
      isFeatured: boolean;
    }> = [];
    const seenPlaceIds = new Set<string>();
    const seenSlugs = new Set<string>(); // Track slugs in current batch

    console.log(`\n🏓 BULK SYNC STARTED (Job ID: ${syncJobId})`);
    console.log(`📍 Syncing ${statesToSync.length} states, ${citiesPerState} cities each`);
    console.log(`🔍 ${queriesPerCity} queries per city\n`);

    for (const state of statesToSync) {
      // Get cities for this state
      let citiesInState: typeof MAJOR_CITIES;
      
      if (citiesToSync.length > 0) {
        // Use selected cities for this state
        citiesInState = citiesToSync
          .filter(c => c.stateCode === state.code)
          .map(c => MAJOR_CITIES.find(mc => mc.name === c.name && mc.stateCode === c.stateCode))
          .filter((c): c is typeof MAJOR_CITIES[0] => c !== undefined);
      } else {
        // Use top N cities by population
        citiesInState = MAJOR_CITIES
          .filter(c => c.stateCode === state.code)
          .sort((a, b) => b.population - a.population)
          .slice(0, citiesPerState);
      }

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
            // Fetch all pages for this query (up to 60 results)
            const places = await fetchAllPages(query, city.name, state.code);
            totalApiCalls += Math.min(3, Math.ceil(places.length / 20)); // Estimate API calls

            for (const place of places) {
              // Skip duplicates within this sync batch
              if (seenPlaceIds.has(place.place_id)) {
                continue;
              }
              seenPlaceIds.add(place.place_id);

              // Check if already exists in database
              const existing = await db
                .select({ id: businesses.id })
                .from(businesses)
                .where(eq(businesses.googlePlaceId, place.place_id))
                .limit(1);

              if (existing.length > 0) {
                citySkipped++;
                continue;
              }

              // Generate unique slug - check both database and current batch
              const baseSlug = slugify(place.name, { lower: true, strict: true });
              let slug = baseSlug;
              let counter = 1;
              
              // Find unique slug - check current batch first (fast), then database
              while (true) {
                // First check if slug is already in current batch (fast check)
                if (!seenSlugs.has(slug)) {
                  // Then check database (slower, but necessary)
                  const existingSlug = await db
                    .select({ id: businesses.id })
                    .from(businesses)
                    .where(eq(businesses.slug, slug))
                    .limit(1);
                  
                  if (existingSlug.length === 0) {
                    // Slug is unique! Add to seen set and use it
                    seenSlugs.add(slug);
                    break;
                  }
                }
                
                // Slug exists, try next variation
                slug = `${baseSlug}-${counter}`;
                counter++;
                
                // Safety limit to prevent infinite loop
                if (counter > 1000) {
                  // Fallback: use googlePlaceId suffix for uniqueness
                  slug = `${baseSlug}-${place.place_id.slice(-8)}`;
                  if (!seenSlugs.has(slug)) {
                    seenSlugs.add(slug);
                    break;
                  }
                  // Even fallback exists, use timestamp
                  slug = `${baseSlug}-${Date.now().toString().slice(-6)}`;
                  seenSlugs.add(slug);
                  break;
                }
              }

              // Parse address
              const address = place.formatted_address || place.vicinity || "";
              const addressParts = address.split(",").map(p => p.trim());
              const { city: parsedCity, state: parsedState, zip } = parseCityState(address, city.name, state.code);

              const thumbnailPhoto = place.photos?.[0]?.photo_reference || null;

              // Detect the correct category based on business name and Google types
              const detectedCategorySlug = mapGoogleCategoryToPickleball(
                place.types || [],
                place.name
              ) || "pickleball-courts-facilities"; // Default to courts if can't detect
              
              const categoryId = categoryMap.get(detectedCategorySlug) || categoryMap.get("pickleball-courts-facilities")!;

              // Add to batch insert array
              businessesToInsert.push({
                googlePlaceId: place.place_id,
                name: place.name,
                slug,
                address: addressParts[0] || address,
                city: parsedCity,
                state: parsedState,
                zip: zip || null,
                lat: place.geometry.location.lat.toString(),
                lng: place.geometry.location.lng.toString(),
                categoryId,
                ratingAvg: place.rating?.toString() || "0",
                reviewCount: place.user_ratings_total || 0,
                priceLevel: place.price_level || null,
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

        // Batch insert businesses for this city (in chunks of 50)
        if (businessesToInsert.length > 0) {
          const chunkSize = 50;
          for (let i = 0; i < businessesToInsert.length; i += chunkSize) {
            const chunk = businessesToInsert.slice(i, i + chunkSize);
            try {
              await db.insert(businesses).values(chunk);
              // Clear seen slugs for successfully inserted businesses
              chunk.forEach(b => seenSlugs.delete(b.slug));
            } catch (error) {
              console.error(`Error batch inserting businesses:`, error);
              // Fallback to individual inserts for this chunk with better error handling
              for (const business of chunk) {
                try {
                  await db.insert(businesses).values(business);
                  seenSlugs.delete(business.slug);
                } catch (err: any) {
                  // If it's a duplicate slug error, try to generate a new unique slug
                  if (err?.code === '23505' && err?.constraint === 'businesses_slug_unique') {
                    console.error(`Duplicate slug detected for ${business.name}, skipping`);
                    citySkipped++;
                    totalSkipped++;
                  } else {
                    console.error(`Failed to insert ${business.name}:`, err);
                  }
                }
              }
            }
          }
          businessesToInsert.length = 0; // Clear array
        }

        if (cityInserted > 0 || citySkipped > 0) {
          console.log(`   📍 ${city.name}: +${cityInserted} new, ${citySkipped} existing`);
          stateResults[state.code].cities.push(city.name);
        }

        stateResults[state.code].inserted += cityInserted;
        stateResults[state.code].skipped += citySkipped;
        totalInserted += cityInserted;
        totalSkipped += citySkipped;
        completedCities++;

        // Update progress
        await db.update(syncJobs)
          .set({
            completedCities,
            totalBusinessesFound: totalInserted + totalSkipped,
            totalBusinessesInserted: totalInserted,
            totalBusinessesSkipped: totalSkipped,
            totalApiCalls,
            updatedAt: new Date(),
          })
          .where(eq(syncJobs.id, syncJobId));
      }

      console.log(`   ✅ ${state.code} total: +${stateResults[state.code].inserted} new`);
    }

    // Final batch insert any remaining businesses
    if (businessesToInsert.length > 0) {
      const chunkSize = 50;
      for (let i = 0; i < businessesToInsert.length; i += chunkSize) {
        const chunk = businessesToInsert.slice(i, i + chunkSize);
        try {
          await db.insert(businesses).values(chunk);
          chunk.forEach(b => seenSlugs.delete(b.slug));
        } catch (error: any) {
          console.error(`Error final batch inserting businesses:`, error);
          // Fallback to individual inserts
          for (const business of chunk) {
            try {
              await db.insert(businesses).values(business);
              seenSlugs.delete(business.slug);
            } catch (err: any) {
              if (err?.code === '23505' && err?.constraint === 'businesses_slug_unique') {
                console.error(`Duplicate slug detected for ${business.name}, skipping`);
                totalSkipped++;
              } else {
                console.error(`Failed to insert ${business.name}:`, err);
              }
            }
          }
        }
      }
    }

    // Mark sync job as completed
    await db.update(syncJobs)
      .set({
        status: "completed",
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(syncJobs.id, syncJobId));

    console.log(`\n🎉 BULK SYNC COMPLETE`);
    console.log(`📊 Total: ${totalInserted} inserted, ${totalSkipped} skipped`);
    console.log(`🔍 API calls made: ${totalApiCalls}\n`);

    return NextResponse.json({
      success: true,
      jobId: syncJobId,
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
    
    // Mark sync job as failed
    if (syncJobId) {
      await db.update(syncJobs)
        .set({
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "Unknown error",
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(syncJobs.id, syncJobId))
        .catch(() => {}); // Ignore errors updating failed job
    }
    
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
