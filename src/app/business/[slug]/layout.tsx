import type { Metadata } from "next";
import { db, businesses, categories, reviews } from "@/lib/db";
import { eq } from "drizzle-orm";
import { generateBusinessMetadata, generateBusinessPageSchema, GoogleReviewData } from "@/lib/seo";
import Script from "next/script";

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

// Fetch Google reviews for schema enrichment
async function fetchGoogleReviews(placeId: string): Promise<GoogleReviewData[]> {
  if (!GOOGLE_PLACES_API_KEY || !placeId) return [];

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews&key=${GOOGLE_PLACES_API_KEY}`;
    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) return [];

    const data = await response.json();
    if (data.status !== "OK" || !data.result?.reviews) return [];

    return data.result.reviews.map((review: GoogleReviewData & { profile_photo_url?: string; relative_time_description?: string }) => ({
      author_name: review.author_name,
      rating: review.rating,
      text: review.text,
      time: review.time,
      profile_photo_url: review.profile_photo_url,
      relative_time_description: review.relative_time_description,
    }));
  } catch (error) {
    console.error("Error fetching Google reviews:", error);
    return [];
  }
}

// Fetch business data for metadata generation
async function getBusinessData(slug: string) {
  try {
    // First try to find by slug
    let [business] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.slug, slug))
      .limit(1);

    // If not found by slug, try googlePlaceId (for Google Places results)
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
      [category] = await db
        .select()
        .from(categories)
        .where(eq(categories.id, business.categoryId))
        .limit(1);
    }

    // Get database reviews for structured data
    const businessReviews = await db
      .select()
      .from(reviews)
      .where(eq(reviews.businessId, business.id))
      .limit(10);

    // Fetch Google reviews with actual reviewer names for enhanced schema
    const googleReviews = business.googlePlaceId
      ? await fetchGoogleReviews(business.googlePlaceId)
      : [];

    return { business, category, reviews: businessReviews, googleReviews };
  } catch (error) {
    console.error("Error fetching business for metadata:", error);
    return null;
  }
}

// Generate dynamic metadata for each business page
export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getBusinessData(slug);
  
  if (!data) {
    return {
      title: "Business Not Found",
      description: "The business you're looking for could not be found.",
    };
  }
  
  return generateBusinessMetadata(
    data.business, 
    data.category,
    data.reviews.length
  );
}

export default async function BusinessLayout({ children, params }: LayoutProps) {
  const { slug } = await params;
  const data = await getBusinessData(slug);

  // Generate structured data schemas with Google reviews for actual reviewer names
  const schemas = data
    ? generateBusinessPageSchema(data.business, data.category, data.reviews, data.googleReviews)
    : [];

  return (
    <>
      {/* Structured Data for SEO and AI */}
      {schemas.map((schema, index) => (
        <Script
          key={`schema-${index}`}
          id={`structured-data-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          strategy="beforeInteractive"
        />
      ))}
      {children}
    </>
  );
}

// Enable static generation with dynamic params
export async function generateStaticParams() {
  try {
    const allBusinesses = await db
      .select({ slug: businesses.slug })
      .from(businesses)
      .limit(1000); // Limit for build time optimization
    
    return allBusinesses.map((b) => ({
      slug: b.slug,
    }));
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}


