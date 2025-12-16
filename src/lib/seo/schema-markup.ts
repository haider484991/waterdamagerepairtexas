/**
 * Schema.org structured data markup for SEO and AI search engines
 */

import type { Business, Category } from "@/lib/db/schema";
import { getSiteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Pickleball Courts";

/**
 * Organization schema for the main site
 */
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/pickleball-logo.png`,
    description: "Discover pickleball courts, clubs, leagues, equipment stores, coaches, and tournaments across the United States.",
    sameAs: [
      // Add social media profiles here when available
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Service",
      url: `${SITE_URL}/contact`,
    },
  };
}

/**
 * LocalBusiness schema for pickleball businesses
 */
export function generateLocalBusinessSchema(business: Business, category?: Category | null) {
  const schema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    "@id": `${SITE_URL}/business/${business.slug}`,
    name: business.name,
    url: business.website || `${SITE_URL}/business/${business.slug}`,
    description: business.description || `${business.name} - Pickleball facility in ${business.city}, ${business.state}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: business.address,
      addressLocality: business.city,
      addressRegion: business.state,
      postalCode: business.zip || "",
      addressCountry: "US",
    },
  };

  // Add geo coordinates if available
  if (business.lat && business.lng) {
    schema.geo = {
      "@type": "GeoCoordinates",
      latitude: parseFloat(business.lat),
      longitude: parseFloat(business.lng),
    };
  }

  // Add rating if available
  if (business.ratingAvg && Number(business.ratingAvg) > 0 && (business.reviewCount ?? 0) > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: parseFloat(business.ratingAvg),
      reviewCount: business.reviewCount,
      bestRating: "5",
      worstRating: "1",
    };
  }

  // Add phone number if available
  if (business.phone) {
    schema.telephone = business.phone;
  }

  // Add opening hours if available
  if (business.hours && Object.keys(business.hours).length > 0) {
    const openingHours = Object.entries(business.hours)
      .filter(([_, time]) => time && time.toLowerCase() !== "closed")
      .map(([day, time]) => `${day.charAt(0).toUpperCase() + day.slice(1)} ${time}`);
    
    if (openingHours.length > 0) {
      schema.openingHours = openingHours;
    }
  }

  // Add price range if available
  if (business.priceLevel) {
    schema.priceRange = "$".repeat(business.priceLevel);
  }

  // Add image if available
  if (business.photos && business.photos.length > 0) {
    schema.image = business.photos[0].startsWith("http")
      ? business.photos[0]
      : `${SITE_URL}/api/images?ref=${business.photos[0]}&maxwidth=1200`;
  }

  return schema;
}

/**
 * BreadcrumbList schema for navigation
 */
export function generateBreadcrumbSchema(breadcrumbs: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.url}`,
    })),
  };
}

/**
 * FAQPage schema for Q&A content
 */
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * ItemList schema for category/location pages
 */
export function generateItemListSchema(
  items: Array<{ name: string; url: string }>,
  listName: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: listName,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: `${SITE_URL}${item.url}`,
    })),
  };
}

/**
 * Place schema for state/city pages
 */
export function generatePlaceSchema(
  placeName: string,
  placeType: "State" | "City",
  description: string,
  stateCode?: string
) {
  return {
    "@context": "https://schema.org",
    "@type": placeType === "City" ? "City" : "State",
    name: placeName,
    description,
    ...(stateCode && placeType === "City" ? { containedInPlace: { "@type": "State", name: stateCode } } : {}),
  };
}

/**
 * SearchAction schema for site search
 */
export function generateSearchActionSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
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

/**
 * Combine multiple schema objects into a single graph
 */
export function combineSchemas(...schemas: Record<string, any>[]) {
  return {
    "@context": "https://schema.org",
    "@graph": schemas,
  };
}

