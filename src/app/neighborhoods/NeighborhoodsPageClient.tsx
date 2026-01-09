"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { MapPin, Star, Building2, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface Neighborhood {
  name: string;
  slug: string;
  businessCount: number;
  avgRating: string;
  totalReviews: number;
}

interface NeighborhoodsPageClientProps {
  neighborhoods: Neighborhood[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const neighborhoodDescriptions: Record<string, string> = {
  "Legacy West": "Upscale shopping, dining, and entertainment district with luxury retailers and fine dining.",
  "Downtown Plano": "Historic downtown area featuring local shops, restaurants, and cultural attractions.",
  "West Plano": "Modern residential and commercial area with diverse businesses and services.",
  "East Plano": "Established community with a mix of traditional and contemporary businesses.",
  "Plano": "Central Plano area with a wide variety of businesses and services.",
};

export function NeighborhoodsPageClient({ neighborhoods }: NeighborhoodsPageClientProps) {
  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Badge variant="secondary" className="mb-4">
            Explore Plano
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Discover Plano Neighborhoods
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore businesses across Plano's vibrant neighborhoods. Each area offers unique
            shopping, dining, and service experiences.
          </p>
        </motion.div>

        {/* Neighborhoods Grid */}
        {neighborhoods.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {neighborhoods.map((neighborhood) => (
              <motion.div key={neighborhood.slug} variants={itemVariants}>
                <Link href={`/neighborhoods/${neighborhood.slug}`}>
                  <Card className="group h-full hover:shadow-lg transition-all border-border/50 hover:border-primary/30">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                          <MapPin className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                              {neighborhood.name}
                            </h3>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                          </div>
                          {neighborhoodDescriptions[neighborhood.name] && (
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                              {neighborhoodDescriptions[neighborhood.name]}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                              <span className="text-foreground font-medium">
                                {neighborhood.businessCount}
                              </span>
                              <span className="text-muted-foreground">businesses</span>
                            </div>
                            {parseFloat(neighborhood.avgRating) > 0 && (
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-blue-500 text-blue-500" />
                                <span className="text-foreground font-medium">
                                  {neighborhood.avgRating}
                                </span>
                                {neighborhood.totalReviews > 0 && (
                                  <span className="text-muted-foreground">
                                    ({neighborhood.totalReviews})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
              <MapPin className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No neighborhoods found</h3>
            <p className="text-muted-foreground">
              Neighborhoods will appear here once businesses are added to the directory.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
