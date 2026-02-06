import { NextResponse } from "next/server";
import { getSearchSuggestions, getCategories } from "@/lib/local-data";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    if (query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    // Get business name suggestions from local data
    const businessSuggestions = getSearchSuggestions(query, 5);

    // Get category suggestions
    const allCategories = getCategories();
    const queryLower = query.toLowerCase();
    const categorySuggestions = allCategories
      .filter(
        (c) =>
          c.name.toLowerCase().includes(queryLower) ||
          (c.description || "").toLowerCase().includes(queryLower)
      )
      .slice(0, 3);

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
    ].filter((term) => term.toLowerCase().includes(queryLower));

    return NextResponse.json({
      suggestions: [
        ...businessSuggestions.map((b) => ({
          id: b.slug,
          name: b.name,
          slug: b.slug,
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
