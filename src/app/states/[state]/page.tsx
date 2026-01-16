import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Building2, Droplets, Phone } from "lucide-react";
import { getStateBySlug, getCitiesForState } from "@/lib/location-data";
import { db, businesses, categories } from "@/lib/db";
import { eq, and, sql } from "drizzle-orm";
import { JsonLd } from "@/components/seo/JsonLd";
import { generatePlaceSchema, generateItemListSchema } from "@/lib/seo/schema-markup";
import { FAQSection, generateWaterDamageFAQs } from "@/components/seo/FAQSection";
import { getSiteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();

export async function generateMetadata({ params }: { params: Promise<{ state: string }> }): Promise<Metadata> {
  const { state: stateSlug } = await params;
  const region = getStateBySlug(stateSlug);

  if (!region) {
    return { title: "Region Not Found" };
  }

  const canonicalUrl = `${SITE_URL}/states/${region.slug}`;

  return {
    title: `Water Damage Restoration in ${region.name} – Emergency Services | Water Damage Repair USA`,
    description: `Find water damage restoration, flood cleanup, mold remediation, and emergency water services in ${region.name}. 24/7 emergency response available.`,
    keywords: [
      `water damage ${region.name}`,
      `${region.name} flood restoration`,
      `${region.name} mold remediation`,
      `emergency water damage ${region.code}`,
      `water damage repair ${region.name}`,
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `Water Damage Restoration in ${region.name}`,
      description: `Find water damage restoration, flood cleanup, mold remediation in ${region.name}. 24/7 emergency response.`,
      url: canonicalUrl,
      type: "website",
    },
    other: {
      "llms-txt": `/api/llms/state/${stateSlug}`,
    },
  };
}

export default async function StatePage({ params }: { params: Promise<{ state: string }> }) {
  const { state: stateSlug } = await params;
  const region = getStateBySlug(stateSlug);

  if (!region) {
    notFound();
  }

  // Get cities in this region
  const cities = getCitiesForState(region.code);

  // Get business statistics for this region
  const [businessStats] = await db
    .select({
      total: sql<number>`count(*)`,
    })
    .from(businesses)
    .where(eq(businesses.state, region.code));

  const totalBusinesses = Number(businessStats?.total || 0);

  // Get categories with business counts
  const categoriesWithCounts = await db
    .select({
      category: categories,
      count: sql<number>`count(${businesses.id})`,
    })
    .from(categories)
    .leftJoin(
      businesses,
      and(
        eq(businesses.categoryId, categories.id),
        eq(businesses.state, region.code)
      )
    )
    .groupBy(categories.id)
    .orderBy(categories.displayOrder);

  const cityItems = cities.map((city) => ({
    name: `${city.name}, ${region.code}`,
    url: `/states/${region.slug}/${city.slug}`,
  }));

  const faqs = generateWaterDamageFAQs(undefined, region.name);

  return (
    <>
      <JsonLd
        data={[
          generatePlaceSchema(region.name, "State", `Water damage restoration services in ${region.name}`),
          generateItemListSchema(cityItems, `Cities in ${region.name} with Water Damage Services`),
        ]}
        id="region-schema"
      />

      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Badge className="mb-4">
                <MapPin className="w-4 h-4 mr-1" />
                {region.code}
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Water Damage Restoration in {region.name}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8">
                Find trusted water damage restoration professionals, emergency flood cleanup,
                mold remediation, and insurance claim assistance throughout {region.name}.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card p-4 rounded-lg border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Building2 className="w-4 h-4" />
                    Businesses
                  </div>
                  <div className="text-2xl font-bold">{totalBusinesses}</div>
                </div>
                <div className="bg-card p-4 rounded-lg border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <MapPin className="w-4 h-4" />
                    Cities
                  </div>
                  <div className="text-2xl font-bold">{cities.length}</div>
                </div>
                <div className="bg-card p-4 rounded-lg border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Droplets className="w-4 h-4" />
                    Services
                  </div>
                  <div className="text-2xl font-bold">5</div>
                </div>
                <div className="bg-card p-4 rounded-lg border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Phone className="w-4 h-4" />
                    24/7 Service
                  </div>
                  <div className="text-2xl font-bold">Yes</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">Water Damage Services in {region.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoriesWithCounts.map(({ category, count }) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}?state=${region.code}`}
                >
                  <Card className="h-full hover:shadow-lg transition-all hover:border-primary/50">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>{category.name}</span>
                        <Badge>{Number(count)}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {category.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Cities Section */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">Cities in {region.name}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {cities.map((city) => (
                <Link
                  key={city.slug}
                  href={`/states/${region.slug}/${city.slug}`}
                  className="p-4 bg-card border rounded-lg hover:shadow-md transition-all hover:border-primary/50"
                >
                  <div className="font-semibold">{city.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {(city.population / 1000).toFixed(0)}K residents
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <FAQSection
          faqs={faqs}
          title={`Water Damage Services in ${region.name} - FAQ`}
          description={`Common questions about water damage restoration in ${region.name}`}
        />
      </div>
    </>
  );
}
