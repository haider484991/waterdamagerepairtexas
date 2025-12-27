import { notFound } from "next/navigation";
import { db, businesses, categories } from "@/lib/db";
import { eq, and, ne, sql } from "drizzle-orm";
import { BusinessDetailClient } from "./BusinessDetailClient";

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

interface GooglePlaceDetails {
  name?: string;
  formatted_address?: string;
  geometry?: {
    location: { lat: number; lng: number };
  };
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
  photos?: Array<{
    photo_reference: string;
  }>;
  reviews?: Array<{
    author_name: string;
    author_url?: string;
    profile_photo_url?: string;
    rating: number;
    relative_time_description: string;
    text: string;
    time: number;
  }>;
  website?: string;
  formatted_phone_number?: string;
  url?: string;
  types?: string[];
}

// Fetch live details from Google Places API
async function fetchGoogleDetails(placeId: string): Promise<GooglePlaceDetails | null> {
  if (!GOOGLE_PLACES_API_KEY || !placeId) return null;

  try {
    const fields = [
      "name",
      "formatted_address",
      "geometry",
      "rating",
      "user_ratings_total",
      "price_level",
      "opening_hours",
      "photos",
      "reviews",
      "website",
      "formatted_phone_number",
      "url",
      "types",
    ].join(",");

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_PLACES_API_KEY}`;

    const response = await fetch(url, {
      next: { revalidate: 1800 } // Cache for 30 minutes
    });

    const data = await response.json();

    if (data.status === "OK" && data.result) {
      return data.result;
    }
    return null;
  } catch (error) {
    console.error("Error fetching Google details:", error);
    return null;
  }
}

// Convert Google's weekday_text to our hours format
function formatHours(weekdayText?: string[]): Record<string, string> | null {
  if (!weekdayText) return null;

  const dayMap: Record<string, string> = {
    "Monday": "monday",
    "Tuesday": "tuesday",
    "Wednesday": "wednesday",
    "Thursday": "thursday",
    "Friday": "friday",
    "Saturday": "saturday",
    "Sunday": "sunday",
  };

  const hours: Record<string, string> = {};

  for (const line of weekdayText) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;

    const day = line.substring(0, colonIndex).trim();
    const time = line.substring(colonIndex + 1).trim();

    const dayKey = dayMap[day];
    if (dayKey) {
      hours[dayKey] = time;
    }
  }

  return Object.keys(hours).length > 0 ? hours : null;
}

// Server-side data fetching
async function getBusinessData(slug: string) {
  try {
    // First try to find by slug
    let [business] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.slug, slug))
      .limit(1);

    // If not found by slug, try googlePlaceId
    if (!business) {
      [business] = await db
        .select()
        .from(businesses)
        .where(eq(businesses.googlePlaceId, slug))
        .limit(1);
    }

    if (!business) return null;

    // Get category
    let category = null;
    if (business.categoryId) {
      const [cat] = await db
        .select()
        .from(categories)
        .where(eq(categories.id, business.categoryId))
        .limit(1);
      category = cat || null;
    }

    // Fetch LIVE data from Google Places API
    let googleDetails: GooglePlaceDetails | null = null;
    let livePhotos: string[] = [];
    let liveReviews: any[] = [];
    let liveHours = business.hours as Record<string, string> | null;
    let liveRating = Number(business.ratingAvg) || 0;
    let liveReviewCount = business.reviewCount || 0;
    let isOpenNow = false;

    if (business.googlePlaceId) {
      googleDetails = await fetchGoogleDetails(business.googlePlaceId);

      if (googleDetails) {
        // Use live photos from Google
        livePhotos = googleDetails.photos?.map(p => p.photo_reference) || [];

        // Use live reviews from Google
        liveReviews = googleDetails.reviews?.map((review, index) => ({
          id: `google-${business.googlePlaceId}-${index}`,
          rating: review.rating,
          title: null,
          content: review.text,
          photos: [],
          helpfulCount: 0,
          relativeTime: review.relative_time_description,
          createdAt: new Date(review.time * 1000).toISOString(),
          source: "google" as const,
          user: {
            id: `google-user-${index}`,
            name: review.author_name,
            avatar: review.profile_photo_url || null,
            profileUrl: review.author_url || null,
          },
        })) || [];

        // Use live rating
        liveRating = googleDetails.rating || liveRating;
        liveReviewCount = googleDetails.user_ratings_total || liveReviewCount;

        // Use live hours
        liveHours = formatHours(googleDetails.opening_hours?.weekday_text) || business.hours as Record<string, string> | null;
        isOpenNow = googleDetails.opening_hours?.open_now || false;
      }
    }

    // If no Google photos, use the thumbnail from database
    if (livePhotos.length === 0 && business.photos && (business.photos as string[]).length > 0) {
      livePhotos = business.photos as string[];
    }

    // Get similar businesses
    let similarBusinesses: any[] = [];
    if (business.categoryId) {
      similarBusinesses = await db
        .select({
          id: businesses.id,
          name: businesses.name,
          slug: businesses.slug,
          description: businesses.description,
          address: businesses.address,
          city: businesses.city,
          state: businesses.state,
          neighborhood: businesses.neighborhood,
          priceLevel: businesses.priceLevel,
          ratingAvg: businesses.ratingAvg,
          reviewCount: businesses.reviewCount,
          photos: businesses.photos,
          googlePlaceId: businesses.googlePlaceId,
        })
        .from(businesses)
        .where(
          and(
            eq(businesses.categoryId, business.categoryId),
            ne(businesses.id, business.id)
          )
        )
        .orderBy(sql`${businesses.ratingAvg} DESC`)
        .limit(4);
    }

    // Combine database + live Google data
    const hybridBusiness = {
      id: business.id,
      name: business.name,
      slug: business.slug,
      description: business.description,
      address: business.address,
      city: business.city,
      state: business.state,
      zip: business.zip,
      phone: googleDetails?.formatted_phone_number || business.phone,
      website: googleDetails?.website || business.website,
      email: business.email,
      lat: business.lat,
      lng: business.lng,
      neighborhood: business.neighborhood,
      photos: livePhotos,
      hours: liveHours,
      priceLevel: business.priceLevel,
      ratingAvg: liveRating.toString(),
      reviewCount: liveReviewCount,
      isVerified: business.isVerified,
      isFeatured: business.isFeatured,
      googlePlaceId: business.googlePlaceId,
      isOpenNow,
      category: category ? {
        name: category.name,
        slug: category.slug,
        section: category.section,
      } : null,
    };

    return {
      business: hybridBusiness,
      reviews: liveReviews,
      reviewsSource: liveReviews.length > 0 ? "google" as const : "none" as const,
      totalReviewsOnGoogle: liveReviewCount,
      similarBusinesses: similarBusinesses.map(b => ({
        ...b,
        photos: b.photos as string[] || [],
        category: category ? { name: category.name, slug: category.slug } : null,
      })),
    };
  } catch (error) {
    console.error("Error fetching business data:", error);
    return null;
  }
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BusinessDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getBusinessData(slug);

  // Return proper 404 if business doesn't exist
  if (!data?.business) {
    notFound();
  }

  return (
    <BusinessDetailClient
      business={data.business}
      reviews={data.reviews || []}
      similarBusinesses={data.similarBusinesses || []}
      reviewsSource={data.reviewsSource || "none"}
      totalReviewsOnGoogle={data.totalReviewsOnGoogle || 0}
    />
  );
}
