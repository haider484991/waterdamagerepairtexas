import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, favorites, reviews, businessClaims } from "@/lib/db";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get counts in parallel
    const [favoritesCount, reviewsCount, claimsCount] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(favorites)
        .where(eq(favorites.userId, session.user.id)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(reviews)
        .where(eq(reviews.userId, session.user.id)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(businessClaims)
        .where(eq(businessClaims.userId, session.user.id)),
    ]);

    return NextResponse.json({
      favorites: Number(favoritesCount[0]?.count || 0),
      reviews: Number(reviewsCount[0]?.count || 0),
      claims: Number(claimsCount[0]?.count || 0),
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
