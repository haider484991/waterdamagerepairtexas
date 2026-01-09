"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ChevronRight,
  Filter,
  MapPin,
  Grid3X3,
  List,
  SlidersHorizontal,
  Star,
  X,
  Building2,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { BusinessCard } from "@/components/business";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Business {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string;
  city: string;
  state: string;
  zip: string | null;
  neighborhood: string | null;
  priceLevel: number | null;
  ratingAvg: string | null;
  reviewCount: number | null;
  photos: string[];
  isFeatured: boolean | null;
  category: { name: string; slug: string } | null;
}

interface Neighborhood {
  name: string;
  slug: string;
  businessCount: number;
  avgRating: string;
  totalReviews: number;
}

interface TopCategory {
  id: string;
  name: string;
  slug: string;
  count: number;
}

const neighborhoodDescriptions: Record<string, string> = {
  "Legacy West": "Upscale shopping, dining, and entertainment district with luxury retailers and fine dining. Home to premium shopping centers and acclaimed restaurants.",
  "Downtown Plano": "Historic downtown area featuring local shops, restaurants, and cultural attractions. The heart of Plano's community with charming streets and local businesses.",
  "West Plano": "Modern residential and commercial area with diverse businesses and services. A growing community with excellent amenities and convenient access.",
  "East Plano": "Established community with a mix of traditional and contemporary businesses. Known for its friendly atmosphere and local charm.",
  "Plano": "Central Plano area with a wide variety of businesses and services. The bustling center of commerce and community activity.",
};

const sortOptions = [
  { value: "relevance", label: "Most Relevant" },
  { value: "rating", label: "Highest Rated" },
  { value: "reviews", label: "Most Reviewed" },
  { value: "name", label: "Name (A-Z)" },
  { value: "newest", label: "Newest First" },
];

const ratingFilters = [
  { value: "0", label: "Any Rating" },
  { value: "3", label: "3+ Stars" },
  { value: "3.5", label: "3.5+ Stars" },
  { value: "4", label: "4+ Stars" },
  { value: "4.5", label: "4.5+ Stars" },
];

const priceFilters = [
  { value: "0", label: "Any Price" },
  { value: "1", label: "$ (Budget)" },
  { value: "2", label: "$$ (Moderate)" },
  { value: "3", label: "$$$ (Upscale)" },
  { value: "4", label: "$$$$ (Premium)" },
];

function NeighborhoodPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isLoading, setIsLoading] = useState(true);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [neighborhood, setNeighborhood] = useState<Neighborhood | null>(null);
  const [topCategories, setTopCategories] = useState<TopCategory[]>([]);

  // Filter states
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "relevance");
  const [categorySlug, setCategorySlug] = useState(searchParams.get("category") || "all");
  const [minRating, setMinRating] = useState(searchParams.get("rating") || "0");
  const [priceLevel, setPriceLevel] = useState(searchParams.get("price") || "0");

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (categorySlug && categorySlug !== "all") params.set("category", categorySlug);
      if (minRating !== "0") params.set("rating", minRating);
      if (priceLevel !== "0") params.set("price", priceLevel);
      if (sortBy !== "relevance") params.set("sort", sortBy);

      const response = await fetch(`/api/neighborhoods/${slug}?${params.toString()}`);
      const data = await response.json();

      if (data.neighborhood) {
        setNeighborhood(data.neighborhood);
      }
      setBusinesses(data.businesses || []);
      setTopCategories(data.topCategories || []);
    } catch (error) {
      console.error("Error fetching neighborhood data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [slug, categorySlug, minRating, priceLevel, sortBy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "0" && value !== "all" && value !== "relevance") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/neighborhoods/${slug}?${params.toString()}`, { scroll: false });
  };

  const clearFilters = () => {
    setSortBy("relevance");
    setCategorySlug("all");
    setMinRating("0");
    setPriceLevel("0");
    router.push(`/neighborhoods/${slug}`, { scroll: false });
  };

  const hasActiveFilters =
    sortBy !== "relevance" ||
    categorySlug !== "all" ||
    minRating !== "0" ||
    priceLevel !== "0";

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Category Filter */}
      {topCategories.length > 0 && (
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Category
          </label>
          <Select
            value={categorySlug}
            onValueChange={(value) => {
              setCategorySlug(value);
              updateFilters("category", value);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {topCategories.map((cat) => (
                <SelectItem key={cat.slug} value={cat.slug}>
                  {cat.name} ({cat.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Rating Filter */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">
          Minimum Rating
        </label>
        <Select
          value={minRating}
          onValueChange={(value) => {
            setMinRating(value);
            updateFilters("rating", value);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Any rating" />
          </SelectTrigger>
          <SelectContent>
            {ratingFilters.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                <div className="flex items-center gap-2">
                  {r.value !== "0" && <Star className="w-4 h-4 text-primary fill-primary" />}
                  {r.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price Filter */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">
          Price Level
        </label>
        <Select
          value={priceLevel}
          onValueChange={(value) => {
            setPriceLevel(value);
            updateFilters("price", value);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Any price" />
          </SelectTrigger>
          <SelectContent>
            {priceFilters.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <Button variant="outline" onClick={clearFilters} className="w-full">
          <X className="w-4 h-4 mr-2" />
          Clear All Filters
        </Button>
      )}
    </div>
  );

  const neighborhoodName = neighborhood?.name || slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const neighborhoodDescription = neighborhoodDescriptions[neighborhoodName] || `Explore businesses in ${neighborhoodName}, Plano, TX`;

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="border-b border-border/50 bg-card/30">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              Home
            </Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <Link href="/neighborhoods" className="text-muted-foreground hover:text-foreground">
              Neighborhoods
            </Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground font-medium">{neighborhoodName}</span>
          </nav>
        </div>
      </div>

      {/* Header */}
      <div className="border-b border-border/50 bg-card/30">
        <div className="container mx-auto px-4 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Badge variant="secondary" className="mb-3">
              <MapPin className="w-3 h-3 mr-1" />
              Neighborhood
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              {neighborhoodName}
            </h1>
            <p className="text-muted-foreground max-w-2xl mb-4">{neighborhoodDescription}</p>
            {neighborhood && (
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground font-medium">{neighborhood.businessCount}</span>
                  <span className="text-muted-foreground">businesses</span>
                </div>
                {parseFloat(neighborhood.avgRating) > 0 && (
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 fill-blue-500 text-blue-500" />
                    <span className="text-foreground font-medium">{neighborhood.avgRating}</span>
                    {neighborhood.totalReviews > 0 && (
                      <span className="text-muted-foreground">
                        ({neighborhood.totalReviews} reviews)
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Top Categories */}
      {topCategories.length > 0 && (
        <div className="border-b border-border/50 bg-card/30">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Popular categories:</span>
              {topCategories.slice(0, 6).map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/neighborhoods/${slug}?category=${cat.slug}`}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary hover:bg-secondary/80 text-sm transition-colors"
                >
                  <Tag className="w-3 h-3" />
                  {cat.name} ({cat.count})
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 glass-card rounded-xl p-5">
              <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </h2>
              <FilterContent />
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {businesses.length} businesses found
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Mobile Filter Button */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden">
                      <Filter className="w-4 h-4 mr-2" />
                      Filters
                      {hasActiveFilters && (
                        <Badge className="ml-2 bg-primary text-primary-foreground">Active</Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterContent />
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Sort Dropdown */}
                <Select
                  value={sortBy}
                  onValueChange={(value) => {
                    setSortBy(value);
                    updateFilters("sort", value);
                  }}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* View Mode Toggle */}
                <div className="hidden sm:flex items-center border border-border rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "p-1.5 rounded transition-colors",
                      viewMode === "grid"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "p-1.5 rounded transition-colors",
                      viewMode === "list"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {categorySlug !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    <Tag className="w-3 h-3" />
                    {topCategories.find((c) => c.slug === categorySlug)?.name || categorySlug}
                    <button onClick={() => { setCategorySlug("all"); updateFilters("category", ""); }}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {minRating !== "0" && (
                  <Badge variant="secondary" className="gap-1">
                    <Star className="w-3 h-3" />
                    {minRating}+ stars
                    <button onClick={() => { setMinRating("0"); updateFilters("rating", ""); }}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {priceLevel !== "0" && (
                  <Badge variant="secondary" className="gap-1">
                    {"$".repeat(parseInt(priceLevel))}
                    <button onClick={() => { setPriceLevel("0"); updateFilters("price", ""); }}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}

            {/* Business Grid/List */}
            {isLoading ? (
              <div className={cn(
                "grid gap-6",
                viewMode === "grid" ? "md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
              )}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="rounded-xl overflow-hidden">
                    <Skeleton className="h-44 w-full" />
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : businesses.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn(
                  "grid gap-6",
                  viewMode === "grid" ? "md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
                )}
              >
                {businesses.map((business, index) => (
                  <motion.div
                    key={business.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <BusinessCard
                      business={business as any}
                      variant={viewMode === "list" ? "compact" : "default"}
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No businesses found</h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your filters to see more results.
                </p>
                <Button onClick={clearFilters}>Clear All Filters</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NeighborhoodPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen py-8">
          <div className="container mx-auto px-4">
            <Skeleton className="h-8 w-48 mb-8" />
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <NeighborhoodPageContent />
    </Suspense>
  );
}
