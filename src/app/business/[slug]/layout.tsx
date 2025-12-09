import type { Metadata } from "next";
import { db, businesses, categories, reviews } from "@/lib/db";
import { eq } from "drizzle-orm";
import { generateBusinessMetadata, generateBusinessPageSchema } from "@/lib/seo";
import Script from "next/script";
import { notFound } from "next/navigation";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
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
    
    // Get reviews for structured data
    const businessReviews = await db
      .select()
      .from(reviews)
      .where(eq(reviews.businessId, business.id))
      .limit(10);
    
    return { business, category, reviews: businessReviews };
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
  
  // Generate structured data schemas
  const schemas = data 
    ? generateBusinessPageSchema(data.business, data.category, data.reviews)
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


