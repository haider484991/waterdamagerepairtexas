import { Metadata } from "next";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Building2, Users } from "lucide-react";
import { getAllStates } from "@/lib/location-data";
import { JsonLd } from "@/components/seo/JsonLd";
import { generateItemListSchema } from "@/lib/seo/schema-markup";

export const metadata: Metadata = {
  title: "Pickleball by State – US Pickleball Directory",
  description: "Browse pickleball courts, clubs, equipment stores, coaches, and tournaments by state. Find everything pickleball in all 50 US states.",
  keywords: ["pickleball by state", "pickleball USA", "pickleball courts by state", "state pickleball directory"],
};

export default function StatesPage() {
  const states = getAllStates();

  const stateItems = states.map((state) => ({
    name: state.name,
    url: `/states/${state.slug}`,
  }));

  return (
    <>
      <JsonLd 
        data={generateItemListSchema(stateItems, "US States with Pickleball")} 
        id="states-list-schema" 
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
              Pickleball Across America
            </h1>
            <p className="text-lg text-muted-foreground">
              Explore pickleball courts, clubs, leagues, equipment stores, coaches, and tournaments 
              in the top 25 most populated US states. Find your local pickleball community.
            </p>
          </div>

          {/* States Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {states.map((state) => (
              <Link key={state.code} href={`/states/${state.slug}`}>
                <Card className="h-full hover:shadow-lg transition-all hover:border-primary/50">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="bg-primary/10 p-3 rounded-lg">
                        <MapPin className="w-6 h-6 text-primary" />
                      </div>
                      <Badge variant="outline">{state.code}</Badge>
                    </div>
                    <CardTitle className="text-xl">{state.name}</CardTitle>
                    <CardDescription>
                      Rank #{state.rank} by population
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{(state.population / 1000000).toFixed(1)}M residents</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        <span>Pickleball facilities →</span>
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

