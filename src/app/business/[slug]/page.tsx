import { notFound } from "next/navigation";
import { BusinessDetailClient } from "./BusinessDetailClient";
import { generateBusinessContent } from "@/lib/content-generator";
import { getBusinessBySlug, getBusinessByPlaceId, getSimilarBusinesses } from "@/lib/local-data";

function getBusinessData(slug: string) {
  try {
    // Try by slug first, then by googlePlaceId
    let business = getBusinessBySlug(slug);
    if (!business) {
      business = getBusinessByPlaceId(slug);
    }
    if (!business) return null;

    const photos = business.photos || [];
    const phone = business.phone;
    const website = business.website;
    const hours = business.hours;
    const rating = parseFloat(business.ratingAvg) || 0;
    const reviewCount = business.reviewCount || 0;

    const similarBusinesses = getSimilarBusinesses(business.slug, 4);

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
      googleMapsUrl: business.googleMapsUrl,
      isOpenNow: false,
      category: business.category
        ? {
            name: business.category.name,
            slug: business.category.slug,
            section: business.category.section,
          }
        : null,
      dataSource: "local",
      // Rich data from Outscraper
      reviewsPerScore: business.reviewsPerScore || null,
      reviewsLink: business.reviewsLink || null,
      logo: business.logo || null,
      subtypes: business.subtypes || [],
      about: business.about || null,
      businessStatus: business.businessStatus || null,
      facebook: business.facebook || null,
      instagram: business.instagram || null,
      twitter: business.twitter || null,
      linkedin: business.linkedin || null,
      streetView: business.streetView || null,
      priceRange: business.priceRange || null,
    };

    return {
      business: hybridBusiness,
      reviews: [],
      reviewsSource: "none" as const,
      totalReviewsOnGoogle: reviewCount,
      similarBusinesses: similarBusinesses.map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        description: b.description,
        address: b.address,
        city: b.city,
        state: b.state,
        neighborhood: b.neighborhood,
        priceLevel: b.priceLevel,
        ratingAvg: b.ratingAvg,
        reviewCount: b.reviewCount,
        photos: b.photos || [],
        googlePlaceId: b.googlePlaceId,
        category: b.category ? { name: b.category.name, slug: b.category.slug } : null,
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
  const data = getBusinessData(slug);

  if (!data?.business) {
    notFound();
  }

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
