import type { Metadata } from "next";
import { db, businesses, categories, reviews } from "@/lib/db";
import { eq } from "drizzle-orm";
import { generateBusinessMetadata, generateBusinessPageSchema, GoogleReviewData } from "@/lib/seo";
import Script from "next/script";

// COMPLETELY DATABASE-ONLY - NO GOOGLE API CALLS
// All data including reviews is already cached in the database

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

// Fetch business data for metadata generation - DATABASE ONLY
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

    // Use cached reviews from database instead of calling Google API
    const cachedReviews = (business.cachedReviews as any[]) || [];
    const googleReviews: GoogleReviewData[] = cachedReviews.map(review => ({
      author_name: review.authorName || "Reviewer",
      rating: review.rating,
      text: review.text,
      time: review.time,
      profile_photo_url: review.authorPhoto,
      relative_time_description: review.relativeTime,
    }));

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

  const metadata = generateBusinessMetadata(
    data.business,
    data.category,
    data.reviews.length
  );

  return {
    ...metadata,
    other: {
      "llms-txt": `/api/llms/business/${data.business.slug}`,
    },
  };
}

export default async function BusinessLayout({ children, params }: LayoutProps) {
  const { slug } = await params;
  const data = await getBusinessData(slug);

  // Generate structured data schemas with cached reviews (no API call)
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
// NOTE: Return empty array to prevent build-time database queries for all businesses
// Pages will be generated on-demand (ISR) instead
export async function generateStaticParams() {
  // Return empty array - all pages will be generated on-demand
  // This prevents long build times
  return [];
}
