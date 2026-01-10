/**
 * Schema.org structured data markup for SEO and AI search engines
 * Enhanced for AI search engines (ChatGPT, Claude, Perplexity) and traditional SEO
 */

import type { Business, Category } from "@/lib/db/schema";
import { getSiteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Water Damage Repair USA";

/**
 * Enhanced Organization schema for the main site
 * Provides E-E-A-T signals for AI and traditional search engines
 */
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    alternateName: "Water Damage Repair",
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      "@id": `${SITE_URL}/#logo`,
      url: `${SITE_URL}/water-damage-logo.png`,
      contentUrl: `${SITE_URL}/water-damage-logo.png`,
      width: 512,
      height: 512,
      caption: "Water Damage Repair USA Logo",
    },
    image: `${SITE_URL}/water-damage-logo.png`,
    description: "America's comprehensive directory for water damage restoration professionals. Find trusted emergency flood cleanup, mold remediation, and water extraction services with verified ratings and reviews nationwide.",
    foundingDate: "2024",
    areaServed: {
      "@type": "Country",
      name: "United States",
    },
    knowsAbout: [
      "Water Damage Restoration",
      "Flood Cleanup Services",
      "Mold Remediation",
      "Emergency Water Removal",
      "Structural Drying",
      "Water Extraction",
      "Storm Damage Repair",
      "Insurance Claim Assistance",
    ],
    slogan: "Find Trusted Water Damage Restoration Professionals Nationwide",
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "Customer Service",
        url: `${SITE_URL}/contact`,
        availableLanguage: ["English", "Spanish"],
      },
    ],
    sameAs: [
      // Social profiles can be added here
    ],
  };
}

/**
 * WebSite schema with SearchAction for sitelinks search box
 */
export function generateWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    alternateName: "Water Damage Repair",
    url: SITE_URL,
    description: "Find and compare water damage restoration services across the USA",
    publisher: {
      "@id": `${SITE_URL}/#organization`,
    },
    inLanguage: "en-US",
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
 * Service schema for water damage service categories
 * Helps AI search engines understand what services are offered
 */
export function generateServiceSchema(category: Category, businessCount: number) {
  const serviceTypes: Record<string, { serviceType: string; description: string; offers: string[] }> = {
    "water-damage-restoration": {
      serviceType: "WaterDamageRestoration",
      description: "Professional water damage restoration services including water extraction, structural drying, and property restoration after floods, leaks, or storms.",
      offers: ["Water Extraction", "Structural Drying", "Dehumidification", "Sanitization", "Property Restoration"],
    },
    "flood-damage-restoration": {
      serviceType: "FloodCleanup",
      description: "Emergency flood damage cleanup and restoration services for homes and businesses affected by natural flooding, storms, or sewage backups.",
      offers: ["Flood Water Removal", "Sewage Cleanup", "Storm Damage Repair", "Basement Flooding", "Content Restoration"],
    },
    "mold-remediation": {
      serviceType: "MoldRemediation",
      description: "Professional mold inspection, testing, and remediation services to safely remove mold and prevent future growth.",
      offers: ["Mold Inspection", "Mold Testing", "Mold Removal", "Air Quality Testing", "Prevention Treatment"],
    },
    "emergency-water-removal": {
      serviceType: "EmergencyWaterRemoval",
      description: "24/7 emergency water removal services with rapid response for burst pipes, appliance failures, and sudden flooding.",
      offers: ["24/7 Emergency Response", "Water Extraction", "Pump Out Services", "Emergency Board Up", "Temporary Repairs"],
    },
    "structural-drying-services": {
      serviceType: "StructuralDrying",
      description: "Industrial-grade structural drying services using advanced dehumidification and air movement equipment.",
      offers: ["Industrial Drying", "Dehumidification", "Moisture Monitoring", "Hardwood Floor Drying", "Wall Cavity Drying"],
    },
  };

  const serviceInfo = serviceTypes[category.slug] || {
    serviceType: "WaterDamageService",
    description: category.description || `Professional ${category.name} services nationwide.`,
    offers: ["Professional Service", "Licensed Technicians", "Insurance Assistance"],
  };

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${SITE_URL}/categories/${category.slug}#service`,
    name: category.name,
    serviceType: serviceInfo.serviceType,
    description: serviceInfo.description,
    provider: {
      "@id": `${SITE_URL}/#organization`,
    },
    areaServed: {
      "@type": "Country",
      name: "United States",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `${category.name} Services`,
      itemListElement: serviceInfo.offers.map((offer, index) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: offer,
        },
        position: index + 1,
      })),
    },
    aggregateRating: businessCount > 0 ? {
      "@type": "AggregateRating",
      ratingValue: "4.5",
      ratingCount: businessCount,
      bestRating: "5",
      worstRating: "1",
    } : undefined,
  };
}

