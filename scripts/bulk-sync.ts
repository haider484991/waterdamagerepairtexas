#!/usr/bin/env tsx
/**
 * Bulk Sync CLI Script
 * Fetches thousands of pickleball businesses across USA using Google Places API
 * 
 * Usage: npx tsx scripts/bulk-sync.ts [options]
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as dotenv from "dotenv";
import { db, categories, businesses, syncJobs } from "../src/lib/db/index";
import { eq } from "drizzle-orm";
import slugify from "slugify";
import { TOP_25_STATES, MAJOR_CITIES } from "../src/lib/location-data";
import { mapGoogleCategoryToPickleball } from "../src/lib/google-places";

dotenv.config({ path: ".env.local" });

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

async function searchGooglePlaces(query: string, cityName: string, stateCode: string): Promise<{ places: GooglePlace[]; nextPageToken?: string }> {
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

async function fetchAllPages(query: string, cityName: string, stateCode: string): Promise<GooglePlace[]> {
  const allPlaces: GooglePlace[] = [];
  let pageToken: string | undefined;
  let pageCount = 0;
  const maxPages = 3;

  const firstPage = await searchGooglePlaces(query, cityName, stateCode);
  allPlaces.push(...firstPage.places);
  pageToken = firstPage.nextPageToken;
  pageCount++;

  while (pageToken && pageCount < maxPages) {
    const nextPage = await getNextPageResults(pageToken);
    allPlaces.push(...nextPage.places);
    pageToken = nextPage.nextPageToken;
    pageCount++;
  }

  return allPlaces;
}

// Parallel worker function
async function processCity(
  city: { name: string; stateCode: string; stateName: string },
  queries: string[],
  categoryMap: Map<string, string>
): Promise<{ inserted: number; skipped: number; apiCalls: number }> {
  let inserted = 0;
  let skipped = 0;
  let apiCalls = 0;
  const businessesToInsert: any[] = [];
  const seenPlaceIds = new Set<string>();
  const seenSlugs = new Set<string>(); // Track slugs in current batch

  for (const query of queries) {
    try {
      const places = await fetchAllPages(query, city.name, city.stateCode);
      apiCalls += Math.min(3, Math.ceil(places.length / 20));

      for (const place of places) {
        if (seenPlaceIds.has(place.place_id)) continue;
        seenPlaceIds.add(place.place_id);

        const existing = await db
          .select({ id: businesses.id })
          .from(businesses)
          .where(eq(businesses.googlePlaceId, place.place_id))
          .limit(1);

        if (existing.length > 0) {
          skipped++;
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

        const address = place.formatted_address || place.vicinity || "";
        const addressParts = address.split(",").map(p => p.trim());
        const { city: parsedCity, state: parsedState, zip } = parseCityState(address, city.name, city.stateCode);
        const thumbnailPhoto = place.photos?.[0]?.photo_reference || null;

        // Detect the correct category based on business name and Google types
        const detectedCategorySlug = mapGoogleCategoryToPickleball(
          place.types || [],
          place.name
        ) || "pickleball-courts-facilities"; // Default to courts if can't detect
        
        const categoryId = categoryMap.get(detectedCategorySlug) || categoryMap.get("pickleball-courts-facilities")!;

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

        inserted++;
      }

      await new Promise(r => setTimeout(r, 300));
    } catch (error) {
      console.error(`  ❌ Error syncing ${query} in ${city.name}:`, error);
    }
  }

  // Batch insert
  if (businessesToInsert.length > 0) {
    const chunkSize = 50;
    for (let i = 0; i < businessesToInsert.length; i += chunkSize) {
      const chunk = businessesToInsert.slice(i, i + chunkSize);
      try {
        await db.insert(businesses).values(chunk);
        // Clear seen slugs for successfully inserted businesses
        chunk.forEach(b => seenSlugs.delete(b.slug));
      } catch (error: any) {
        console.error(`  ❌ Batch insert error:`, error);
        // Fallback to individual inserts with better error handling
        for (const business of chunk) {
          try {
            await db.insert(businesses).values(business);
            seenSlugs.delete(business.slug);
          } catch (err: any) {
            // If it's a duplicate slug error, skip it
            if (err?.code === '23505' && err?.constraint === 'businesses_slug_unique') {
              skipped++;
            }
            // Skip other errors silently
          }
        }
      }
    }
  }

  return { inserted, skipped, apiCalls };
}

async function main() {
  if (!GOOGLE_PLACES_API_KEY) {
    console.error("❌ GOOGLE_PLACES_API_KEY not found in .env.local");
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const maxStates = args.includes("--all") ? 25 : parseInt(args.find(a => a.startsWith("--states="))?.split("=")[1] || "25");
  const citiesPerState = parseInt(args.find(a => a.startsWith("--cities="))?.split("=")[1] || "6");
  const queriesPerCity = parseInt(args.find(a => a.startsWith("--queries="))?.split("=")[1] || "3");
  const stateCode = args.find(a => a.startsWith("--state="))?.split("=")[1];

  console.log("\n🏓 BULK SYNC CLI STARTED");
  console.log(`📍 Config: ${maxStates} states, ${citiesPerState} cities/state, ${queriesPerCity} queries/city\n`);

  const allCategories = await db.select().from(categories);
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
      console.error(`❌ Category ${slug} not found. Run category sync first.`);
      process.exit(1);
    }
  }

  const statesToSync = stateCode
    ? TOP_25_STATES.filter(s => s.code === stateCode)
    : TOP_25_STATES.slice(0, maxStates);

  const citiesToProcess: Array<{ name: string; stateCode: string; stateName: string }> = [];
  for (const state of statesToSync) {
    const citiesInState = MAJOR_CITIES
      .filter(c => c.stateCode === state.code)
      .sort((a, b) => b.population - a.population)
      .slice(0, citiesPerState);
    
    citiesToProcess.push(...citiesInState.map(c => ({
      name: c.name,
      stateCode: c.stateCode,
      stateName: state.name,
    })));
  }

  // Create sync job
  const [syncJob] = await db.insert(syncJobs).values({
    status: "running",
    totalCities: citiesToProcess.length,
    config: { maxStates, citiesPerState, queriesPerCity, stateCode: stateCode || undefined },
    startedAt: new Date(),
  }).returning();

  const queries = PICKLEBALL_QUERIES.slice(0, queriesPerCity);
  let totalInserted = 0;
  let totalSkipped = 0;
  let totalApiCalls = 0;
  let completedCities = 0;

  // Process cities in parallel (3 workers)
  const workerCount = 3;
  const queue = [...citiesToProcess];
  
  console.log(`🚀 Processing ${citiesToProcess.length} cities with ${workerCount} parallel workers...\n`);

  const workers = Array.from({ length: workerCount }, async () => {
    while (queue.length > 0) {
      const city = queue.shift();
      if (!city) break;

      const result = await processCity(city, queries, categoryMap);
      totalInserted += result.inserted;
      totalSkipped += result.skipped;
      totalApiCalls += result.apiCalls;
      completedCities++;

      console.log(`✅ ${city.name}, ${city.stateCode}: +${result.inserted} new, ${result.skipped} existing`);

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
        .where(eq(syncJobs.id, syncJob.id));
    }
  });

  await Promise.all(workers);

  // Mark as completed
  await db.update(syncJobs)
    .set({
      status: "completed",
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(syncJobs.id, syncJob.id));

  console.log(`\n🎉 SYNC COMPLETE!`);
  console.log(`📊 Total: ${totalInserted} inserted, ${totalSkipped} skipped`);
  console.log(`🔍 API calls: ${totalApiCalls}`);
  console.log(`💰 Estimated cost: $${(totalApiCalls * 0.017).toFixed(2)}\n`);

  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});

