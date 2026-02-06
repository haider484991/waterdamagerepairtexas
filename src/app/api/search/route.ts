import { NextResponse } from "next/server";
import { searchBusinesses } from "@/lib/local-data";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const query = searchParams.get("q") || undefined;
    const categorySlug = searchParams.get("category") || undefined;
    const stateFilter = searchParams.get("state") || undefined;
    const minRating = searchParams.get("rating") || undefined;
    const sortBy = (searchParams.get("sort") || "relevance") as "relevance" | "rating" | "reviews" | "name";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const result = searchBusinesses({
      query,
      categorySlug,
      state: stateFilter !== "all" ? stateFilter : undefined,
      minRating: minRating && parseFloat(minRating) > 0 ? minRating : undefined,
      sort: sortBy,
      page,
      limit,
    });

    return NextResponse.json({
      ...result,
      meta: {
        query: query || "",
        filters: {
          category: categorySlug || "all",
          state: stateFilter || "all",
          minRating: minRating ? parseFloat(minRating) : 0,
        },
        sort: sortBy,
      },
      dataSource: "local",
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
