import { NextResponse } from "next/server";
import { db, businesses, categories } from "@/lib/db";
import { eq, desc, asc, and, gte, sql, ilike, or } from "drizzle-orm";
import { BusinessData } from "@/lib/hybrid-data";

// NOTE: Google API integration removed from search to save costs
// Database is now the primary and only source for search
// This eliminates costly API calls on every search query

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const query = searchParams.get("q") || "";
    const categorySlug = searchParams.get("category") || "all";
    const stateFilter = searchParams.get("state") || "all";
    const minRating = parseFloat(searchParams.get("rating") || "0");
    const sortBy = searchParams.get("sort") || "relevance";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const offset = (page - 1) * limit;

    // Build conditions for database search
    const conditions = [];

    if (query) {
      // Split query into words for better matching
      const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 1);

      if (queryWords.length > 0) {
        // Search in name, description, city, state, and address
        const queryConditions = queryWords.map(word =>
          or(
            ilike(businesses.name, `%${word}%`),
            ilike(businesses.description, `%${word}%`),
            ilike(businesses.city, `%${word}%`),
            ilike(businesses.state, `%${word}%`),
            ilike(businesses.address, `%${word}%`)
          )
        );

        // Use AND to require all words to match
        conditions.push(and(...queryConditions));
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
        // Relevance sorting: prioritize featured, then rating
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
    const total = Number(countResult[0]?.count || 0);

    // Format results with cached fields - NO Google API enrichment
    // This saves API costs by using only database data
    const formattedResults: BusinessData[] = results.map((r) => ({
      ...r.business,
      // Prefer cached image URLs, fallback to photo references
      photos: ((r.business.cachedImageUrls as string[]) || []).length > 0
        ? (r.business.cachedImageUrls as string[])
        : (r.business.photos as string[]) || [],
      hours: (r.business.cachedHours as Record<string, string>) || (r.business.hours as Record<string, string> | null),
      cachedImageUrls: r.business.cachedImageUrls as string[] | null,
      lastEnrichedAt: r.business.lastEnrichedAt,
      cachedPhone: r.business.cachedPhone,
      cachedWebsite: r.business.cachedWebsite,
      cachedHours: r.business.cachedHours as Record<string, string> | null,
      category: r.category
        ? {
          name: r.category.name,
          slug: r.category.slug,
          section: r.category.section,
        }
        : null,
    }));

    return NextResponse.json({
      data: formattedResults,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + formattedResults.length < total,
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
      dataSource: "database",
      autoSynced: false,
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
