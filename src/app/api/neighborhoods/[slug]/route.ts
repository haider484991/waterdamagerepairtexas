import { NextResponse } from "next/server";
import { db, businesses, categories } from "@/lib/db";
import { eq, desc, asc, and, gte, ilike, or, sql } from "drizzle-orm";
import { enrichBusinesses, BusinessData } from "@/lib/hybrid-data";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);

    // Convert slug to neighborhood name
    const neighborhoodName = slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    const categorySlug = searchParams.get("category") || null;
    const minRating = parseFloat(searchParams.get("rating") || "0");
    const priceLevel = parseInt(searchParams.get("price") || "0");
    const sortBy = searchParams.get("sort") || "relevance";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const enrichPhotos = searchParams.get("enrich") !== "false";

    const offset = (page - 1) * limit;

    // Build conditions
    const conditions = [
      or(
        eq(businesses.neighborhood, neighborhoodName),
        ilike(businesses.neighborhood, `%${neighborhoodName}%`),
        ilike(businesses.neighborhood, `%${slug}%`)
      )!,
    ];

    if (minRating > 0) {
      conditions.push(gte(businesses.ratingAvg, minRating.toString()));
    }

    if (priceLevel > 0) {
      conditions.push(eq(businesses.priceLevel, priceLevel));
    }

    // Add category filter if specified
    if (categorySlug) {
      const [category] = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, categorySlug))
        .limit(1);

      if (category) {
        conditions.push(eq(businesses.categoryId, category.id));
      }
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
          desc(businesses.reviewCount),
        ];
    }

    // Query businesses
    const businessResults = await db
      .select({
        business: businesses,
        category: categories,
      })
      .from(businesses)
      .leftJoin(categories, eq(businesses.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(...orderByClause)
      .limit(limit)
      .offset(offset);

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(businesses)
      .where(and(...conditions));

    const total = Number(countResult?.count || 0);

    // Format results
    let formattedResults: BusinessData[] = businessResults.map((result) => ({
      ...result.business,
      photos: (result.business.photos as string[]) || [],
      hours: result.business.hours as Record<string, string> | null,
      category: result.category
        ? {
            name: result.category.name,
            slug: result.category.slug,
            section: result.category.section,
          }
        : null,
    }));

    // Enrich with Google Places data if requested
    let enrichedResults = formattedResults;
    if (enrichPhotos && formattedResults.length > 0) {
      try {
        enrichedResults = await enrichBusinesses(formattedResults, {
          limit: 8,
          parallel: true,
        });
      } catch (error) {
        console.error("Enrichment failed:", error);
        enrichedResults = formattedResults.map((b) => ({
          ...b,
          dataSource: "database" as const,
        }));
      }
    }

    // Get top categories in this neighborhood
    const topCategories = await db
      .select({
        categoryId: businesses.categoryId,
        categoryName: categories.name,
        categorySlug: categories.slug,
        count: sql<number>`count(*)`,
      })
      .from(businesses)
      .leftJoin(categories, eq(businesses.categoryId, categories.id))
      .where(
        and(
          or(
            eq(businesses.neighborhood, neighborhoodName),
            ilike(businesses.neighborhood, `%${neighborhoodName}%`)
          )!,
          sql`${businesses.categoryId} IS NOT NULL`
        )
      )
      .groupBy(businesses.categoryId, categories.name, categories.slug)
      .orderBy(sql`count(*) DESC`)
      .limit(6);

    // Get neighborhood stats
    const [statsResult] = await db
      .select({
        avgRating: sql<number>`COALESCE(AVG(CAST(${businesses.ratingAvg} AS DECIMAL)), 0)`,
        totalReviews: sql<number>`COALESCE(SUM(${businesses.reviewCount}), 0)`,
      })
      .from(businesses)
      .where(
        or(
          eq(businesses.neighborhood, neighborhoodName),
          ilike(businesses.neighborhood, `%${neighborhoodName}%`)
        )!
      );

    return NextResponse.json({
      neighborhood: {
        name: neighborhoodName,
        slug,
        businessCount: total,
        avgRating: Number(statsResult?.avgRating || 0).toFixed(1),
        totalReviews: Number(statsResult?.totalReviews || 0),
      },
      businesses: enrichedResults,
      topCategories: topCategories.map((cat) => ({
        id: cat.categoryId,
        name: cat.categoryName,
        slug: cat.categorySlug,
        count: Number(cat.count),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + enrichedResults.length < total,
      },
      filters: {
        category: categorySlug,
        minRating,
        priceLevel,
        sort: sortBy,
      },
    });
  } catch (error) {
    console.error("Neighborhood fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch neighborhood data", businesses: [] },
      { status: 500 }
    );
  }
}
