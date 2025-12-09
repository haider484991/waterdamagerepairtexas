import { NextResponse } from "next/server";
import { db, businesses, categories, users, reviews, businessClaims } from "@/lib/db";
import { sql, eq } from "drizzle-orm";

export async function GET() {
  try {
    // Get all counts in parallel
    const [
      businessCount,
      categoryCount,
      userCount,
      reviewCount,
      pendingClaimsCount,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(businesses),
      db.select({ count: sql<number>`count(*)` }).from(categories),
      db.select({ count: sql<number>`count(*)` }).from(users),
      db.select({ count: sql<number>`count(*)` }).from(reviews),
      db
        .select({ count: sql<number>`count(*)` })
        .from(businessClaims)
        .where(eq(businessClaims.status, "pending")),
    ]);

    return NextResponse.json({
      businesses: Number(businessCount[0]?.count || 0),
      categories: Number(categoryCount[0]?.count || 0),
      users: Number(userCount[0]?.count || 0),
      reviews: Number(reviewCount[0]?.count || 0),
      pendingClaims: Number(pendingClaimsCount[0]?.count || 0),
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}

