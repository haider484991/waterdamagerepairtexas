import { NextResponse } from "next/server";
import { searchBusinesses } from "@/lib/local-data";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const query = searchParams.get("q") || undefined;
    const categorySlug = searchParams.get("category") || undefined;
    const neighborhood = searchParams.get("neighborhood") || undefined;
    const minRating = searchParams.get("rating") || undefined;
    const sortBy = (searchParams.get("sort") || "relevance") as "relevance" | "rating" | "reviews" | "name";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const featured = searchParams.get("featured") === "true" || undefined;

    const result = searchBusinesses({
      query,
      categorySlug,
      neighborhood,
      minRating,
      featured,
      sort: sortBy,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching businesses:", error);
    return NextResponse.json(
      { error: "Failed to fetch businesses" },
      { status: 500 }
    );
  }
}