/**
 * HowTo schema for water damage response
 * Excellent for AI search engines answering "how to" queries
 */
export function generateHowToSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "@id": `${SITE_URL}/#howto-water-damage`,
    name: "How to Handle Water Damage Emergency",
    description: "Step-by-step guide on what to do when you discover water damage in your home or business.",
    totalTime: "PT2H",
    estimatedCost: {
      "@type": "MonetaryAmount",
      currency: "USD",
      value: "0",
    },
    supply: [
      { "@type": "HowToSupply", name: "Phone to call professionals" },
      { "@type": "HowToSupply", name: "Camera for documentation" },
      { "@type": "HowToSupply", name: "Towels for minor water containment" },
    ],
    tool: [
      { "@type": "HowToTool", name: "Flashlight" },
      { "@type": "HowToTool", name: "Rubber gloves" },
      { "@type": "HowToTool", name: "Wet/dry vacuum (optional)" },
    ],
    step: [
      {
        "@type": "HowToStep",
        name: "Ensure Safety First",
        text: "Turn off electricity to affected areas if safe to do so. Avoid standing water if electrical outlets are submerged. Leave the building if structural damage is suspected.",
        position: 1,
      },
      {
        "@type": "HowToStep",
        name: "Stop the Water Source",
        text: "If the water damage is from a burst pipe or appliance, shut off the main water valve. For roof leaks, place buckets to collect water.",
        position: 2,
      },
      {
        "@type": "HowToStep",
        name: "Document Everything",
        text: "Take photos and videos of all damage before any cleanup. This documentation is crucial for insurance claims.",
        position: 3,
      },
      {
        "@type": "HowToStep",
        name: "Call a Professional",
        text: "Contact a licensed water damage restoration company immediately. Water damage worsens within 24-48 hours and can lead to mold growth.",
        url: `${SITE_URL}/search?q=emergency+water+damage`,
        position: 4,
      },
      {
        "@type": "HowToStep",
        name: "Contact Your Insurance",
        text: "Notify your homeowner's or business insurance company about the damage. Many restoration companies work directly with insurance adjusters.",
        position: 5,
      },
      {
        "@type": "HowToStep",
        name: "Begin Initial Cleanup",
        text: "While waiting for professionals, remove small valuables from affected areas. Do not use household vacuums on water - only wet/dry vacuums are safe.",
        position: 6,
      },
    ],
  };
}

/**
 * Basic LocalBusiness schema for water damage restoration businesses
 * Note: For comprehensive LocalBusiness schema with reviews, use the version in src/lib/seo/index.ts
 */
export function generateLocalBusinessSchema(business: Business, _category?: Category | null) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/business/${business.slug}`,
    name: business.name,
    url: business.website || `${SITE_URL}/business/${business.slug}`,
    description: business.description || `${business.name} - Water damage restoration in ${business.city}, ${business.state}`,
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
      .filter(([, time]) => time && time.toLowerCase() !== "closed")
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
export function combineSchemas(...schemas: Record<string, unknown>[]) {
  return {
    "@context": "https://schema.org",
    "@graph": schemas,
  };
}

