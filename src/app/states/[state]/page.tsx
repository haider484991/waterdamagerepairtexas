import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Building2, TrendingUp } from "lucide-react";
import { getStateBySlug, getCitiesForState } from "@/lib/location-data";
import { db, businesses, categories } from "@/lib/db";
import { eq, and, sql } from "drizzle-orm";
import { JsonLd } from "@/components/seo/JsonLd";
import { generatePlaceSchema, generateItemListSchema } from "@/lib/seo/schema-markup";
import { FAQSection, generatePickleballFAQs } from "@/components/seo/FAQSection";

export async function generateMetadata({ params }: { params: Promise<{ state: string }> }): Promise<Metadata> {
  const { state: stateSlug } = await params;
  const state = getStateBySlug(stateSlug);
  
  if (!state) {
    return { title: "State Not Found" };
  }

  return {
    title: `Pickleball in ${state.name} – Courts, Clubs & Equipment | US Pickleball Directory`,
    description: `Find pickleball courts, clubs, leagues, equipment stores, coaches, and tournaments in ${state.name}. Comprehensive directory of pickleball facilities across ${state.code}.`,
    keywords: [
      `pickleball ${state.name}`,
      `${state.name} pickleball courts`,
      `${state.name} pickleball clubs`,
      `pickleball ${state.code}`,
      `where to play pickleball ${state.name}`,
    ],
  };
}

export default async function StatePage({ params }: { params: Promise<{ state: string }> }) {
  const { state: stateSlug } = await params;
  const state = getStateBySlug(stateSlug);

  if (!state) {
    notFound();
  }

  // Get cities in this state
  const cities = getCitiesForState(state.code);

  // Get business statistics for this state
  const [businessStats] = await db
    .select({
      total: sql<number>`count(*)`,
    })
    .from(businesses)
    .where(eq(businesses.state, state.code));

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
        eq(businesses.state, state.code)
      )
    )
    .groupBy(categories.id)
    .orderBy(categories.displayOrder);

  const cityItems = cities.map((city) => ({
    name: `${city.name}, ${state.code}`,
    url: `/states/${state.slug}/${city.slug}`,
  }));

  const faqs = generatePickleballFAQs(undefined, state.name);

  return (
    <>
      <JsonLd 
        data={[
          generatePlaceSchema(state.name, "State", `Find pickleball courts, clubs, and facilities in ${state.name}`),
          generateItemListSchema(cityItems, `Cities in ${state.name} with Pickleball`),
        ]} 
        id="state-schema" 
      />

      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Badge className="mb-4">
                <MapPin className="w-4 h-4 mr-1" />
                {state.code}
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Pickleball in {state.name}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8">
                Discover pickleball courts, clubs, leagues, equipment stores, coaches, and tournaments 
                throughout {state.name}. Join the fastest growing sport in America!
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
                    <Users className="w-4 h-4" />
                    Population
                  </div>
                  <div className="text-2xl font-bold">{(state.population / 1000000).toFixed(1)}M</div>
                </div>
                <div className="bg-card p-4 rounded-lg border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <TrendingUp className="w-4 h-4" />
                    Rank
                  </div>
                  <div className="text-2xl font-bold">#{state.rank}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">Pickleball Categories in {state.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoriesWithCounts.map(({ category, count }) => (
                <Link 
                  key={category.id} 
                  href={`/categories/${category.slug}?state=${state.code}`}
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
            <h2 className="text-3xl font-bold mb-8">Cities in {state.name}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {cities.map((city) => (
                <Link 
                  key={city.slug} 
                  href={`/states/${state.slug}/${city.slug}`}
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
          title={`Pickleball in ${state.name} - FAQ`}
          description={`Common questions about playing pickleball in ${state.name}`}
        />
      </div>
    </>
  );
}

