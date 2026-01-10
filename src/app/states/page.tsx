import { Metadata } from "next";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Building2, Users } from "lucide-react";
import { getAllStates } from "@/lib/location-data";
import { JsonLd } from "@/components/seo/JsonLd";
import { generateItemListSchema } from "@/lib/seo/schema-markup";

export const metadata: Metadata = {
  title: "Water Damage Restoration by State - USA",
  description: "Browse water damage restoration, flood cleanup, and mold remediation services by state across the USA. Find emergency restoration services in California, Texas, Florida, New York, and more.",
  keywords: ["water damage USA", "water damage by state", "restoration services", "flood cleanup"],
};

export default function StatesPage() {
  const regions = getAllStates();

  const regionItems = regions.map((region) => ({
    name: region.name,
    url: `/states/${region.slug}`,
  }));

  return (
    <>
      <JsonLd
        data={generateItemListSchema(regionItems, "US States with Water Damage Services")}
        id="regions-list-schema"
      />

      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="max-w-3xl mx-auto text-center mb-12">
            <Badge className="mb-4">
              <MapPin className="w-4 h-4 mr-1" />
              Browse by State
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Water Damage Services Across the USA
            </h1>
            <p className="text-lg text-muted-foreground">
              Find water damage restoration, flood cleanup, mold remediation, and emergency
              services across all US states. Connect with local certified professionals.
            </p>
          </div>

          {/* Regions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {regions.map((region) => (
              <Link key={region.code} href={`/states/${region.slug}`}>
                <Card className="h-full hover:shadow-lg transition-all hover:border-primary/50">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="bg-primary/10 p-3 rounded-lg">
                        <MapPin className="w-6 h-6 text-primary" />
                      </div>
                      <Badge variant="outline">{region.code}</Badge>
                    </div>
                    <CardTitle className="text-xl">{region.name}</CardTitle>
                    <CardDescription>
                      United States
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{(region.population / 1000000).toFixed(1)}M residents</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        <span>Restoration services →</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
