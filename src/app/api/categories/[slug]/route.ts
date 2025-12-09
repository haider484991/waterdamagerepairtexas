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
const PLANO_LOCATION = "33.0198,-96.6989";

function determineNeighborhood(lat: number, lng: number): string {
  if (lat > 33.05 && lng < -96.75) return "Legacy West";
  if (lat > 33.04 && lng > -96.72) return "East Plano";
  if (lat < 33.02 && lng > -96.72) return "Downtown Plano";
  if (lng < -96.8) return "West Plano";
  return "Plano";
}

// Fetch from Google and auto-sync to database
async function fetchAndSyncGooglePlaces(
  categorySlug: string,
  categoryName: string,
  categoryId: string
): Promise<BusinessData[]> {
  if (!GOOGLE_PLACES_API_KEY) return [];

  const queries = categorySearchQueries[categorySlug] || [categoryName];
  const allPlaces: GooglePlaceResult[] = [];

  try {
    // Fetch from each query
    for (const query of queries.slice(0, 3)) {
      const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
      url.searchParams.set("query", `${query} in Plano, TX`);
      url.searchParams.set("location", PLANO_LOCATION);
      url.searchParams.set("radius", "20000");
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
    return uniquePlaces.slice(0, 20).map((place, index) => ({
      id: `temp-${place.place_id}`,
      googlePlaceId: place.place_id,
      name: place.name,
      slug: `${place.place_id.substring(0, 20)}-${index}`,
      description: null,
      address: place.formatted_address || place.vicinity || "",
      city: "Plano",
      state: "TX",
      zip: null,
      phone: null,
      website: null,
      email: null,
      lat: place.geometry.location.lat.toString(),
      lng: place.geometry.location.lng.toString(),
      neighborhood: determineNeighborhood(
        place.geometry.location.lat,
        place.geometry.location.lng
      ),
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
    }));
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

    const neighborhood = searchParams.get("neighborhood") || "all";
    const minRating = parseFloat(searchParams.get("rating") || "0");
    const priceLevel = parseInt(searchParams.get("price") || "0");
    const sortBy = searchParams.get("sort") || "relevance";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const enrichPhotos = searchParams.get("enrich") !== "false";

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

    if (neighborhood && neighborhood !== "all" && neighborhood !== "All Neighborhoods") {
      const neighborhoodName = neighborhood
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      conditions.push(
        or(
          eq(businesses.neighborhood, neighborhoodName),
          ilike(businesses.neighborhood, `%${neighborhoodName}%`),
          ilike(businesses.neighborhood, `%${neighborhood}%`)
        )!
      );
    }

    if (minRating > 0) {
      conditions.push(gte(businesses.ratingAvg, minRating.toString()));
    }

    if (priceLevel > 0) {
      conditions.push(eq(businesses.priceLevel, priceLevel));
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
      
      const googleResults = await fetchAndSyncGooglePlaces(slug, category.name, category.id);

      if (googleResults.length > 0) {
        // Apply client-side filtering for Google results
        let filtered = googleResults;

        if (neighborhood && neighborhood !== "all" && neighborhood !== "All Neighborhoods") {
          const neighborhoodName = neighborhood
            .split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
          filtered = filtered.filter(
            (b) =>
              b.neighborhood?.toLowerCase().includes(neighborhoodName.toLowerCase()) ||
              b.neighborhood?.toLowerCase().includes(neighborhood.toLowerCase())
          );
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
        neighborhood,
        minRating,
        priceLevel,
        sort: sortBy,
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
