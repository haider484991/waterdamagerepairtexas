import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, reviews, businesses } from "@/lib/db";
import { eq, desc, sql } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    const userReviews = await db
      .select({
        review: reviews,
        business: {
          id: businesses.id,
          name: businesses.name,
          slug: businesses.slug,
          googlePlaceId: businesses.googlePlaceId,
        },
      })
      .from(reviews)
      .leftJoin(businesses, eq(reviews.businessId, businesses.id))
      .where(eq(reviews.userId, session.user.id))
      .orderBy(desc(reviews.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(reviews)
      .where(eq(reviews.userId, session.user.id));

    const total = Number(countResult?.count || 0);

    const formattedReviews = userReviews.map(r => ({
      id: r.review.id,
      rating: r.review.rating,
      title: r.review.title,
      content: r.review.content,
      photos: r.review.photos || [],
      helpfulCount: r.review.helpfulCount,
      createdAt: r.review.createdAt,
      business: r.business ? {
        id: r.business.id,
        name: r.business.name,
        slug: r.business.googlePlaceId || r.business.slug,
      } : null,
    }));

    return NextResponse.json({
      reviews: formattedReviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
