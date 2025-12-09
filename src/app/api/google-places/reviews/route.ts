import { NextResponse } from "next/server";
import { db, businesses } from "@/lib/db";
import { eq } from "drizzle-orm";

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

interface GoogleReview {
  author_name: string;
  author_url?: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
}

interface PlaceDetailsResponse {
  result?: {
    reviews?: GoogleReview[];
    rating?: number;
    user_ratings_total?: number;
  };
  status: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const businessSlug = searchParams.get("businessSlug");

    if (!businessId && !businessSlug) {
      return NextResponse.json(
        { error: "Business ID or slug required" },
        { status: 400 }
      );
    }

    // Get business
    let business;
    if (businessId) {
      [business] = await db
        .select()
        .from(businesses)
        .where(eq(businesses.id, businessId))
        .limit(1);
    } else if (businessSlug) {
      [business] = await db
        .select()
        .from(businesses)
        .where(eq(businesses.slug, businessSlug))
        .limit(1);
    }

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    if (!business.googlePlaceId) {
      return NextResponse.json({
        reviews: [],
        source: "local",
        message: "No Google Place ID for this business",
      });
    }

    if (!GOOGLE_PLACES_API_KEY) {
      return NextResponse.json({
        reviews: [],
        source: "local",
        message: "Google Places API key not configured",
      });
    }

    // Fetch reviews from Google Places API
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${business.googlePlaceId}&fields=reviews,rating,user_ratings_total&key=${GOOGLE_PLACES_API_KEY}`;

    const response = await fetch(url);
    const data: PlaceDetailsResponse = await response.json();

    if (data.status !== "OK" || !data.result?.reviews) {
      return NextResponse.json({
        reviews: [],
        source: "google",
        message: "No reviews found on Google",
      });
    }

    // Format reviews
    const formattedReviews = data.result.reviews.map((review, index) => ({
      id: `google-${business.googlePlaceId}-${index}`,
      rating: review.rating,
      title: null,
      content: review.text,
      photos: [],
      helpfulCount: 0,
      createdAt: new Date(review.time * 1000).toISOString(),
      relativeTime: review.relative_time_description,
      source: "google",
      user: {
        id: `google-user-${index}`,
        name: review.author_name,
        avatar: review.profile_photo_url || null,
        profileUrl: review.author_url || null,
      },
    }));

    return NextResponse.json({
      reviews: formattedReviews,
      source: "google",
      totalOnGoogle: data.result.user_ratings_total || 0,
      googleRating: data.result.rating || 0,
    });
  } catch (error) {
    console.error("Error fetching Google reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews", reviews: [] },
      { status: 500 }
    );
  }
}

