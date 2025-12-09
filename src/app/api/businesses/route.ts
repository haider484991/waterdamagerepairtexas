import { NextResponse } from "next/server";
import { db, businesses, categories } from "@/lib/db";
import { eq, desc, asc, and, gte, sql } from "drizzle-orm";

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// Quick fetch for photos only (lighter API call)
async function fetchPhotosForBusiness(placeId: string): Promise<string[]> {
  if (!GOOGLE_PLACES_API_KEY || !placeId) return [];

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${GOOGLE_PLACES_API_KEY}`;
    const response = await fetch(url, { next: { revalidate: 3600 } }); // Cache for 1 hour
    const data = await response.json();

    if (data.status === "OK" && data.result?.photos) {
      return data.result.photos.slice(0, 5).map((p: any) => p.photo_reference);
    }
    return [];
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const query = searchParams.get("q");
    const categorySlug = searchParams.get("category");
    const neighborhood = searchParams.get("neighborhood");
    const minRating = searchParams.get("rating");
    const sortBy = searchParams.get("sort") || "relevance";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const featured = searchParams.get("featured");
    const enrichPhotos = searchParams.get("enrichPhotos") === "true";

    const offset = (page - 1) * limit;

    // Build conditions
    const conditions = [];

    if (query) {
      conditions.push(
        sql`(${businesses.name} ILIKE ${`%${query}%`} OR ${businesses.description} ILIKE ${`%${query}%`})`
      );
    }

    if (neighborhood && neighborhood !== "all") {
      conditions.push(eq(businesses.neighborhood, neighborhood));
    }

    if (minRating) {
      conditions.push(gte(businesses.ratingAvg, minRating));
    }

    if (featured === "true") {
      conditions.push(eq(businesses.isFeatured, true));
    }

    // Build where clause
    if (categorySlug && categorySlug !== "all") {
      conditions.push(eq(categories.slug, categorySlug));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

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
      default:
        orderByClause = [
          desc(businesses.isFeatured),
          desc(businesses.ratingAvg)
        ];
    }

    // Execute query
    const results = await db
      .select({
        business: businesses,
        category: categories,
      })
      .from(businesses)
      .leftJoin(categories, eq(businesses.categoryId, categories.id))
      .where(whereClause)
      .orderBy(...orderByClause)
      .limit(limit)
      .offset(offset);

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(businesses)
      .leftJoin(categories, eq(businesses.categoryId, categories.id))
      .where(whereClause);
    const total = Number(countResult[0]?.count || 0);

    // Format and optionally enrich with photos
    let formattedResults = results.map((r) => ({
      ...r.business,
      category: r.category,
    }));

    // Enrich first few results with live photos if requested
    if (enrichPhotos && GOOGLE_PLACES_API_KEY) {
      const enrichLimit = Math.min(6, formattedResults.length);
      for (let i = 0; i < enrichLimit; i++) {
        const biz = formattedResults[i];
        if (biz.googlePlaceId && (!biz.photos || biz.photos.length === 0)) {
          const photos = await fetchPhotosForBusiness(biz.googlePlaceId);
          if (photos.length > 0) {
            formattedResults[i] = { ...biz, photos };
          }
        }
      }
    }

    return NextResponse.json({
      data: formattedResults,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching businesses:", error);
    return NextResponse.json(
      { error: "Failed to fetch businesses" },
      { status: 500 }
    );
  }
}
