import Script from "next/script";

interface JsonLdProps {
  data: Record<string, any> | Record<string, any>[];
  id?: string;
}

export function JsonLd({ data, id = "json-ld" }: JsonLdProps) {
  // Handle both single schema and array of schemas
  const jsonLdData = Array.isArray(data) 
    ? {
        "@context": "https://schema.org",
        "@graph": data,
      }
    : data;

  return (
    <Script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
      strategy="beforeInteractive"
    />
  );
}

export function LocalBusinessJsonLd({
  name,
  description,
  address,
  phone,
  website,
  rating,
  reviewCount,
  priceRange,
  hours,
  images,
  geo,
}: {
  name: string;
  description?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  phone?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  priceRange?: string;
  hours?: Record<string, string>;
  images?: string[];
  geo?: { lat: number; lng: number };
}) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name,
    description,
    address: {
      "@type": "PostalAddress",
      streetAddress: address.street,
      addressLocality: address.city,
      addressRegion: address.state,
      postalCode: address.zip,
      addressCountry: "US",
    },
    telephone: phone,
    url: website,
    priceRange,
    image: images,
  };

  if (geo) {
    data.geo = {
      "@type": "GeoCoordinates",
      latitude: geo.lat,
      longitude: geo.lng,
    };
  }

  if (rating && reviewCount) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: rating,
      reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  if (hours) {
    data.openingHoursSpecification = Object.entries(hours).map(([day, time]) => {
      if (time.toLowerCase() === "closed") {
        return null;
      }
      const [opens, closes] = time.split(" - ");
      return {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: day.charAt(0).toUpperCase() + day.slice(1),
        opens,
        closes,
      };
    }).filter(Boolean);
  }

  return <JsonLd data={data} />;
}

export function BreadcrumbJsonLd({
  items,
}: {
  items: Array<{ name: string; url: string }>;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return <JsonLd data={data} />;
}

export function WebsiteJsonLd({
  name,
  url,
  searchUrl,
}: {
  name: string;
  url: string;
  searchUrl?: string;
}) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url,
  };

  if (searchUrl) {
    data.potentialAction = {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: searchUrl,
      },
      "query-input": "required name=search_term_string",
    };
  }

  return <JsonLd data={data} />;
}

export function OrganizationJsonLd({
  name,
  url,
  logo,
  sameAs,
}: {
  name: string;
  url: string;
  logo?: string;
  sameAs?: string[];
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url,
    logo,
    sameAs,
  };

  return <JsonLd data={data} />;
}

