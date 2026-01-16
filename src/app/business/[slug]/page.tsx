import { notFound } from "next/navigation";
import { db, businesses, categories } from "@/lib/db";
import { eq, and, ne, sql } from "drizzle-orm";
import { BusinessDetailClient } from "./BusinessDetailClient";
import { generateBusinessContent } from "@/lib/content-generator";

// COMPLETELY DATABASE-ONLY - NO GOOGLE API CALLS
// All data including images is already cached in the database

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

    // Use ONLY database cached data - NO API CALLS
    // Prefer cached URLs (Supabase permanent URLs), fallback to photo references
    const photos: string[] =
      ((business.cachedImageUrls as string[]) || []).length > 0
        ? (business.cachedImageUrls as string[])
        : (business.photos as string[]) || [];

    // Use cached reviews from database
    const reviews = ((business.cachedReviews as any[]) || []).map((review, index) => ({
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

    // Use all cached contact info
    const phone = business.cachedPhone || business.phone;
    const website = business.cachedWebsite || business.website;
    const hours = (business.cachedHours as Record<string, string>) || (business.hours as Record<string, string> | null);
    const rating = Number(business.ratingAvg) || 0;
    const reviewCount = business.reviewCount || 0;
    const googleMapsUrl = business.googleMapsUrl;

    // Get similar businesses (database only)
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

    // Build the response using only database data
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
      isOpenNow: false, // Can't determine without API call, show as unknown
      category: category ? {
        name: category.name,
        slug: category.slug,
        section: category.section,
      } : null,
      dataSource: "database", // Always database now
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
