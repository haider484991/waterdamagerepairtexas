import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStateBySlug } from "@/lib/location-data";
import { getBusinessesByCity, getCityNameFromSlug } from "@/lib/local-data";
import { BusinessCard } from "@/components/business";
import { JsonLd } from "@/components/seo/JsonLd";
import { generatePlaceSchema, generateLocalBusinessSchema } from "@/lib/seo/schema-markup";
import { FAQSection, generateWaterDamageFAQs } from "@/components/seo/FAQSection";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { getSiteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();

export async function generateMetadata({ params }: { params: Promise<{ state: string; city: string }> }): Promise<Metadata> {
  const { state: stateSlug, city: citySlug } = await params;
  const region = getStateBySlug(stateSlug);
  const cityName = region ? getCityNameFromSlug(region.code, citySlug) : null;

  if (!region || !cityName) {
    return { title: "City Not Found" };
  }

  const canonicalUrl = `${SITE_URL}/states/${region.slug}/${citySlug}`;

  return {
    title: `Water Damage Restoration in ${cityName}, ${region.code} – Emergency Services | Water Damage Repair USA`,
    description: `Find the best water damage restoration, flood cleanup, mold remediation, and emergency water services in ${cityName}, ${region.name}. 24/7 emergency response with free estimates.`,
    keywords: [
      `water damage ${cityName}`,
      `${cityName} ${region.code} water damage`,
      `flood restoration ${cityName}`,
      `emergency water damage ${cityName}`,
      `${cityName} mold remediation`,
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `Water Damage Restoration in ${cityName}, ${region.code}`,
      description: `Find water damage restoration, flood cleanup, mold remediation in ${cityName}, ${region.name}. 24/7 emergency response.`,
      url: canonicalUrl,
      type: "website",
    },
    other: {
      "llms-txt": `/api/llms/state/${stateSlug}/${citySlug}`,
    },
  };
}

export default async function CityPage({ params }: { params: Promise<{ state: string; city: string }> }) {
  const { state: stateSlug, city: citySlug } = await params;
  const region = getStateBySlug(stateSlug);
  const cityName = region ? getCityNameFromSlug(region.code, citySlug) : null;

  if (!region || !cityName) {
    notFound();
  }

  const enrichedBusinesses = getBusinessesByCity(cityName, region.code);

  const faqs = generateWaterDamageFAQs(cityName, region.name);

  const businessSchemas = enrichedBusinesses.slice(0, 10).map((business) =>
    generateLocalBusinessSchema(business)
  );

  return (
    <>
      <JsonLd
        data={[
          generatePlaceSchema(cityName, "City", `Water damage restoration in ${cityName}, ${region.name}`, region.code),
          ...businessSchemas,
        ]}
        id="city-schema"
      />

      <div className="min-h-screen">
        {/* Hero */}
        <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Badge className="mb-4">
                <MapPin className="w-4 h-4 mr-1" />
                {cityName}, {region.code}
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Water Damage Restoration in {cityName}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                Find {enrichedBusinesses.length} water damage restoration {enrichedBusinesses.length === 1 ? 'company' : 'companies'} in {cityName}, {region.name}.
                24/7 emergency flood cleanup, mold remediation, and insurance claim assistance.
              </p>
            </div>
          </div>
        </section>

        {/* Businesses */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">
              Water Damage Services in {cityName}
            </h2>

            {enrichedBusinesses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrichedBusinesses.map((business) => (
                  <BusinessCard key={business.id} business={business} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground mb-4">
                  No water damage restoration services found in {cityName} yet.
                </p>
                <p className="text-sm text-muted-foreground">
                  Check back soon or explore nearby cities for water damage services.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* FAQ */}
        <FAQSection
          faqs={faqs}
          title={`Water Damage Restoration in ${cityName} - FAQ`}
          description={`Everything you need to know about water damage services in ${cityName}, ${region.name}`}
        />
      </div>
    </>
  );
}
