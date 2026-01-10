"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  ArrowRight,
  Star,
  Users,
  Building2,
  TrendingUp,
  Droplets,
  ShieldCheck,
  Clock,
  Phone,
  Wrench,
  Home,
  Hammer,
  AlertTriangle,
  ThermometerSun,
  Wind,
  Sparkles,
  Building,
  LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchBar } from "@/components/search";
import { StarRating } from "@/components/business";
import type { Category } from "@/lib/db/schema";
import { getImageUrl, type BusinessData } from "@/lib/hybrid-data";

const iconMap: Record<string, LucideIcon> = {
  Droplets,
  ShieldCheck,
  Clock,
  Phone,
  Wrench,
  Home,
  Hammer,
  AlertTriangle,
  ThermometerSun,
  Wind,
  Sparkles,
  Building2,
  Building,
};

interface HomePageClientProps {
  featuredBusinesses: BusinessData[];
  categories: Category[];
  recentBusinesses: BusinessData[];
}

const topRegions = [
  { name: "California", slug: "california", stateCode: "CA", description: "Largest state coverage" },
  { name: "Texas", slug: "texas", stateCode: "TX", description: "24/7 emergency services" },
  { name: "Florida", slug: "florida", stateCode: "FL", description: "Fast response times" },
  { name: "New York", slug: "new-york", stateCode: "NY", description: "Certified professionals" },
];

