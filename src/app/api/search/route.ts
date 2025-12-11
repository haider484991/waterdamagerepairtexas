import { NextResponse } from "next/server";
import { db, businesses, categories } from "@/lib/db";
import { eq, desc, asc, and, gte, sql, ilike, or } from "drizzle-orm";
import { enrichBusinesses, BusinessData } from "@/lib/hybrid-data";
import {
  GooglePlaceResult,
  autoSyncGooglePlaces,
  getOrCreateCategory,
} from "@/lib/auto-sync";
import slugify from "slugify";

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// Parse city and state from Google Places formatted address
function parseCityState(formattedAddress: string): { city: string; state: string; zip: string | null } {
  const parts = formattedAddress.split(",").map(p => p.trim());
  let city = "Unknown";
  let state = "XX";
  let zip: string | null = null;
  
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

// Detect pickleball category from Google place types and name
function detectCategorySlug(types: string[] | undefined, placeName?: string): string | null {
  const name = (placeName || "").toLowerCase();
  
  // Check for pickleball-specific keywords in name
  if (name.includes("pickleball")) {
    if (name.includes("court") || name.includes("center") || name.includes("facility") || name.includes("recreation")) {
      return "pickleball-courts-facilities";
    }
    if (name.includes("club") || name.includes("league") || name.includes("association")) {
      return "pickleball-clubs-leagues";
    }
    if (name.includes("store") || name.includes("shop") || name.includes("equipment") || name.includes("pro shop")) {
      return "pickleball-equipment-stores";
    }
    if (name.includes("coach") || name.includes("lesson") || name.includes("instructor") || name.includes("academy") || name.includes("training")) {
      return "pickleball-coaches-instructors";
    }
    if (name.includes("tournament") || name.includes("championship") || name.includes("event")) {
      return "pickleball-tournaments-events";
    }
    // Default to courts if just "pickleball" in name
    return "pickleball-courts-facilities";
  }
  
  // Check Google place types
  if (!types) return "pickleball-courts-facilities"; // Default for pickleball searches
  
  const typeToCategory: Record<string, string> = {
    gym: "pickleball-courts-facilities",
    health: "pickleball-courts-facilities",
    stadium: "pickleball-courts-facilities",
    park: "pickleball-courts-facilities",
    sports_complex: "pickleball-courts-facilities",
    recreation_center: "pickleball-courts-facilities",
    store: "pickleball-equipment-stores",
    sporting_goods_store: "pickleball-equipment-stores",
    school: "pickleball-coaches-instructors",
  };

  for (const type of types) {
    if (typeToCategory[type]) {
      return typeToCategory[type];
    }
  }

  // Default to courts for pickleball searches
  return "pickleball-courts-facilities";
}

// Search Google Places and auto-sync to database
async function searchGoogleAndSync(query: string): Promise<{
  results: BusinessData[];
  synced: boolean;
  syncedCount?: number;
}> {
  if (!GOOGLE_PLACES_API_KEY || !query) {
    return { results: [], synced: false };
  }

  try {
    // Search for pickleball-related results in USA only
    const searchQuery = query.toLowerCase().includes("pickleball") 
      ? `${query} USA`
      : `${query} pickleball USA`;
    
    const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
    url.searchParams.set("query", searchQuery);
    url.searchParams.set("region", "us"); // Bias results to USA
    url.searchParams.set("key", GOOGLE_PLACES_API_KEY);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== "OK" || !data.results) {
      console.log(`[Search API] Google returned ${data.status} for "${query}"`);
      return { results: [], synced: false };
    }

    // Filter to only US results
    const usStates = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'];
    const places: GooglePlaceResult[] = data.results.filter((place: GooglePlaceResult) => {
      const address = place.formatted_address || "";
      // Check if address contains USA or a US state abbreviation
      const isUS = address.includes("USA") || 
                   address.includes("United States") ||
                   usStates.some(state => address.includes(`, ${state} `) || address.includes(`, ${state},`) || address.endsWith(`, ${state}`));
      if (!isUS) {
        console.log(`[Search API] Filtered out non-US result: ${place.name} (${address})`);
      }
      return isUS;
    });

    console.log(`[Search API] Found ${places.length} US results out of ${data.results.length} total`);

    // Group places by detected category for sync
    const placesByCategory = new Map<string | null, GooglePlaceResult[]>();
    for (const place of places) {
      const categorySlug = detectCategorySlug(place.types, place.name);
      if (!placesByCategory.has(categorySlug)) {
        placesByCategory.set(categorySlug, []);
      }
      placesByCategory.get(categorySlug)!.push(place);
    }

    // AUTO-SYNC: Save to database (await to ensure it completes)
    console.log(`[Search API] Auto-syncing ${places.length} places from search "${query}"`);
    
    let totalSynced = 0;
    for (const [categorySlug, categoryPlaces] of placesByCategory) {
      try {
        let categoryId: string | null = null;
        if (categorySlug) {
          categoryId = await getOrCreateCategory(categorySlug);
          console.log(`[Search API] Got category ID ${categoryId} for ${categorySlug}`);
        }
        const syncResult = await autoSyncGooglePlaces(categoryPlaces, categoryId || undefined);
        totalSynced += syncResult.saved;
        console.log(`[Search API] Synced ${syncResult.saved} new, ${syncResult.skipped} existing for category ${categorySlug}`);
      } catch (err) {
        console.error("[Search API] Auto-sync error:", err);
      }
    }
    console.log(`[Search API] Total new businesses synced: ${totalSynced}`);

    // Format for immediate display - use proper slugs
    const results: BusinessData[] = places.slice(0, 20).map((place) => {
      const address = place.formatted_address || place.vicinity || "";
      const { city, state, zip } = parseCityState(address);
      const addressParts = address.split(",").map(p => p.trim());
      
      return {
        id: place.place_id, // Use place_id as the ID for linking
        googlePlaceId: place.place_id,
        name: place.name,
        slug: place.place_id, // Use place_id as slug for detail page linking
        description: null,
        address: addressParts[0] || address,
        city,
        state,
        zip,
        phone: null,
        website: null,
        email: null,
        lat: place.geometry.location.lat.toString(),
        lng: place.geometry.location.lng.toString(),
        neighborhood: null,
        hours: null,
        photos: place.photos?.slice(0, 3).map((p) => p.photo_reference) || [],
        priceLevel: place.price_level ?? null,
        ratingAvg: place.rating?.toString() || "0",
        reviewCount: place.user_ratings_total || 0,
        isVerified: false,
        isFeatured: (place.rating || 0) >= 4.5,
        category: null,
        isOpenNow: place.opening_hours?.open_now,
        dataSource: "google" as const,
      };
    });

    return { results, synced: true, syncedCount: totalSynced };
  } catch (error) {
    console.error("[Search API] Google search error:", error);
    return { results: [], synced: false };
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const query = searchParams.get("q") || "";
    const categorySlug = searchParams.get("category") || "all";
    const stateFilter = searchParams.get("state") || "all";
    const minRating = parseFloat(searchParams.get("rating") || "0");
    const sortBy = searchParams.get("sort") || "relevance";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const enrichPhotos = searchParams.get("enrich") !== "false";

    const offset = (page - 1) * limit;

    // Build conditions for database search
    const conditions = [];

    if (query) {
      // Split query into words for better matching
      const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 1);
      const queryConditions = queryWords.map(word => 
        or(
          ilike(businesses.name, `%${word}%`),
          ilike(businesses.description, `%${word}%`),
          ilike(businesses.address, `%${word}%`)
        )
      );
      
      if (queryConditions.length > 0) {
        // Match ANY of the words (OR)
        conditions.push(or(...queryConditions));
      }
    }

    // State filter
    if (stateFilter && stateFilter !== "all") {
      conditions.push(eq(businesses.state, stateFilter));
    }

    if (minRating > 0) {
      conditions.push(gte(businesses.ratingAvg, minRating.toString()));
    }

    // Add category filter if specified
    if (categorySlug && categorySlug !== "all") {
      conditions.push(eq(categories.slug, categorySlug));
    }

    // Determine sort order
    let orderByClause;
    switch (sortBy) {
      case "rating":
        orderByClause = [desc(businesses.ratingAvg)];
        break;
      case "reviews":
        orderByClause = [desc(businesses.reviewCount)];
        break;
      case "name":
        orderByClause = [asc(businesses.name)];
        break;
      case "newest":
        orderByClause = [desc(businesses.createdAt)];
        break;
      default:
        orderByClause = [
          desc(businesses.isFeatured),
          desc(businesses.ratingAvg),
          desc(businesses.reviewCount)
        ];
    }

    // Build and execute query
    const baseQuery = db
      .select({
        business: businesses,
        category: categories,
      })
      .from(businesses)
      .leftJoin(categories, eq(businesses.categoryId, categories.id));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await baseQuery
      .where(whereClause)
      .orderBy(...orderByClause)
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(businesses)
      .leftJoin(categories, eq(businesses.categoryId, categories.id))
      .where(whereClause);
    let total = Number(countResult[0]?.count || 0);

    // Format results
    let formattedResults: BusinessData[] = results.map((r) => ({
      ...r.business,
      photos: (r.business.photos as string[]) || [],
      hours: r.business.hours as Record<string, string> | null,
      category: r.category
        ? {
            name: r.category.name,
            slug: r.category.slug,
            section: r.category.section,
          }
        : null,
    }));

    let dataSource: "database" | "google" | "hybrid" = "database";
    let autoSynced = false;

    // Always search Google for new data when there's a query
    // This ensures we continuously grow the database with new searches
    const shouldSearchGoogle = query && GOOGLE_PLACES_API_KEY;
    
    if (shouldSearchGoogle) {
      console.log(`[Search API] DB has ${formattedResults.length} results for "${query}", also searching Google to find new data...`);
      
      const googleData = await searchGoogleAndSync(query);

      if (googleData.results.length > 0) {
        if (formattedResults.length === 0) {
          // No DB results, use Google results
          let filtered = googleData.results;

          // Filter by state if specified
          if (stateFilter && stateFilter !== "all") {
            filtered = filtered.filter((b) => b.state === stateFilter);
          }

          if (minRating > 0) {
            filtered = filtered.filter((b) => parseFloat(b.ratingAvg || "0") >= minRating);
          }

          // Apply sorting
          switch (sortBy) {
            case "rating":
              filtered.sort(
                (a, b) => parseFloat(b.ratingAvg || "0") - parseFloat(a.ratingAvg || "0")
              );
              break;
            case "reviews":
              filtered.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
              break;
            case "name":
              filtered.sort((a, b) => a.name.localeCompare(b.name));
              break;
            default:
              filtered.sort(
                (a, b) => parseFloat(b.ratingAvg || "0") - parseFloat(a.ratingAvg || "0")
              );
          }

          formattedResults = filtered.slice(offset, offset + limit);
          total = filtered.length;
          dataSource = "google";
          autoSynced = googleData.synced;
        } else {
          // Merge Google results with DB results (avoiding duplicates)
          const existingPlaceIds = new Set(
            formattedResults.map((b) => b.googlePlaceId).filter(Boolean)
          );
          
          const newGoogleResults = googleData.results.filter(
            (b) => !existingPlaceIds.has(b.googlePlaceId)
          );
          
          if (newGoogleResults.length > 0) {
            formattedResults = [...formattedResults, ...newGoogleResults.slice(0, limit - formattedResults.length)];
            total = formattedResults.length;
            dataSource = "hybrid";
            autoSynced = googleData.synced;
          }
        }
      }
    }

    // Enrich with Google data if from database
    let enrichedResults = formattedResults;
    if (enrichPhotos && formattedResults.length > 0 && dataSource === "database") {
      try {
        enrichedResults = await enrichBusinesses(formattedResults, {
          limit: 8,
          parallel: true,
        });
        dataSource = "hybrid";
      } catch (error) {
        console.error("Enrichment failed, using database data:", error);
        enrichedResults = formattedResults.map((b) => ({
          ...b,
          dataSource: "database" as const,
        }));
      }
    }

    return NextResponse.json({
      data: enrichedResults,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + enrichedResults.length < total,
      },
      meta: {
        query,
        filters: {
          category: categorySlug,
          state: stateFilter,
          minRating,
        },
        sort: sortBy,
      },
      dataSource,
      autoSynced,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      {
        error: "Search failed",
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      },
      { status: 500 }
    );
  }
}
