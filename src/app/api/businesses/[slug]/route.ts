import { NextResponse } from "next/server";
import { db, businesses, categories } from "@/lib/db";
import { eq, and, ne, sql, or, ilike } from "drizzle-orm";
import slugify from "slugify";

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

// Fetch live details from Google Places API (comprehensive data)
async function fetchGoogleDetails(placeId: string): Promise<GooglePlaceDetails | null> {
  if (!GOOGLE_PLACES_API_KEY || !placeId) return null;
  
  try {
    // Request comprehensive fields including contact info
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
      "international_phone_number",
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
    console.log("Google API response:", data.status);
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

// Determine neighborhood from coordinates
function determineNeighborhood(lat: number, lng: number): string {
  if (lat > 33.05 && lng < -96.75) return "Legacy West";
  if (lat > 33.04 && lng > -96.72) return "East Plano";
  if (lat < 33.02 && lng > -96.72) return "Downtown Plano";
  if (lng < -96.8) return "West Plano";
  return "Plano";
}

// Save a Google Place to the database
async function saveGooglePlaceToDb(placeId: string, googleDetails: GooglePlaceDetails) {
  try {
    const name = googleDetails.name || "Unknown Business";
    const baseSlug = slugify(name, { lower: true, strict: true });
    
    // Generate unique slug
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const existing = await db
        .select({ id: businesses.id })
        .from(businesses)
        .where(eq(businesses.slug, slug))
        .limit(1);
      if (existing.length === 0) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const address = googleDetails.formatted_address || "";
    const addressParts = address.split(",").map((p) => p.trim());
    const zip = addressParts.find((p) => /^\d{5}/.test(p))?.match(/\d{5}/)?.[0] || null;

    const lat = googleDetails.geometry?.location.lat;
    const lng = googleDetails.geometry?.location.lng;

    const [inserted] = await db
      .insert(businesses)
      .values({
        googlePlaceId: placeId,
        name,
        slug,
        address: addressParts[0] || address,
        city: "Plano",
        state: "TX",
        zip,
        lat: lat?.toString() || null,
        lng: lng?.toString() || null,
        neighborhood: lat && lng ? determineNeighborhood(lat, lng) : "Plano",
        ratingAvg: googleDetails.rating?.toString() || "0",
        reviewCount: googleDetails.user_ratings_total || 0,
        priceLevel: googleDetails.price_level ?? null,
        photos: googleDetails.photos?.slice(0, 3).map((p) => p.photo_reference) || [],
        website: googleDetails.website || null,
        phone: googleDetails.formatted_phone_number || null,
        isFeatured: (googleDetails.rating || 0) >= 4.5,
      })
      .returning();

    console.log(`[Business API] Saved new business: ${name} with slug: ${slug}`);
    return inserted;
  } catch (error) {
    console.error("[Business API] Error saving business:", error);
    return null;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Try to find business by slug first
    let [business] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.slug, slug))
      .limit(1);

    // If not found by slug, try by googlePlaceId (for newly synced businesses)
    if (!business) {
      // Check if slug looks like a Google Place ID (starts with "ChIJ" or similar)
      if (slug.startsWith("ChIJ") || slug.startsWith("temp-")) {
        const placeId = slug.replace("temp-", "");
        
        [business] = await db
          .select()
          .from(businesses)
          .where(eq(businesses.googlePlaceId, placeId))
          .limit(1);
        
        // If still not found, fetch directly from Google and save to DB
        if (!business && GOOGLE_PLACES_API_KEY) {
          console.log(`[Business API] Fetching new business from Google: ${placeId}`);
          const googleDetails = await fetchGoogleDetails(placeId);
          
          if (googleDetails) {
            const savedBusiness = await saveGooglePlaceToDb(placeId, googleDetails);
            if (savedBusiness) {
              business = savedBusiness;
            }
          }
        }
      }
    }

    // If still not found, try partial match on name (for search results)
    if (!business) {
      const decodedSlug = decodeURIComponent(slug).replace(/-/g, " ");
      [business] = await db
        .select()
        .from(businesses)
        .where(ilike(businesses.name, `%${decodedSlug}%`))
        .limit(1);
    }

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

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

    // Fetch LIVE data from Google Places API (photos, reviews, current rating)
    let googleDetails: GooglePlaceDetails | null = null;
    let livePhotos: string[] = [];
    let liveReviews: any[] = [];
    let liveHours = business.hours;
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
          source: "google",
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
        liveHours = formatHours(googleDetails.opening_hours?.weekday_text) || business.hours;
        isOpenNow = googleDetails.opening_hours?.open_now || false;
        
        // Always use Google data if available (live data is more accurate)
        if (googleDetails.website) {
          business.website = googleDetails.website;
        }
        if (googleDetails.formatted_phone_number) {
          business.phone = googleDetails.formatted_phone_number;
        }
      }
    }
    
    // If no Google photos, use the thumbnail from database
    if (livePhotos.length === 0 && business.photos && business.photos.length > 0) {
      livePhotos = business.photos as string[];
    }

    // Get similar businesses (from database, same category)
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
      ...business,
      // Override with live data
      photos: livePhotos,
      hours: liveHours,
      ratingAvg: liveRating.toString(),
      reviewCount: liveReviewCount,
      isOpenNow,
      // Add category
      category: category ? {
        id: category.id,
        name: category.name,
        slug: category.slug,
        section: category.section,
      } : null,
    };

    return NextResponse.json({
      business: hybridBusiness,
      reviews: liveReviews,
      reviewsSource: liveReviews.length > 0 ? "google" : "none",
      totalReviewsOnGoogle: liveReviewCount,
      similarBusinesses: similarBusinesses.map(b => ({
        ...b,
        category: category ? { name: category.name, slug: category.slug } : null,
      })),
    });
  } catch (error) {
    console.error("Error fetching business details:", error);
    return NextResponse.json(
      { error: "Failed to fetch business details" },
      { status: 500 }
    );
  }
}