const stats = [
  { label: "US States", value: "25+", icon: MapPin },
  { label: "Cities", value: "200+", icon: Building2 },
  { label: "Services", value: "5", icon: TrendingUp },
  { label: "24/7 Available", value: "✓", icon: Clock },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function HomePageClient({
  featuredBusinesses,
  categories,
  recentBusinesses,
}: HomePageClientProps) {
  // Use featured businesses if available, otherwise use recent
  const displayBusinesses = featuredBusinesses.length > 0 ? featuredBusinesses : recentBusinesses.slice(0, 4);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 hero-pattern overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <Badge className="mb-6 px-4 py-1.5 text-sm bg-primary/10 text-primary border-primary/20">
              <MapPin className="w-4 h-4 mr-1.5" />
              Nationwide
            </Badge>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Find <span className="text-gradient">Water Damage Repair</span>{" "}
              Services Nationwide
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto">
              Connect with trusted water damage restoration professionals across the USA. Emergency flood cleanup, mold remediation, and 24/7 restoration services. Free directory with ratings, reviews & instant contact.
            </p>

            <div className="max-w-2xl mx-auto mb-8">
              <SearchBar size="large" showSuggestions />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>💧 Water Damage Restoration</span>
              <span>•</span>
              <span>🌊 Flood Cleanup</span>
              <span>•</span>
              <span>🦠 Mold Remediation</span>
              <span>•</span>
              <span>⚡ Emergency Services</span>
              <span>•</span>
              <span>🏠 Storm Damage Repair</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
              <span className="text-sm text-muted-foreground">Popular:</span>
              {["Water Damage Restoration", "Emergency Flood Cleanup", "Mold Removal", "24 Hour Service", "Storm Damage"].map((term) => (
                <Link
                  key={term}
                  href={`/search?q=${encodeURIComponent(term)}`}
                  className="px-3 py-1.5 text-sm bg-secondary/50 hover:bg-secondary rounded-full transition-colors"
                >
                  {term}
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-border/50 bg-card/50">
        <div className="container mx-auto px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat) => (
              <motion.div key={stat.label} variants={itemVariants} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-3">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <Badge className="mb-4 px-3 py-1 text-xs bg-primary/10 text-primary border-primary/20">
              Browse by Service
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Find the Right <span className="text-gradient">Restoration</span> Service
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Whether you need emergency water extraction, mold remediation, or storm damage repair — we connect you with certified professionals
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 md:gap-6"
          >
            {categories.slice(0, 5).map((category, index) => {
              const Icon = iconMap[category.icon || "Building"] || Building;
              const categoryDescriptions: Record<string, string> = {
                "water-damage-restoration": "24/7 water extraction & drying",
                "flood-cleanup": "Emergency flood damage services",
                "mold-remediation": "Professional mold removal & prevention",
                "emergency-services": "Immediate response available",
                "storm-damage": "Wind, hail & storm repair",
              };
              const categoryColors = [
                "from-blue-500/20 to-blue-600/10 border-blue-500/30 hover:border-blue-500/50",
                "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 hover:border-cyan-500/50",
                "from-green-500/20 to-green-600/10 border-green-500/30 hover:border-green-500/50",
                "from-orange-500/20 to-orange-600/10 border-orange-500/30 hover:border-orange-500/50",
                "from-purple-500/20 to-purple-600/10 border-purple-500/30 hover:border-purple-500/50",
              ];
              const iconColors = [
                "bg-blue-500/20 text-blue-500",
                "bg-cyan-500/20 text-cyan-500",
                "bg-green-500/20 text-green-500",
                "bg-orange-500/20 text-orange-500",
                "bg-purple-500/20 text-purple-500",
              ];
              return (
                <motion.div key={category.slug} variants={itemVariants}>
                  <Link href={`/categories/${category.slug}`}>
                    <motion.div
                      whileHover={{ y: -8, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`group relative flex flex-col items-center p-6 md:p-8 rounded-2xl bg-gradient-to-br ${categoryColors[index % 5]} border-2 hover:shadow-xl transition-all duration-300 h-full min-h-[200px]`}
                    >
                      <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl ${iconColors[index % 5]} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-8 h-8 md:w-10 md:h-10" />
                      </div>
                      <h3 className="text-lg md:text-xl font-bold text-foreground text-center mb-2 group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-sm text-muted-foreground text-center">
                        {categoryDescriptions[category.slug] || category.description || "Explore this service"}
                      </p>
                      <div className="mt-4 flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        Find Services <ArrowRight className="w-4 h-4 ml-1" />
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>

          <div className="text-center mt-12">
            <Button asChild size="lg" className="px-8">
              <Link href="/categories">
                Browse All Services
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Businesses Section */}
      <section className="py-16 md:py-24 bg-card/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row md:items-end md:justify-between mb-12"
          >
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {featuredBusinesses.length > 0 ? "Featured Restoration Companies" : "Recent Listings"}
              </h2>
              <p className="text-muted-foreground max-w-2xl">
                {featuredBusinesses.length > 0
                  ? "Discover top-rated water damage restoration companies across the USA"
                  : "Newly added restoration services in the directory"}
              </p>
            </div>
            <Button asChild variant="ghost" className="mt-4 md:mt-0">
              <Link href="/search?featured=true">
                See All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </motion.div>

          {displayBusinesses.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {displayBusinesses.map((business) => (
                <motion.div key={business.id} variants={itemVariants}>
                  <Link href={`/business/${business.slug}`}>
                    <motion.div
                      whileHover={{ y: -4 }}
                      className="group rounded-xl overflow-hidden bg-card border border-border/50 hover:border-primary/30 transition-all"
                    >
                      <div className="relative h-48 bg-secondary">
                        {business.photos && business.photos.length > 0 ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={getImageUrl(business.photos[0])}
                            alt={business.name}
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://placehold.co/400x300/f5f5f4/a3a3a3?text=No+Image";
                            }}
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                            <Building2 className="w-12 h-12" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        {business.isFeatured && (
                          <Badge className="absolute top-3 left-3 bg-primary/90">
                            Featured
                          </Badge>
                        )}
                        <div className="absolute bottom-3 left-3 right-3">
                          <h3 className="text-lg font-semibold text-white mb-1">
                            {business.name}
                          </h3>
                          <div className="flex items-center gap-2 text-white/90 text-sm">
                            <StarRating
                              rating={Number(business.ratingAvg) || 0}
                              size="sm"
                            />
                            <span>{Number(business.ratingAvg)?.toFixed(1) || "0.0"}</span>
                            <span className="text-white/60">
                              ({business.reviewCount || 0} reviews)
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          {business.category && (
                            <Badge variant="secondary" className="text-xs">
                              {business.category.name}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5" />
                          {business.neighborhood || business.city}
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-12 glass-card rounded-xl">
              <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No businesses yet</h3>
              <p className="text-muted-foreground mb-4">
                Sync businesses from Google Places to populate the directory
              </p>
              <Button asChild>
                <Link href="/admin/sync">Sync Businesses</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Top Regions Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Browse by State</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Find water damage restoration services across the United States
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {topRegions.map((region) => (
              <motion.div key={region.slug} variants={itemVariants}>
                <Link href={`/states/${region.slug}`}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    className="group p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {region.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {region.description}
                    </p>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-card/50 to-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Own a Restoration Business?
            </h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Join trusted restoration companies already listed in our directory.
              Claim your listing today and reach more customers nationwide.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/dashboard/claim">Claim Your Business</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                <Link href="/add-business">Add a Business</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
