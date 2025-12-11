import type { Metadata } from "next";
import type { Business, Category, Review, State, City } from "@/lib/db/schema";
import { generateBusinessDescription, detectAmenities, generateAmenitiesList } from "@/lib/content-generator";

const SITE_NAME =
  process.env.NEXT_PUBLIC_SITE_NAME || "US Pickleball Directory";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://uspickleballdirectory.com";

export function generateSiteMetadata(): Metadata {
  return {
    title: {
      default: "US Pickleball Directory – Find Pickleball Courts, Clubs & Equipment Nationwide",
      template: `%s | ${SITE_NAME}`,
    },
    description:
      "Discover pickleball courts, clubs, leagues, equipment stores, coaches, and tournaments across the United States. Your comprehensive guide to pickleball locations and resources in all 50 states.",
    keywords: [
      "pickleball directory",
      "pickleball courts near me",
      "pickleball clubs",
      "pickleball leagues",
      "pickleball equipment stores",
      "pickleball coaches",
      "pickleball tournaments",
      "where to play pickleball",
      "indoor pickleball courts",
      "outdoor pickleball facilities",
    ],
    authors: [{ name: SITE_NAME }],
    creator: SITE_NAME,
    openGraph: {
      type: "website",
      locale: "en_US",
      url: SITE_URL,
      siteName: SITE_NAME,
      title: "US Pickleball Directory – Find Pickleball Courts, Clubs & Equipment Nationwide",
      description:
        "Discover pickleball courts, clubs, leagues, equipment stores, coaches, and tournaments across the United States. Your complete resource for pickleball locations.",
      images: [
        {
          url: `${SITE_URL}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: SITE_NAME,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "US Pickleball Directory – Find Pickleball Courts, Clubs & Equipment Nationwide",
      description:
        "Discover pickleball courts, clubs, leagues, equipment stores, coaches, and tournaments across the United States.",
      images: [`${SITE_URL}/og-image.jpg`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large" as const,
        "max-snippet": -1,
      },
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    },
  };
}

// Enhanced business metadata for maximum SEO
export function generateBusinessMetadata(
  business: Business, 
  category?: Category | null,
  reviewCount?: number
): Metadata {
  const categoryName = category?.name || "Pickleball Business";
  const neighborhood = business.neighborhood || business.city;
  const rating = Number(business.ratingAvg) || 0;
  const reviews = reviewCount || business.reviewCount || 0;
  const priceRange = business.priceLevel ? "$".repeat(business.priceLevel) : "";
  
  // SEO-optimized title with location
  const title = `${business.name} - ${categoryName} in ${business.city}, ${business.state}`;
  
  // Generate dynamic description using content generator
  const dynamicDescription = generateBusinessDescription(business, category);
  
  // Build SEO description with rating info + dynamic content
  const descriptionParts = [];
  
  if (rating > 0 && reviews > 0) {
    descriptionParts.push(`${rating.toFixed(1)}★ rated with ${reviews} reviews.`);
  }
  
  descriptionParts.push(dynamicDescription);
  
  if (priceRange) {
    descriptionParts.push(`Price range: ${priceRange}.`);
  }
  
  // Get amenities for keywords
  const amenities = detectAmenities(business, category);
  const amenitiesList = generateAmenitiesList(amenities);
  
  const description = descriptionParts.join(" ").substring(0, 320);
  
  // Generate keywords specific to this pickleball business
  const keywords = [
    business.name,
    "pickleball",
    `${business.name} ${business.city}`,
    `${business.name} ${neighborhood}`,
    `${categoryName} ${business.city}`,
    `${categoryName} ${neighborhood}`,
    `${categoryName} near me`,
    `best ${categoryName.toLowerCase()} ${business.city}`,
    `${neighborhood} ${categoryName.toLowerCase()}`,
    business.address,
    `${business.city} ${business.state} ${categoryName.toLowerCase()}`,
    `pickleball ${business.city}`,
    // Add amenity-based keywords
    ...amenitiesList.map(a => `${a.toLowerCase()} ${business.city}`),
    ...(amenities.hasIndoorCourts ? [`indoor pickleball ${business.city}`, "indoor pickleball courts"] : []),
    ...(amenities.offersLessons ? [`pickleball lessons ${business.city}`, "pickleball coaching"] : []),
    ...(amenities.offersLeagues ? [`pickleball league ${business.city}`, "pickleball club"] : []),
  ].filter(Boolean);
  
  // Get image URL
  const imageUrl = business.photos?.[0] 
    ? (business.photos[0].startsWith("http") 
        ? business.photos[0] 
        : `${SITE_URL}/api/images?ref=${business.photos[0]}&maxwidth=1200`)
    : `${SITE_URL}/og-image.jpg`;
  
  const canonicalUrl = `${SITE_URL}/business/${business.slug}`;

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${business.name} | ${categoryName} in ${business.city}, ${business.state}`,
      description,
      type: "website",
      url: canonicalUrl,
      siteName: SITE_NAME,
      locale: "en_US",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${business.name} - ${categoryName} in ${business.city}, ${business.state}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${business.name} | ${categoryName}`,
      description: description.substring(0, 200),
      images: [imageUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large" as const,
        "max-snippet": -1,
      },
    },
    other: {
      // Additional meta tags for AI and rich snippets
      "geo.region": `US-${business.state}`,
      "geo.placename": business.city,
      "geo.position": business.lat && business.lng ? `${business.lat};${business.lng}` : "",
      "ICBM": business.lat && business.lng ? `${business.lat}, ${business.lng}` : "",
      "business:contact_data:locality": business.city,
      "business:contact_data:region": business.state,
      "business:contact_data:country_name": "United States",
    },
  };
}

export function generateCategoryMetadata(
  category: Category,
  businessCount: number,
  extras?: { avgRating?: number; totalReviews?: number }
) {
  const ratingSnippet =
    extras?.avgRating && extras.totalReviews
      ? ` Top picks average ${extras.avgRating.toFixed(1)}★ across ${extras.totalReviews} reviews.`
      : "";

  const title = `${category.name} Directory | US Pickleball Directory`;
  const description =
    category.description ||
    `Explore ${businessCount} ${category.name.toLowerCase()} options across the United States. Compare ratings, reviews, hours, and contact details.${ratingSnippet}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `${SITE_URL}/categories/${category.slug}`,
    },
    keywords: [
      `${category.name} USA`,
      `${category.name} United States`,
      `${category.name} near me`,
      `best ${category.name.toLowerCase()} USA`,
      `top rated ${category.name.toLowerCase()}`,
      `${category.name.toLowerCase()} directory`,
      `pickleball ${category.name.toLowerCase()}`,
    ],
  };
}

// Comprehensive LocalBusiness schema with all available data
export function generateLocalBusinessSchema(
  business: Business, 
  category?: Category | null,
  reviews?: Review[]
) {
  const rating = Number(business.ratingAvg) || 0;
  
  // Determine more specific business type based on category
  const businessTypeMap: Record<string, string> = {
    "restaurants-cafes": "Restaurant",
    "coffee-tea": "CafeOrCoffeeShop",
    "bars-nightlife": "BarOrPub",
    "hotels-accommodations": "Hotel",
    "medical-dental": "MedicalBusiness",
    "dental": "Dentist",
    "legal-financial": "ProfessionalService",
    "automotive": "AutoRepair",
    "fitness-gyms": "HealthClub",
    "spas-beauty": "BeautySalon",
    "hair-salons": "HairSalon",
    "real-estate": "RealEstateAgent",
    "schools-tutoring": "EducationalOrganization",
    "pet-care": "AnimalShelter",
    "grocery-specialty-food": "GroceryStore",
  };
  
  const businessType = category?.slug 
    ? (businessTypeMap[category.slug] || "LocalBusiness")
    : "LocalBusiness";

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": businessType,
    "@id": `${SITE_URL}/business/${business.slug}#localbusiness`,
    name: business.name,
    description: business.description || `${business.name} is a ${category?.name || "business"} located in ${business.city}, ${business.state}.`,
    url: `${SITE_URL}/business/${business.slug}`,
    telephone: business.phone,
    email: business.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: business.address,
      addressLocality: business.city,
      addressRegion: business.state,
      postalCode: business.zip,
      addressCountry: "US",
    },
    areaServed: {
      "@type": "City",
      name: business.city,
      containedIn: {
        "@type": "State",
        name: business.state,
      },
    },
    priceRange: business.priceLevel ? "$".repeat(business.priceLevel) : undefined,
    currenciesAccepted: "USD",
    paymentAccepted: "Cash, Credit Card",
  };

  // Add geo coordinates
  if (business.lat && business.lng) {
    schema.geo = {
      "@type": "GeoCoordinates",
      latitude: Number(business.lat),
      longitude: Number(business.lng),
    };
    schema.hasMap = `https://www.google.com/maps?q=${business.lat},${business.lng}`;
  }

  // Add website with sameAs for social signals
  if (business.website) {
    schema.sameAs = [business.website];
  }

  // Add aggregate rating
  if (rating > 0 && business.reviewCount && business.reviewCount > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: rating.toFixed(1),
      reviewCount: business.reviewCount,
      bestRating: "5",
      worstRating: "1",
    };
  }

  // Add individual reviews
  if (reviews && reviews.length > 0) {
    schema.review = reviews.slice(0, 10).map((review) => ({
      "@type": "Review",
      "@id": `${SITE_URL}/business/${business.slug}#review-${review.id}`,
      reviewRating: {
        "@type": "Rating",
        ratingValue: review.rating,
        bestRating: "5",
        worstRating: "1",
      },
      author: {
        "@type": "Person",
        name: "Customer",
      },
      reviewBody: review.content || review.title,
      datePublished: review.createdAt instanceof Date 
        ? review.createdAt.toISOString() 
        : review.createdAt,
    }));
  }

  // Add opening hours
  if (business.hours && Object.keys(business.hours).length > 0) {
    const hoursSpec = Object.entries(business.hours)
      .filter(([, hours]) => hours && hours.toLowerCase() !== "closed")
      .map(([day, hours]) => {
        const parts = hours.split(" - ");
        if (parts.length === 2) {
          return {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: day.charAt(0).toUpperCase() + day.slice(1),
            opens: convertTo24Hour(parts[0].trim()),
            closes: convertTo24Hour(parts[1].trim()),
          };
        }
        return null;
      })
      .filter(Boolean);
    
    if (hoursSpec.length > 0) {
      schema.openingHoursSpecification = hoursSpec;
    }
  }

  // Add photos
  if (business.photos && business.photos.length > 0) {
    schema.image = business.photos.map(photo => 
      photo.startsWith("http") ? photo : `${SITE_URL}/api/images?ref=${photo}&maxwidth=800`
    );
  }

  // Add verification status
  if (business.isVerified) {
    schema.isAccessibleForFree = true;
  }

  return schema;
}

