import { NextResponse } from "next/server";
import {
  getCategoryBySlug,
  getBusinessesByCategory,
  searchBusinesses,
} from "@/lib/local-data";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);

    const state = searchParams.get("state") || "all";
    const city = searchParams.get("city") || "all";
    const minRating = searchParams.get("rating") || "0";
    const sortBy = (searchParams.get("sort") || "relevance") as
      | "relevance"
      | "rating"
      | "reviews"
      | "name";
    const page = parseInt(searchParams.get("page") || "1");
    const limitParam = searchParams.get("limit");
    const limit = limitParam === "all" ? 10000 : parseInt(limitParam || "100");

    // Get category
    const category = getCategoryBySlug(slug);
    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Use the searchBusinesses function with filters
    const result = searchBusinesses({
      categorySlug: slug,
      state: state !== "all" ? state : undefined,
      city: city !== "all" ? city : undefined,
      minRating: parseFloat(minRating) > 0 ? minRating : undefined,
      sort: sortBy,
      page,
      limit,
    });

    // Compute category stats from all businesses in this category
    const allCategoryBusinesses = getBusinessesByCategory(slug);
    const totalRating = allCategoryBusinesses.reduce(
      (sum, b) => sum + parseFloat(b.ratingAvg),
      0
    );
    const totalReviews = allCategoryBusinesses.reduce(
      (sum, b) => sum + b.reviewCount,
      0
    );
    const avgRating =
      allCategoryBusinesses.length > 0
        ? (totalRating / allCategoryBusinesses.length).toFixed(1)
        : "0";

    return NextResponse.json({
      category: {
        ...category,
        businessCount: result.pagination.total,
        avgRating,
        totalReviews,
      },
      subcategories: [],
      businesses: result.data,
      pagination: result.pagination,
      filters: {
        state,
        city,
        minRating: parseFloat(minRating),
        sort: sortBy,
      },
      dataSource: "local",
      autoSynced: false,
    });
  } catch (error) {
    console.error("Category fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch category", businesses: [] },
      { status: 500 }
    );
  }
}
