import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getStateBySlug } from "@/lib/location-data";
import {
  getBusinessesByCity,
  getCityNameFromSlug,
  getCitiesWithBusinessesForState,
  getStateBySlugData,
} from "@/lib/local-data";
import { BusinessCard } from "@/components/business";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  generatePlaceSchema,
  generateLocalBusinessSchema,
  generateBreadcrumbSchema,
} from "@/lib/seo/schema-markup";
import { FAQSection, generateWaterDamageFAQs } from "@/components/seo/FAQSection";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Clock, Building2, ChevronRight, Phone } from "lucide-react";
import { getSiteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();

// City pages need enough real data to stand on their own in search;
// thinner ones stay reachable but noindexed until they fill in.
const INDEX_MIN_BUSINESSES = 3;

export async function generateMetadata({ params }: { params: Promise<{ state: string; city: string }> }): Promise<Metadata> {
  const { state: stateSlug, city: citySlug } = await params;
  const region = getStateBySlug(stateSlug) ?? getStateBySlugData(stateSlug);
  const cityName = region ? getCityNameFromSlug(region.code, citySlug) : null;

  if (!region || !cityName) {
    return { title: "City Not Found" };
  }

  const businessCount = getBusinessesByCity(cityName, region.code).length;
  const canonicalUrl = `${SITE_URL}/states/${region.slug}/${citySlug}`;

  return {
    title: `Water Damage Restoration in ${cityName}, ${region.code} – Emergency Services`,
    description: `Compare ${businessCount} water damage restoration ${businessCount === 1 ? "company" : "companies"} in ${cityName}, ${region.name}: ratings, reviews, 24/7 availability. Emergency flood cleanup, mold remediation & insurance help.`,
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
    ...(businessCount < INDEX_MIN_BUSINESSES
      ? { robots: { index: false, follow: true } }
      : {}),
    openGraph: {
      title: `Water Damage Restoration in ${cityName}, ${region.code}`,
      description: `Compare water damage restoration, flood cleanup, mold remediation pros in ${cityName}, ${region.name}. 24/7 emergency response.`,
      url: canonicalUrl,
      type: "website",
    },
    other: {
      "llms-txt": `/api/llms/state/${stateSlug}/${citySlug}`,
    },
  };
}

function is24x7(hours: Record<string, string> | null | undefined): boolean {
  if (!hours) return false;
  return Object.values(hours).some((v) => /24 hours/i.test(String(v)));
}

export default async function CityPage({ params }: { params: Promise<{ state: string; city: string }> }) {
  const { state: stateSlug, city: citySlug } = await params;
  const region = getStateBySlug(stateSlug) ?? getStateBySlugData(stateSlug);
  const cityName = region ? getCityNameFromSlug(region.code, citySlug) : null;

  if (!region || !cityName) {
    notFound();
  }

  const enrichedBusinesses = getBusinessesByCity(cityName, region.code);

  // Avoid soft 404 if city has no businesses
  if (enrichedBusinesses.length === 0) {
    notFound();
  }

  // --- Per-city aggregates (unique, data-driven content) ---
  const rated = enrichedBusinesses.filter((b) => b.reviewCount > 0);
  const totalReviews = rated.reduce((sum, b) => sum + b.reviewCount, 0);
  const avgRating =
    rated.length > 0
      ? (
          rated.reduce((sum, b) => sum + parseFloat(b.ratingAvg || "0"), 0) /
          rated.length
        ).toFixed(1)
      : null;
  const alwaysOpenCount = enrichedBusinesses.filter((b) =>
    is24x7(b.hours as Record<string, string> | null)
  ).length;

  const topRated = [...rated]
    .sort(
      (a, b) =>
        parseFloat(b.ratingAvg) - parseFloat(a.ratingAvg) ||
        b.reviewCount - a.reviewCount
    )
    .slice(0, 5);

  const nearbyCities = getCitiesWithBusinessesForState(region.code)
    .filter((c) => c.slug !== citySlug)
    .slice(0, 8);

  const canonicalUrl = `${SITE_URL}/states/${region.slug}/${citySlug}`;

  // Data-driven FAQs first, then the standard set
  const cityFaqs = [
    {
      question: `How many water damage restoration companies serve ${cityName}, ${region.code}?`,
      answer: `Our directory currently lists ${enrichedBusinesses.length} water damage restoration ${enrichedBusinesses.length === 1 ? "company" : "companies"} serving ${cityName}, ${region.name}${topRated[0] ? `, with ${topRated[0].name} as the highest rated (${parseFloat(topRated[0].ratingAvg).toFixed(1)} stars from ${topRated[0].reviewCount} reviews)` : ""}. ${alwaysOpenCount > 0 ? `${alwaysOpenCount} of them ${alwaysOpenCount === 1 ? "offers" : "offer"} 24/7 emergency response.` : ""}`,
    },
    {
      question: `How much does water damage restoration cost in ${cityName}?`,
      answer: `Costs in ${cityName} depend on the water class and affected area. Nationally, minor cleanup (Class 1) runs about $450–$1,500, moderate damage with drying and repairs $1,500–$5,000, and major or structural damage $5,000–$15,000+. Homeowners insurance typically covers sudden events like burst pipes but not gradual leaks or outside flooding — always request an itemized estimate and ask about direct insurance billing.`,
    },
  ];
  const faqs = [...cityFaqs, ...generateWaterDamageFAQs(cityName, region.name)];

  const businessSchemas = enrichedBusinesses.slice(0, 10).map((business) =>
    generateLocalBusinessSchema(business)
  );

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "States", url: `${SITE_URL}/states` },
    { name: region.name, url: `${SITE_URL}/states/${region.slug}` },
    { name: cityName, url: canonicalUrl },
  ]);

  return (
    <>
      <JsonLd
        data={[
          generatePlaceSchema(cityName, "City", `Water damage restoration in ${cityName}, ${region.name}`, region.code),
          breadcrumbSchema,
          ...businessSchemas,
        ]}
        id="city-schema"
      />

      <div className="min-h-screen">
        {/* Hero */}
        <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              {/* Breadcrumbs */}
              <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-1 text-sm text-muted-foreground mb-6">
                <Link href="/" className="hover:text-primary">Home</Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <Link href="/states" className="hover:text-primary">States</Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <Link href={`/states/${region.slug}`} className="hover:text-primary">{region.name}</Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-foreground">{cityName}</span>
              </nav>

              <Badge className="mb-4">
                <MapPin className="w-4 h-4 mr-1" />
                {cityName}, {region.code}
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Water Damage Restoration in {cityName}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8">
                Compare {enrichedBusinesses.length} water damage restoration {enrichedBusinesses.length === 1 ? 'company' : 'companies'} in {cityName}, {region.name}.
                24/7 emergency flood cleanup, mold remediation, and insurance claim assistance.
              </p>

              {/* City stats — computed from real listing data */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card p-4 rounded-lg border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Building2 className="w-4 h-4" />
                    Companies
                  </div>
                  <div className="text-2xl font-bold">{enrichedBusinesses.length}</div>
                </div>
                <div className="bg-card p-4 rounded-lg border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Star className="w-4 h-4" />
                    Avg. Rating
                  </div>
                  <div className="text-2xl font-bold">{avgRating ?? "—"}</div>
                </div>
                <div className="bg-card p-4 rounded-lg border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Star className="w-4 h-4" />
                    Reviews
                  </div>
                  <div className="text-2xl font-bold">{totalReviews.toLocaleString()}</div>
                </div>
                <div className="bg-card p-4 rounded-lg border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Clock className="w-4 h-4" />
                    Open 24/7
                  </div>
                  <div className="text-2xl font-bold">{alwaysOpenCount}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Top rated — quick decision shortlist */}
        {topRated.length >= 3 && (
          <section className="py-12">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold mb-2">
                Top Rated in {cityName}
              </h2>
              <p className="text-muted-foreground mb-6">
                Highest-rated water damage restoration companies in {cityName}, ranked by Google rating and review count.
              </p>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 text-left">
                      <th className="p-3 font-semibold">#</th>
                      <th className="p-3 font-semibold">Company</th>
                      <th className="p-3 font-semibold">Rating</th>
                      <th className="p-3 font-semibold">Reviews</th>
                      <th className="p-3 font-semibold hidden md:table-cell">24/7</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topRated.map((b, i) => (
                      <tr key={b.id} className="border-t hover:bg-muted/30">
                        <td className="p-3 text-muted-foreground">{i + 1}</td>
                        <td className="p-3">
                          <Link href={`/business/${b.slug}`} className="font-medium text-primary hover:underline">
                            {b.name}
                          </Link>
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                            {parseFloat(b.ratingAvg).toFixed(1)}
                          </span>
                        </td>
                        <td className="p-3">{b.reviewCount.toLocaleString()}</td>
                        <td className="p-3 hidden md:table-cell">
                          {is24x7(b.hours as Record<string, string> | null) ? "Yes" : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

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

        {/* Cost guide */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold mb-2">
              Water Damage Restoration Costs in {cityName}
            </h2>
            <p className="text-muted-foreground mb-6">
              {enrichedBusinesses.length} {enrichedBusinesses.length === 1 ? "company serves" : "companies serve"} {cityName} — always compare at least three quotes. National cost ranges below give you a baseline before you call.
            </p>
            <div className="overflow-x-auto rounded-lg border bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-left">
                    <th className="p-3 font-semibold">Damage level</th>
                    <th className="p-3 font-semibold">Typical scope</th>
                    <th className="p-3 font-semibold">Typical cost</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="p-3 font-medium">Minor (Class 1)</td>
                    <td className="p-3 text-muted-foreground">Small area, clean water, minimal absorption</td>
                    <td className="p-3">$450 – $1,500</td>
                  </tr>
                  <tr className="border-t">
                    <td className="p-3 font-medium">Moderate (Class 2–3)</td>
                    <td className="p-3 text-muted-foreground">Full room, carpet/walls affected, structural drying</td>
                    <td className="p-3">$1,500 – $5,000</td>
                  </tr>
                  <tr className="border-t">
                    <td className="p-3 font-medium">Major (Class 4 / gray-black water)</td>
                    <td className="p-3 text-muted-foreground">Structural damage, sewage or long-standing water, mold risk</td>
                    <td className="p-3">$5,000 – $15,000+</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              <Phone className="w-3.5 h-3.5 inline mr-1" />
              Homeowners insurance usually covers sudden events (burst pipes, appliance failures) but not gradual leaks or external flooding. Ask each company about free inspections and direct insurance billing.
            </p>
          </div>
        </section>

        {/* Nearby cities — helps users near city borders */}
        {nearbyCities.length > 0 && (
          <section className="py-12">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold mb-6">
                Water Damage Restoration Near {cityName}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {nearbyCities.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/states/${region.slug}/${c.slug}`}
                    className="p-4 bg-card border rounded-lg hover:shadow-md transition-all hover:border-primary/50"
                  >
                    <div className="font-semibold">{c.name}, {region.code}</div>
                    <div className="text-sm text-muted-foreground">
                      {c.count} {c.count === 1 ? "company" : "companies"}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

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
