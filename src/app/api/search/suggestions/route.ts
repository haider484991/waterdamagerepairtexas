import { NextResponse } from "next/server";
import { db, businesses, categories } from "@/lib/db";
import { ilike, or, sql } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    if (query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    // Get business name suggestions
    const businessSuggestions = await db
      .select({
        id: businesses.id,
        name: businesses.name,
        slug: businesses.slug,
        googlePlaceId: businesses.googlePlaceId,
        type: sql<string>`'business'`.as("type"),
      })
      .from(businesses)
      .where(ilike(businesses.name, `%${query}%`))
      .orderBy(businesses.ratingAvg)
      .limit(5);

    // Get category suggestions
    const categorySuggestions = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        type: sql<string>`'category'`.as("type"),
      })
      .from(categories)
      .where(
        or(
          ilike(categories.name, `%${query}%`),
          ilike(categories.description, `%${query}%`)
        )
      )
      .limit(3);

    // Common search terms for water damage restoration
    const popularSearches = [
      "water damage restoration",
      "flood cleanup",
      "mold remediation",
      "emergency water extraction",
      "storm damage repair",
      "water removal",
      "basement flooding",
      "roof leak repair",
      "sewage cleanup",
      "fire damage restoration",
      "24 hour emergency",
      "insurance claim help",
    ].filter((term) => term.toLowerCase().includes(query.toLowerCase()));

    return NextResponse.json({
      suggestions: [
        ...businessSuggestions.map((b) => ({
          id: b.id,
          name: b.name,
          slug: b.googlePlaceId || b.slug,
          type: "business",
        })),
        ...categorySuggestions.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          type: "category",
        })),
        ...popularSearches.slice(0, 3).map((term, i) => ({
          id: `search-${i}`,
          name: term,
          slug: term,
          type: "search",
        })),
      ],
    });
  } catch (error) {
    console.error("Suggestions error:", error);
    return NextResponse.json({ suggestions: [] });
  }
}

