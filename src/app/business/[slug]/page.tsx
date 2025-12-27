import { notFound } from "next/navigation";
import { BusinessDetailClient } from "./BusinessDetailClient";

// Server-side data fetching for SEO - content will be in initial HTML
async function getBusinessData(slug: string) {
  try {
    // Use absolute URL for server-side fetch
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    const response = await fetch(`${baseUrl}/api/businesses/${slug}`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
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
