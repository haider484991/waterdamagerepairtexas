import { notFound } from "next/navigation";
import { db, businesses, categories } from "@/lib/db";
import { eq, and, ne, sql } from "drizzle-orm";
import { BusinessDetailClient } from "./BusinessDetailClient";
import { uploadBusinessPhotosToSupabase } from "@/lib/supabase";
import { generateBusinessContent } from "@/lib/content-generator";

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

// Server-side data fetching with caching
// Cache duration: 7 days
const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function isCacheValid(lastEnrichedAt: Date | null): boolean {
  if (!lastEnrichedAt) return false;
  const age = Date.now() - new Date(lastEnrichedAt).getTime();
  return age < CACHE_DURATION_MS;
}

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

    // Check if we have valid cached data (within 7 days)
    const hasCachedData = isCacheValid(business.lastEnrichedAt);

    let photos: string[] = [];
    let reviews: any[] = [];
    let hours = business.hours as Record<string, string> | null;
    let rating = Number(business.ratingAvg) || 0;
    let reviewCount = business.reviewCount || 0;
    let isOpenNow = false;
    let phone = business.phone;
    let website = business.website;
    let googleMapsUrl = business.googleMapsUrl;

    if (hasCachedData) {
      // Use cached data - NO API CALL!
      console.log(`[Business Page] Using cached data for ${business.name}`);

      // Use cached image URLs if available, otherwise use photo references
      photos = (business.cachedImageUrls as string[] || []).length > 0
        ? (business.cachedImageUrls as string[])
        : (business.photos as string[] || []);

      // Use cached reviews
      reviews = (business.cachedReviews as any[] || []).map((review, index) => ({
        id: `cached-${business.id}-${index}`,
        rating: review.rating,
        title: null,
        content: review.text,
        photos: [],
        helpfulCount: 0,
        relativeTime: review.relativeTime,
        createdAt: review.time ? new Date(review.time * 1000).toISOString() : new Date().toISOString(),
        source: "google" as const,
        user: {
          id: `cached-user-${index}`,
          name: review.authorName,
          avatar: review.authorPhoto || null,
          profileUrl: null,
        },
      }));

      // Use cached contact info
      phone = business.cachedPhone || business.phone;
      website = business.cachedWebsite || business.website;
      hours = (business.cachedHours as Record<string, string>) || hours;

    } else if (business.googlePlaceId && GOOGLE_PLACES_API_KEY) {
      // Cache miss or stale - fetch from Google and update cache
      console.log(`[Business Page] Fetching fresh data for ${business.name}`);

      const googleDetails = await fetchGoogleDetails(business.googlePlaceId);

      if (googleDetails) {
        // Extract photo references
        const photoRefs = googleDetails.photos?.map(p => p.photo_reference) || [];
        photos = photoRefs;

        // Format reviews for response
        reviews = googleDetails.reviews?.map((review, index) => ({
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

        // Use live data
        rating = googleDetails.rating || rating;
        reviewCount = googleDetails.user_ratings_total || reviewCount;
        hours = formatHours(googleDetails.opening_hours?.weekday_text) || hours;
        isOpenNow = googleDetails.opening_hours?.open_now || false;
        phone = googleDetails.formatted_phone_number || phone;
        website = googleDetails.website || website;
        googleMapsUrl = googleDetails.url || googleMapsUrl;

        // Save to database cache in background (don't block response)
        const cachedReviews = googleDetails.reviews?.map(r => ({
          authorName: r.author_name,
          rating: r.rating,
          text: r.text,
          relativeTime: r.relative_time_description,
          time: r.time,
          authorPhoto: r.profile_photo_url,
        })) || [];

        // Upload photos to Supabase for PERMANENT storage (async, don't block)
        // This only happens once per business - after this, we use the permanent URLs
        uploadBusinessPhotosToSupabase(photoRefs, business.id, 5)
          .then(async (permanentUrls) => {
            // Update DB with permanent Supabase URLs
            await db.update(businesses)
              .set({
                photos: photoRefs, // Keep original refs as backup
                cachedImageUrls: permanentUrls.length > 0 ? permanentUrls : null, // Permanent Supabase URLs!
                cachedPhone: googleDetails.formatted_phone_number || null,
                cachedWebsite: googleDetails.website || null,
                cachedHours: formatHours(googleDetails.opening_hours?.weekday_text),
                cachedReviews: cachedReviews,
                googleMapsUrl: googleDetails.url || null,
                ratingAvg: googleDetails.rating?.toString() || business.ratingAvg,
                reviewCount: googleDetails.user_ratings_total || business.reviewCount,
                lastEnrichedAt: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(businesses.id, business.id));

            if (permanentUrls.length > 0) {
              console.log(`[Business Page] Saved ${permanentUrls.length} permanent Supabase URLs for ${business.name}`);
            }
          })
          .catch(err => console.error("[Business Page] Failed to update cache:", err));
      }
    }

    // Fallback to database photos if no photos found
    if (photos.length === 0 && business.photos) {
      photos = business.photos as string[];
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
          cachedImageUrls: businesses.cachedImageUrls,
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

    // Combine database + cached/live data
    const hybridBusiness = {
      id: business.id,
      name: business.name,
      slug: business.slug,
      description: business.description,
      address: business.address,
      city: business.city,
      state: business.state,
      zip: business.zip,
      phone,
      website,
      email: business.email,
      lat: business.lat,
      lng: business.lng,
      neighborhood: business.neighborhood,
      photos,
      hours,
      priceLevel: business.priceLevel,
      ratingAvg: rating.toString(),
      reviewCount,
      isVerified: business.isVerified,
      isFeatured: business.isFeatured,
      googlePlaceId: business.googlePlaceId,
      googleMapsUrl,
      isOpenNow,
      category: category ? {
        name: category.name,
        slug: category.slug,
        section: category.section,
      } : null,
      dataSource: hasCachedData ? "cached" : "hybrid",
    };

    return {
      business: hybridBusiness,
      reviews,
      reviewsSource: reviews.length > 0 ? "google" as const : "none" as const,
      totalReviewsOnGoogle: reviewCount,
      similarBusinesses: similarBusinesses.map(b => ({
        ...b,
        // Prefer cached URLs, fallback to photo refs
        photos: (b.cachedImageUrls as string[] || []).length > 0
          ? (b.cachedImageUrls as string[])
          : (b.photos as string[] || []),
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

  // Generate dynamic content on server
  const dynamicContent = generateBusinessContent(data.business, data.business.category);

  return (
    <BusinessDetailClient
      business={data.business}
      reviews={data.reviews || []}
      similarBusinesses={data.similarBusinesses || []}
      reviewsSource={data.reviewsSource || "none"}
      totalReviewsOnGoogle={data.totalReviewsOnGoogle || 0}
      dynamicContent={dynamicContent}
    />
  );
}
