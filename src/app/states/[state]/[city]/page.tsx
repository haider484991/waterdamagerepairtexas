import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStateBySlug, getCityBySlug } from "@/lib/location-data";
import { db, businesses, categories } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { BusinessCard } from "@/components/business";
import { JsonLd } from "@/components/seo/JsonLd";
import { generatePlaceSchema, generateLocalBusinessSchema } from "@/lib/seo/schema-markup";
import { FAQSection, generatePickleballFAQs } from "@/components/seo/FAQSection";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ state: string; city: string }> }): Promise<Metadata> {
  const { state: stateSlug, city: citySlug } = await params;
  const state = getStateBySlug(stateSlug);
  const city = state ? getCityBySlug(state.code, citySlug) : undefined;
  
  if (!state || !city) {
    return { title: "City Not Found" };
  }

  return {
    title: `Pickleball in ${city.name}, ${state.code} – Courts, Clubs & More | US Pickleball Directory`,
    description: `Find the best pickleball courts, clubs, equipment stores, coaches, and tournaments in ${city.name}, ${state.name}. Complete directory with reviews, hours, and contact information.`,
    keywords: [
      `pickleball ${city.name}`,
      `${city.name} ${state.code} pickleball`,
      `pickleball courts ${city.name}`,
      `where to play pickleball ${city.name}`,
      `${city.name} pickleball clubs`,
    ],
  };
}

export default async function CityPage({ params }: { params: Promise<{ state: string; city: string }> }) {
  const { state: stateSlug, city: citySlug } = await params;
  const state = getStateBySlug(stateSlug);
  const city = state ? getCityBySlug(state.code, citySlug) : undefined;

  if (!state || !city) {
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
        eq(businesses.state, state.code)
      )
    )
    .orderBy(businesses.isFeatured, businesses.ratingAvg);

  const enrichedBusinesses = businessResults.map((result) => ({
    ...result.business,
    photos: (result.business.photos as string[]) || [],
    hours: result.business.hours as Record<string, string> | null,
    category: result.category ?? null,
  }));

  const faqs = generatePickleballFAQs(city.name, state.name);

  const businessSchemas = enrichedBusinesses.slice(0, 10).map((business) => 
    generateLocalBusinessSchema(business)
  );

  return (
    <>
      <JsonLd 
        data={[
          generatePlaceSchema(city.name, "City", `Pickleball in ${city.name}, ${state.name}`, state.code),
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
                {city.name}, {state.code}
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Pickleball in {city.name}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                Discover {enrichedBusinesses.length} pickleball {enrichedBusinesses.length === 1 ? 'location' : 'locations'} in {city.name}, {state.name}. 
                Find courts, clubs, equipment, coaches, and tournaments near you.
              </p>
            </div>
          </div>
        </section>

        {/* Businesses */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">
              Pickleball Businesses in {city.name}
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
                  No pickleball businesses found in {city.name} yet.
                </p>
                <p className="text-sm text-muted-foreground">
                  Check back soon or explore nearby cities for pickleball options.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* FAQ */}
        <FAQSection 
          faqs={faqs}
          title={`Playing Pickleball in ${city.name} - FAQ`}
          description={`Everything you need to know about pickleball in ${city.name}, ${state.name}`}
        />
      </div>
    </>
  );
}