// Helper function to convert 12h to 24h time format
function convertTo24Hour(time12h: string): string {
  if (!time12h) return "00:00";
  
  const match = time12h.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM|am|pm)?/i);
  if (!match) return time12h;
  
  let hours = parseInt(match[1], 10);
  const minutes = match[2] || "00";
  const period = match[3]?.toUpperCase();
  
  if (period === "PM" && hours !== 12) {
    hours += 12;
  } else if (period === "AM" && hours === 12) {
    hours = 0;
  }
  
  return `${hours.toString().padStart(2, "0")}:${minutes}`;
}

// Generate comprehensive page schema with multiple types
export function generateBusinessPageSchema(
  business: Business,
  category?: Category | null,
  reviews?: Review[]
) {
  const schemas = [];
  
  // 1. Main LocalBusiness schema
  schemas.push(generateLocalBusinessSchema(business, category, reviews));
  
  // 2. Breadcrumb schema
  const breadcrumbItems = [
    { name: "Home", url: SITE_URL },
    { name: "Categories", url: `${SITE_URL}/categories` },
  ];
  
  if (category) {
    breadcrumbItems.push({
      name: category.name,
      url: `${SITE_URL}/categories/${category.slug}`,
    });
  }
  
  breadcrumbItems.push({
    name: business.name,
    url: `${SITE_URL}/business/${business.slug}`,
  });
  
  schemas.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  });
  
  // 3. WebPage schema
  schemas.push({
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE_URL}/business/${business.slug}#webpage`,
    url: `${SITE_URL}/business/${business.slug}`,
    name: `${business.name} - ${category?.name || "Business"} in ${business.city}, ${business.state}`,
    description: business.description || `Find ${business.name} in ${business.city}, ${business.state}. View hours, reviews, and contact information.`,
    isPartOf: {
      "@type": "WebSite",
      "@id": `${SITE_URL}#website`,
      name: SITE_NAME,
      url: SITE_URL,
    },
    about: {
      "@id": `${SITE_URL}/business/${business.slug}#localbusiness`,
    },
    primaryImageOfPage: business.photos?.[0] 
      ? (business.photos[0].startsWith("http") ? business.photos[0] : `${SITE_URL}/api/images?ref=${business.photos[0]}&maxwidth=800`)
      : undefined,
    dateModified: business.updatedAt instanceof Date 
      ? business.updatedAt.toISOString() 
      : business.updatedAt,
    inLanguage: "en-US",
  });
  
  // 4. FAQPage schema if we have common questions
  const faqItems = [];
  
  if (business.hours) {
    faqItems.push({
      "@type": "Question",
      name: `What are ${business.name}'s hours of operation?`,
      acceptedAnswer: {
        "@type": "Answer",
        text: Object.entries(business.hours)
          .map(([day, hours]) => `${day.charAt(0).toUpperCase() + day.slice(1)}: ${hours}`)
          .join(", "),
      },
    });
  }
  
  if (business.phone) {
    faqItems.push({
      "@type": "Question",
      name: `What is ${business.name}'s phone number?`,
      acceptedAnswer: {
        "@type": "Answer",
        text: `You can reach ${business.name} at ${business.phone}.`,
      },
    });
  }
  
  if (business.address) {
    faqItems.push({
      "@type": "Question",
      name: `Where is ${business.name} located?`,
      acceptedAnswer: {
        "@type": "Answer",
        text: `${business.name} is located at ${business.address}, ${business.city}, ${business.state} ${business.zip || ""}.`,
      },
    });
  }
  
  if (business.priceLevel) {
    faqItems.push({
      "@type": "Question",
      name: `How expensive is ${business.name}?`,
      acceptedAnswer: {
        "@type": "Answer",
        text: `${business.name} has a price range of ${"$".repeat(business.priceLevel)} (${
          business.priceLevel === 1 ? "Budget-friendly" :
          business.priceLevel === 2 ? "Moderate" :
          business.priceLevel === 3 ? "Upscale" : "Fine Dining"
        }).`,
      },
    });
  }
  
  if (faqItems.length > 0) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems,
    });
  }
  
  return schemas;
}

export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}

export function generateSearchActionSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

