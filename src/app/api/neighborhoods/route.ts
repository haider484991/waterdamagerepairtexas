import { NextResponse } from "next/server";
import { getNeighborhoods } from "@/lib/local-data";

export async function GET() {
  try {
    const neighborhoodStats = getNeighborhoods();

    const neighborhoods = neighborhoodStats.map((stat) => ({
      name: stat.neighborhood,
      slug: stat.neighborhood.toLowerCase().replace(/\s+/g, "-"),
      businessCount: stat.count,
      avgRating: stat.avgRating,
      totalReviews: 0,
    }));

    return NextResponse.json({
      neighborhoods,
      total: neighborhoods.length,
    });
  } catch (error) {
    console.error("Error fetching neighborhoods:", error);
    return NextResponse.json(
      { error: "Failed to fetch neighborhoods", neighborhoods: [] },
      { status: 500 }
    );
  }
}
