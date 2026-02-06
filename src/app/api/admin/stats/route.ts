import { NextResponse } from "next/server";
import { getStats } from "@/lib/local-data";
import { verifyAdmin } from "@/lib/auth/utils";

export async function GET() {
  try {
    await verifyAdmin();
    const stats = getStats();

    return NextResponse.json({
      businesses: stats.totalBusinesses,
      categories: stats.totalCategories,
      users: 0,
      reviews: stats.totalReviews,
      pendingClaims: 0,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
