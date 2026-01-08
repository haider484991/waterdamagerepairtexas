import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStateBySlug, getCityBySlug } from "@/lib/location-data";
import { db, businesses, categories } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { BusinessCard } from "@/components/business";
import { JsonLd } from "@/components/seo/JsonLd";
import { generatePlaceSchema, generateLocalBusinessSchema } from "@/lib/seo/schema-markup";
import { FAQSection, generateWaterDamageFAQs } from "@/components/seo/FAQSection";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ state: string; city: string }> }): Promise<Metadata> {
  const { state: stateSlug, city: citySlug } = await params;
  const region = getStateBySlug(stateSlug);
  const city = region ? getCityBySlug(region.code, citySlug) : undefined;

  if (!region || !city) {
    return { title: "City Not Found" };
  }

  return {
    title: `Water Damage Restoration in ${city.name}, TX – Emergency Services | Texas Water Damage`,
    description: `Find the best water damage restoration, flood cleanup, mold remediation, and emergency water services in ${city.name}, Texas. 24/7 emergency response with free estimates.`,
    keywords: [
      `water damage ${city.name}`,
      `${city.name} TX water damage`,
      `flood restoration ${city.name}`,
      `emergency water damage ${city.name}`,
      `${city.name} mold remediation`,
    ],
  };
}

export default async function CityPage({ params }: { params: Promise<{ state: string; city: string }> }) {
  const { state: stateSlug, city: citySlug } = await params;
  const region = getStateBySlug(stateSlug);
  const city = region ? getCityBySlug(region.code, citySlug) : undefined;

  if (!region || !city) {
    notFound();
  }

  // Get all businesses in this city
  const businessResults = await db
    .select({
      business: businesses,
      category: categories,
    })
    .from(businesses)
    .leftJoin(categories, eq(businesses.categoryId, categories.id))
    .where(
      and(
        eq(businesses.city, city.name),
        eq(businesses.state, region.code)
      )
    )
    .orderBy(businesses.isFeatured, businesses.ratingAvg);

  const enrichedBusinesses = businessResults.map((result) => ({
    ...result.business,
    photos: (result.business.photos as string[]) || [],
    hours: result.business.hours as Record<string, string> | null,
    category: result.category ?? null,
  }));

  const faqs = generateWaterDamageFAQs(city.name, region.name);

  const businessSchemas = enrichedBusinesses.slice(0, 10).map((business) =>
    generateLocalBusinessSchema(business)
  );

  return (
    <>
      <JsonLd
        data={[
          generatePlaceSchema(city.name, "City", `Water damage restoration in ${city.name}, Texas`, "TX"),
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
                {city.name}, TX
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Water Damage Restoration in {city.name}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                Find {enrichedBusinesses.length} water damage restoration {enrichedBusinesses.length === 1 ? 'company' : 'companies'} in {city.name}, Texas.
                24/7 emergency flood cleanup, mold remediation, and insurance claim assistance.
              </p>
            </div>
          </div>
        </section>

        {/* Businesses */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">
              Water Damage Services in {city.name}
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
                  No water damage restoration services found in {city.name} yet.
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
          title={`Water Damage Restoration in ${city.name} - FAQ`}
          description={`Everything you need to know about water damage services in ${city.name}, Texas`}
        />
      </div>
    </>
  );
}
