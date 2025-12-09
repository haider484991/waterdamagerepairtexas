import { NextResponse } from "next/server";
import { db, reviews, users, businesses } from "@/lib/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";

// GET reviews with pagination
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const businessSlug = searchParams.get("businessSlug");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    if (!businessId && !businessSlug) {
      return NextResponse.json(
        { error: "Business ID or slug required" },
        { status: 400 }
      );
    }

    // Get business ID from slug if needed
    let targetBusinessId = businessId;
    if (!targetBusinessId && businessSlug) {
      const [business] = await db
        .select({ id: businesses.id })
        .from(businesses)
        .where(eq(businesses.slug, businessSlug))
        .limit(1);
      
      if (!business) {
        return NextResponse.json({ error: "Business not found" }, { status: 404 });
      }
      targetBusinessId = business.id;
    }

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(reviews)
      .where(eq(reviews.businessId, targetBusinessId!));

    const total = Number(countResult?.count || 0);

    // Get reviews with user info
    const reviewResults = await db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        title: reviews.title,
        content: reviews.content,
        photos: reviews.photos,
        helpfulCount: reviews.helpfulCount,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
        userId: reviews.userId,
        userName: users.name,
        userAvatar: users.avatar,
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.businessId, targetBusinessId!))
      .orderBy(desc(reviews.createdAt))
      .limit(limit)
      .offset(offset);

    const formattedReviews = reviewResults.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      content: r.content,
      photos: r.photos || [],
      helpfulCount: r.helpfulCount || 0,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      user: {
        id: r.userId,
        name: r.userName || "Anonymous",
        avatar: r.userAvatar,
      },
    }));

    // Calculate rating distribution
    const ratingDist = await db
      .select({
        rating: reviews.rating,
        count: sql<number>`count(*)`,
      })
      .from(reviews)
      .where(eq(reviews.businessId, targetBusinessId!))
      .groupBy(reviews.rating);

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingDist.forEach((r) => {
      distribution[r.rating] = Number(r.count);
    });

    return NextResponse.json({
      reviews: formattedReviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + reviewResults.length < total,
      },
      distribution,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

// POST create a new review
export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to write a review" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { businessId, businessSlug, rating, title, content, photos } = body;

    if (!businessId && !businessSlug) {
      return NextResponse.json(
        { error: "Business ID or slug required" },
        { status: 400 }
      );
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Get business ID from slug if needed
    let targetBusinessId = businessId;
    let business;
    
    if (!targetBusinessId && businessSlug) {
      [business] = await db
        .select()
        .from(businesses)
        .where(eq(businesses.slug, businessSlug))
        .limit(1);
      
      if (!business) {
        return NextResponse.json({ error: "Business not found" }, { status: 404 });
      }
      targetBusinessId = business.id;
    } else {
      [business] = await db
        .select()
        .from(businesses)
        .where(eq(businesses.id, targetBusinessId))
        .limit(1);
    }

    // Check if user already reviewed this business
    const existingReview = await db
      .select()
      .from(reviews)
      .where(
        and(
          eq(reviews.businessId, targetBusinessId),
          eq(reviews.userId, session.user.id)
        )
      )
      .limit(1);

    if (existingReview.length > 0) {
      return NextResponse.json(
        { error: "You have already reviewed this business" },
        { status: 400 }
      );
    }

    // Create the review
    const [newReview] = await db
      .insert(reviews)
      .values({
        businessId: targetBusinessId,
        userId: session.user.id,
        rating: Math.round(rating),
        title: title || null,
        content: content || null,
        photos: photos || [],
      })
      .returning();

    // Update business rating
    const allReviews = await db
      .select({ rating: reviews.rating })
      .from(reviews)
      .where(eq(reviews.businessId, targetBusinessId));

    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    
    await db
      .update(businesses)
      .set({
        ratingAvg: avgRating.toFixed(2),
        reviewCount: allReviews.length,
        updatedAt: new Date(),
      })
      .where(eq(businesses.id, targetBusinessId));

    return NextResponse.json({
      success: true,
      review: newReview,
      message: "Review submitted successfully!",
    });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}

// PATCH update helpful count
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { reviewId, action } = body;

    if (!reviewId) {
      return NextResponse.json({ error: "Review ID required" }, { status: 400 });
    }

    const [review] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, reviewId))
      .limit(1);

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const newCount = action === "increment" 
      ? (review.helpfulCount || 0) + 1 
      : Math.max(0, (review.helpfulCount || 0) - 1);

    await db
      .update(reviews)
      .set({ helpfulCount: newCount })
      .where(eq(reviews.id, reviewId));

    return NextResponse.json({ success: true, helpfulCount: newCount });
  } catch (error) {
    console.error("Error updating review:", error);
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 }
    );
  }
}
