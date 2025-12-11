import { NextResponse } from "next/server";
import { db, businesses, categories } from "@/lib/db";
import { eq, desc, asc, and, gte, ilike, or, sql } from "drizzle-orm";
import { enrichBusinesses, BusinessData } from "@/lib/hybrid-data";
import {
  searchAndSync,
  categorySearchQueries,
  GooglePlaceResult,
  autoSyncGooglePlaces,
} from "@/lib/auto-sync";

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// Helper function to parse city and state from address
function parseCityState(formattedAddress: string): { city: string; state: string } {
  // Try to extract city and state from formatted address
  // Format is usually: "Address, City, State ZIP, Country"
  const parts = formattedAddress.split(",").map(s => s.trim());
  if (parts.length >= 3) {
    const statePart = parts[parts.length - 2]; // Usually "State ZIP"
    const stateMatch = statePart.match(/\b([A-Z]{2})\b/);
    const state = stateMatch ? stateMatch[1] : "";
    const city = parts[parts.length - 3] || "";
    return { city, state };
  }
  return { city: "", state: "" };
}

// Fetch from Google and auto-sync to database
async function fetchAndSyncGooglePlaces(
  categorySlug: string,
  categoryName: string,
  categoryId: string,
  stateFilter?: string,
  cityFilter?: string
): Promise<BusinessData[]> {
  if (!GOOGLE_PLACES_API_KEY) return [];

  const queries = categorySearchQueries[categorySlug] || [categoryName];
  const allPlaces: GooglePlaceResult[] = [];

  try {
    // Build location query
    let locationQuery = "";
    if (cityFilter && cityFilter !== "all" && stateFilter && stateFilter !== "all") {
      locationQuery = `${cityFilter}, ${stateFilter}`;
    } else if (stateFilter && stateFilter !== "all") {
      locationQuery = stateFilter;
    } else {
      locationQuery = "United States"; // Default to US-wide search
    }

    // Fetch from each query
    for (const query of queries.slice(0, 3)) {
      const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
      url.searchParams.set("query", `${query} in ${locationQuery}`);
      url.searchParams.set("key", GOOGLE_PLACES_API_KEY);

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.status === "OK" && data.results) {
        allPlaces.push(...data.results);
      }
    }

    // Deduplicate by place_id
    const uniquePlaces = allPlaces.filter(
      (place, index, self) =>
        index === self.findIndex((p) => p.place_id === place.place_id)
    );

    // AUTO-SYNC: Save to database in background
    console.log(`[Category API] Auto-syncing ${uniquePlaces.length} places for ${categoryName}`);
    autoSyncGooglePlaces(uniquePlaces, categoryId).catch((err) =>
      console.error("[Category API] Auto-sync error:", err)
    );

    // Return formatted for immediate display
    return uniquePlaces.slice(0, 20).map((place, index) => {
      const { city, state } = parseCityState(place.formatted_address || place.vicinity || "");
      return {
        id: `temp-${place.place_id}`,
        googlePlaceId: place.place_id,
        name: place.name,
        slug: `${place.place_id.substring(0, 20)}-${index}`,
        description: null,
        address: place.formatted_address || place.vicinity || "",
        city: city || "",
        state: state || "",
        zip: null,
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
        category: {
          name: categoryName,
          slug: categorySlug,
          section: null,
        },
        isOpenNow: place.opening_hours?.open_now,
        dataSource: "google" as const,
      };
    });
  } catch (error) {
    console.error("Error fetching Google Places:", error);
    return [];
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);

    const state = searchParams.get("state") || "all";
    const city = searchParams.get("city") || "all";
    const minRating = parseFloat(searchParams.get("rating") || "0");
    const priceLevel = parseInt(searchParams.get("price") || "0");
    const sortBy = searchParams.get("sort") || "relevance";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const enrichPhotos = searchParams.get("enrich") !== "false";
    
    // Category-specific filters
    const facilityType = searchParams.get("facilityType") || "all";
    const courtSurface = searchParams.get("courtSurface") || "all";
    const membershipType = searchParams.get("membershipType") || "all";
    const skillLevel = searchParams.get("skillLevel") || "all";

    const offset = (page - 1) * limit;

    // Get category
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Build conditions for businesses
    const conditions = [eq(businesses.categoryId, category.id)];

    // State filter
    if (state && state !== "all") {
      conditions.push(eq(businesses.state, state));
    }

    // City filter
    if (city && city !== "all") {
      conditions.push(eq(businesses.city, city));
    }

    if (minRating > 0) {
      conditions.push(gte(businesses.ratingAvg, minRating.toString()));
    }

    if (priceLevel > 0) {
      conditions.push(eq(businesses.priceLevel, priceLevel));
    }
    
    // Note: Category-specific filters (facilityType, courtSurface, etc.) 
    // would need to be stored in business metadata or a separate table
    // For now, we'll filter client-side if needed

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
    const businessResults = await db
      .select()
      .from(businesses)
      .where(and(...conditions))
      .orderBy(...orderByClause)
      .limit(limit)
      .offset(offset);

    // Get total count from database
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(businesses)
      .where(and(...conditions));

    let total = Number(countResult?.count || 0);
    let dataSource: "database" | "google" | "hybrid" = "database";

    // Format results from database
    let formattedResults: BusinessData[] = businessResults.map((b) => ({
      ...b,
      photos: (b.photos as string[]) || [],
      hours: b.hours as Record<string, string> | null,
      category: {
        name: category.name,
        slug: category.slug,
        section: category.section,
      },
    }));

    // If database is empty, fetch from Google and AUTO-SYNC
    if (formattedResults.length === 0 && GOOGLE_PLACES_API_KEY) {
      console.log(`[Category API] No DB results for ${category.name}, fetching from Google...`);
      
      const googleResults = await fetchAndSyncGooglePlaces(slug, category.name, category.id, state, city);

      if (googleResults.length > 0) {
        // Apply client-side filtering for Google results
        let filtered = googleResults;

        // State filter
        if (state && state !== "all") {
          filtered = filtered.filter((b) => b.state === state);
        }

        // City filter
        if (city && city !== "all") {
          filtered = filtered.filter((b) => b.city === city);
        }

        if (minRating > 0) {
          filtered = filtered.filter((b) => parseFloat(b.ratingAvg || "0") >= minRating);
        }

        if (priceLevel > 0) {
          filtered = filtered.filter((b) => b.priceLevel === priceLevel);
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
      }
    }

    // Hybrid enrichment for DB results
    let enrichedResults = formattedResults;
    if (enrichPhotos && formattedResults.length > 0 && dataSource === "database") {
      try {
        enrichedResults = await enrichBusinesses(formattedResults, {
          limit: 8,
          parallel: true,
        });
        dataSource = "hybrid";
      } catch (error) {
        console.error("Enrichment failed:", error);
        enrichedResults = formattedResults.map((b) => ({
          ...b,
          dataSource: "database" as const,
        }));
      }
    }

    // Get subcategories if any
    const subcategories = await db
      .select()
      .from(categories)
      .where(eq(categories.parentId, category.id));

    // Get category stats
    const [statsResult] = await db
      .select({
        avgRating: sql<number>`COALESCE(AVG(CAST(${businesses.ratingAvg} AS DECIMAL)), 0)`,
        totalReviews: sql<number>`COALESCE(SUM(${businesses.reviewCount}), 0)`,
      })
      .from(businesses)
      .where(eq(businesses.categoryId, category.id));

    return NextResponse.json({
      category: {
        ...category,
        businessCount: total,
        avgRating: Number(statsResult?.avgRating || 0).toFixed(1),
        totalReviews: Number(statsResult?.totalReviews || 0),
      },
      subcategories,
      businesses: enrichedResults,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + enrichedResults.length < total,
      },
      filters: {
        state,
        city,
        minRating,
        priceLevel,
        sort: sortBy,
        facilityType,
        courtSurface,
        membershipType,
        skillLevel,
      },
      dataSource,
      autoSynced: dataSource === "google", // Indicates data was just synced
    });
  } catch (error) {
    console.error("Category fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch category", businesses: [] },
      { status: 500 }
    );
  }
}
