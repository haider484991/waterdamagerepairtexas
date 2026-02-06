import type { Metadata } from "next";
import { getBusinessBySlug, getBusinessByPlaceId } from "@/lib/local-data";
import { generateBusinessMetadata, generateBusinessPageSchema, GoogleReviewData } from "@/lib/seo";
import Script from "next/script";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

function getBusinessData(slug: string) {
  try {
    let business = getBusinessBySlug(slug);
    if (!business) {
      business = getBusinessByPlaceId(slug);
    }
    if (!business) return null;

    const category = business.category;
    const googleReviews: GoogleReviewData[] = [];

    return { business, category, reviews: [], googleReviews };
  } catch (error) {
    console.error("Error fetching business for metadata:", error);
    return null;
  }
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { slug } = await params;
  const data = getBusinessData(slug);

  if (!data) {
    return {
      title: "Business Not Found",
      description: "The business you're looking for could not be found.",
    };
  }

  const metadata = generateBusinessMetadata(
    data.business,
    data.category,
    data.business.reviewCount || 0
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
  const data = getBusinessData(slug);

  const schemas = data
    ? generateBusinessPageSchema(data.business, data.category, data.reviews, data.googleReviews)
    : [];

  return (
    <>
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

export async function generateStaticParams() {
  return [];
}
