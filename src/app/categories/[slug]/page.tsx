"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  MapPin,
  Grid3X3,
  List,
  SlidersHorizontal,
  Star,
  X,
  Building2,
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
import { getAllStates, getAllCities, getCitiesForState } from "@/lib/location-data";

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

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  section: string | null;
}

// Pickleball-specific filters based on category
const getCategorySpecificFilters = (categorySlug: string) => {
  switch (categorySlug) {
    case "pickleball-courts-facilities":
      return {
        facilityType: [
          { value: "all", label: "All Types" },
          { value: "indoor", label: "Indoor Courts" },
          { value: "outdoor", label: "Outdoor Courts" },
          { value: "both", label: "Indoor & Outdoor" },
        ],
        courtSurface: [
          { value: "all", label: "Any Surface" },
          { value: "hardcourt", label: "Hardcourt" },
          { value: "cushion", label: "Cushion Court" },
          { value: "grass", label: "Grass" },
          { value: "clay", label: "Clay" },
        ],
        amenities: [
          { value: "equipment-rental", label: "Equipment Rental" },
          { value: "pro-shop", label: "Pro Shop" },
          { value: "lighting", label: "Lighting" },
          { value: "parking", label: "Parking" },
          { value: "locker-rooms", label: "Locker Rooms" },
        ],
      };
    case "pickleball-clubs-leagues":
      return {
        membershipType: [
          { value: "all", label: "All Types" },
          { value: "public", label: "Public Access" },
          { value: "membership", label: "Membership Required" },
          { value: "drop-in", label: "Drop-in Welcome" },
        ],
        skillLevel: [
          { value: "all", label: "All Levels" },
          { value: "beginner", label: "Beginner" },
          { value: "intermediate", label: "Intermediate" },
          { value: "advanced", label: "Advanced" },
          { value: "competitive", label: "Competitive" },
        ],
        leagueType: [
          { value: "all", label: "All Leagues" },
          { value: "social", label: "Social Leagues" },
          { value: "competitive", label: "Competitive Leagues" },
          { value: "tournament", label: "Tournament Prep" },
        ],
      };
    case "pickleball-equipment-stores":
      return {
        productType: [
          { value: "all", label: "All Products" },
          { value: "paddles", label: "Paddles" },
          { value: "balls", label: "Balls" },
          { value: "shoes", label: "Shoes" },
          { value: "apparel", label: "Apparel" },
          { value: "accessories", label: "Accessories" },
        ],
        priceRange: [
          { value: "all", label: "Any Price" },
          { value: "budget", label: "Budget ($)" },
          { value: "moderate", label: "Moderate ($$)" },
          { value: "premium", label: "Premium ($$$)" },
        ],
      };
    case "pickleball-coaches-instructors":
      return {
        experienceLevel: [
          { value: "all", label: "All Levels" },
          { value: "beginner", label: "Beginner Coach" },
          { value: "intermediate", label: "Intermediate Coach" },
          { value: "advanced", label: "Advanced Coach" },
          { value: "professional", label: "Professional" },
        ],
        certification: [
          { value: "all", label: "Any Certification" },
          { value: "certified", label: "Certified" },
          { value: "usapa", label: "USAPA Certified" },
          { value: "ipf", label: "IPF Certified" },
        ],
        lessonType: [
          { value: "all", label: "All Types" },
          { value: "private", label: "Private Lessons" },
          { value: "group", label: "Group Lessons" },
          { value: "clinic", label: "Clinics" },
          { value: "workshop", label: "Workshops" },
        ],
      };
    case "pickleball-tournaments-events":
      return {
        tournamentType: [
          { value: "all", label: "All Types" },
          { value: "local", label: "Local Tournaments" },
          { value: "regional", label: "Regional" },
          { value: "national", label: "National" },
          { value: "charity", label: "Charity Events" },
        ],
        skillLevel: [
          { value: "all", label: "All Levels" },
          { value: "beginner", label: "Beginner" },
          { value: "intermediate", label: "Intermediate" },
          { value: "advanced", label: "Advanced" },
          { value: "open", label: "Open Division" },
        ],
        entryFee: [
          { value: "all", label: "Any Fee" },
          { value: "free", label: "Free" },
          { value: "low", label: "Low ($0-$50)" },
          { value: "medium", label: "Medium ($50-$150)" },
          { value: "high", label: "High ($150+)" },
        ],
      };
    default:
      return null;
  }
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

function CategoryPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isLoading, setIsLoading] = useState(true);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get("page") || "1"));
  const [totalPages, setTotalPages] = useState(1);
  const [totalBusinesses, setTotalBusinesses] = useState(0);

  // Filter states
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "relevance");
  const [selectedState, setSelectedState] = useState(searchParams.get("state") || "all");
  const [selectedCity, setSelectedCity] = useState(searchParams.get("city") || "all");
  const [minRating, setMinRating] = useState(searchParams.get("rating") || "0");
  const [priceLevel, setPriceLevel] = useState(searchParams.get("price") || "0");
  const [dataSource, setDataSource] = useState<"database" | "google" | "hybrid" | null>(null);
  const [autoSynced, setAutoSynced] = useState(false);
  
  // Category-specific filter states
  const categoryFilters = getCategorySpecificFilters(slug);
  const [facilityType, setFacilityType] = useState(searchParams.get("facilityType") || "all");
  const [courtSurface, setCourtSurface] = useState(searchParams.get("courtSurface") || "all");
  const [membershipType, setMembershipType] = useState(searchParams.get("membershipType") || "all");
  const [skillLevel, setSkillLevel] = useState(searchParams.get("skillLevel") || "all");
  
  // Get states and cities for filters
  const allStates = getAllStates();
  const availableCities = selectedState !== "all" 
    ? getCitiesForState(selectedState) 
    : [];

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedState && selectedState !== "all") params.set("state", selectedState);
      if (selectedCity && selectedCity !== "all") params.set("city", selectedCity);
      if (minRating !== "0") params.set("rating", minRating);
      if (priceLevel !== "0") params.set("price", priceLevel);
      if (sortBy !== "relevance") params.set("sort", sortBy);
      
      // Add category-specific filters
      if (facilityType !== "all") params.set("facilityType", facilityType);
      if (courtSurface !== "all") params.set("courtSurface", courtSurface);
      if (membershipType !== "all") params.set("membershipType", membershipType);
      if (skillLevel !== "all") params.set("skillLevel", skillLevel);

      // Pagination: 100 businesses per page
      params.set("page", currentPage.toString());
      params.set("limit", "100");
      
      const response = await fetch(`/api/categories/${slug}?${params.toString()}`);
      const data = await response.json();

      if (data.category) {
        setCategory(data.category);
      }
      setBusinesses(data.businesses || []);
      setDataSource(data.dataSource || null);
      setAutoSynced(data.autoSynced || false);
      
      // Update pagination info
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages || 1);
        setTotalBusinesses(data.pagination.total || 0);
      }
    } catch (error) {
      console.error("Error fetching category data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [slug, selectedState, selectedCity, minRating, priceLevel, sortBy, facilityType, courtSurface, membershipType, skillLevel, currentPage]);

  useEffect(() => {
    // Update current page from URL params
    const pageParam = searchParams.get("page");
    if (pageParam) {
      const page = parseInt(pageParam);
      if (page !== currentPage) {
        setCurrentPage(page);
      }
    } else {
      setCurrentPage(1);
    }
  }, [searchParams]);

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
    // Reset to page 1 when filters change
    params.set("page", "1");
    setCurrentPage(1);
    router.push(`/categories/${slug}?${params.toString()}`, { scroll: false });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/categories/${slug}?${params.toString()}`, { scroll: false });
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearFilters = () => {
    setSortBy("relevance");
    setSelectedState("all");
    setSelectedCity("all");
    setMinRating("0");
    setPriceLevel("0");
    setFacilityType("all");
    setCourtSurface("all");
    setMembershipType("all");
    setSkillLevel("all");
    router.push(`/categories/${slug}`, { scroll: false });
  };

  const hasActiveFilters =
    sortBy !== "relevance" ||
    selectedState !== "all" ||
    selectedCity !== "all" ||
    minRating !== "0" ||
    priceLevel !== "0" ||
    facilityType !== "all" ||
    courtSurface !== "all" ||
    membershipType !== "all" ||
    skillLevel !== "all";

  const FilterContent = () => (
    <div className="space-y-6">
      {/* State Filter */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">
          State
        </label>
        <Select
          value={selectedState}
          onValueChange={(value) => {
            setSelectedState(value);
            setSelectedCity("all"); // Reset city when state changes
            updateFilters("state", value);
            updateFilters("city", ""); // Clear city filter
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select state" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <SelectItem value="all">All States</SelectItem>
            {allStates.map((state) => (
              <SelectItem key={state.code} value={state.code}>
                {state.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* City Filter (only shown when state is selected) */}
      {selectedState !== "all" && availableCities.length > 0 && (
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            City
          </label>
          <Select
            value={selectedCity}
            onValueChange={(value) => {
              setSelectedCity(value);
              updateFilters("city", value);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select city" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="all">All Cities</SelectItem>
              {availableCities.map((city) => (
                <SelectItem key={city.slug} value={city.name}>
                  {city.name}
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

      {/* Category-Specific Filters */}
      {categoryFilters && slug === "pickleball-courts-facilities" && (
        <>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Facility Type
            </label>
            <Select
              value={facilityType}
              onValueChange={(value) => {
                setFacilityType(value);
                updateFilters("facilityType", value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                {categoryFilters.facilityType?.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Court Surface
            </label>
            <Select
              value={courtSurface}
              onValueChange={(value) => {
                setCourtSurface(value);
                updateFilters("courtSurface", value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any surface" />
              </SelectTrigger>
              <SelectContent>
                {categoryFilters.courtSurface?.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {categoryFilters && slug === "pickleball-clubs-leagues" && (
        <>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Membership Type
            </label>
            <Select
              value={membershipType}
              onValueChange={(value) => {
                setMembershipType(value);
                updateFilters("membershipType", value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                {categoryFilters.membershipType?.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Skill Level
            </label>
            <Select
              value={skillLevel}
              onValueChange={(value) => {
                setSkillLevel(value);
                updateFilters("skillLevel", value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All levels" />
              </SelectTrigger>
              <SelectContent>
                {categoryFilters.skillLevel?.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {categoryFilters && slug === "pickleball-equipment-stores" && (
        <>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Product Type
            </label>
            <Select
              value={searchParams.get("productType") || "all"}
              onValueChange={(value) => updateFilters("productType", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All products" />
              </SelectTrigger>
              <SelectContent>
                {categoryFilters.productType?.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Price Range
            </label>
            <Select
              value={searchParams.get("priceRange") || "all"}
              onValueChange={(value) => updateFilters("priceRange", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any price" />
              </SelectTrigger>
              <SelectContent>
                {categoryFilters.priceRange?.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {categoryFilters && slug === "pickleball-coaches-instructors" && (
        <>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Experience Level
            </label>
            <Select
              value={searchParams.get("experienceLevel") || "all"}
              onValueChange={(value) => updateFilters("experienceLevel", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All levels" />
              </SelectTrigger>
              <SelectContent>
                {categoryFilters.experienceLevel?.map((e) => (
                  <SelectItem key={e.value} value={e.value}>
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Certification
            </label>
            <Select
              value={searchParams.get("certification") || "all"}
              onValueChange={(value) => updateFilters("certification", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any certification" />
              </SelectTrigger>
              <SelectContent>
                {categoryFilters.certification?.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Lesson Type
            </label>
            <Select
              value={searchParams.get("lessonType") || "all"}
              onValueChange={(value) => updateFilters("lessonType", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                {categoryFilters.lessonType?.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {categoryFilters && slug === "pickleball-tournaments-events" && (
        <>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Tournament Type
            </label>
            <Select
              value={searchParams.get("tournamentType") || "all"}
              onValueChange={(value) => updateFilters("tournamentType", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                {categoryFilters.tournamentType?.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Skill Level
            </label>
            <Select
              value={searchParams.get("skillLevel") || "all"}
              onValueChange={(value) => {
                setSkillLevel(value);
                updateFilters("skillLevel", value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All levels" />
              </SelectTrigger>
              <SelectContent>
                {categoryFilters.skillLevel?.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Entry Fee
            </label>
            <Select
              value={searchParams.get("entryFee") || "all"}
              onValueChange={(value) => updateFilters("entryFee", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any fee" />
              </SelectTrigger>
              <SelectContent>
                {categoryFilters.entryFee?.map((e) => (
                  <SelectItem key={e.value} value={e.value}>
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {/* Price Filter (only for relevant categories) */}
      {(slug === "pickleball-equipment-stores" || slug === "pickleball-tournaments-events") && (
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
      )}

      {hasActiveFilters && (
        <Button variant="outline" onClick={clearFilters} className="w-full">
          <X className="w-4 h-4 mr-2" />
          Clear All Filters
        </Button>
      )}
    </div>
  );

  const displayName = category?.name || slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const displayDescription = category?.description || `Browse ${displayName} businesses across the United States`;
  const displaySection = category?.section || "General";

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
            <Link href="/categories" className="text-muted-foreground hover:text-foreground">
              Categories
            </Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground font-medium">{displayName}</span>
          </nav>
        </div>
      </div>

      {/* Header */}
      <div className="border-b border-border/50 bg-card/30">
        <div className="container mx-auto px-4 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Badge variant="secondary" className="mb-3">
              {displaySection}
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              {displayName}
              {selectedState !== "all" && (
                <span className="text-muted-foreground font-normal">
                  {" "}in {allStates.find(s => s.code === selectedState)?.name || selectedState}
                  {selectedCity !== "all" && `, ${selectedCity}`}
                </span>
              )}
            </h1>
            <p className="text-muted-foreground max-w-2xl">{displayDescription}</p>
          </motion.div>
        </div>
      </div>

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
            {/* Auto-sync notification */}
            {autoSynced && dataSource === "google" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm text-primary">
                  New businesses found! Data has been saved for faster loading next time.
                </span>
              </motion.div>
            )}

            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  Showing {businesses.length > 0 ? ((currentPage - 1) * 100 + 1) : 0}-{Math.min(currentPage * 100, totalBusinesses)} of {totalBusinesses} businesses
                </span>
                {dataSource && (
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs",
                      dataSource === "google" && "border-blue-500/50 text-blue-500",
                      dataSource === "database" && "border-green-500/50 text-green-500",
                      dataSource === "hybrid" && "border-amber-500/50 text-amber-500"
                    )}
                  >
                    {dataSource === "google" && "Live from Google"}
                    {dataSource === "database" && "From Database"}
                    {dataSource === "hybrid" && "Hybrid Data"}
                  </Badge>
                )}
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
                {selectedState !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    <MapPin className="w-3 h-3" />
                    {allStates.find(s => s.code === selectedState)?.name || selectedState}
                    <button onClick={() => { setSelectedState("all"); updateFilters("state", ""); }}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {selectedCity !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    <MapPin className="w-3 h-3" />
                    {selectedCity}
                    <button onClick={() => { setSelectedCity("all"); updateFilters("city", ""); }}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {facilityType !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {categoryFilters?.facilityType?.find(f => f.value === facilityType)?.label}
                    <button onClick={() => { setFacilityType("all"); updateFilters("facilityType", ""); }}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {courtSurface !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {categoryFilters?.courtSurface?.find(s => s.value === courtSurface)?.label}
                    <button onClick={() => { setCourtSurface("all"); updateFilters("courtSurface", ""); }}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {membershipType !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {categoryFilters?.membershipType?.find(m => m.value === membershipType)?.label}
                    <button onClick={() => { setMembershipType("all"); updateFilters("membershipType", ""); }}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {skillLevel !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {categoryFilters?.skillLevel?.find(s => s.value === skillLevel)?.label}
                    <button onClick={() => { setSkillLevel("all"); updateFilters("skillLevel", ""); }}>
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
              <>
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>

                    <div className="flex items-center gap-1">
                      {currentPage > 3 && (
                        <>
                          <Button
                            variant={currentPage === 1 ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(1)}
                          >
                            1
                          </Button>
                          {currentPage > 4 && <span className="px-2 text-muted-foreground">...</span>}
                        </>
                      )}

                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}

                      {currentPage < totalPages - 2 && (
                        <>
                          {currentPage < totalPages - 3 && <span className="px-2 text-muted-foreground">...</span>}
                          <Button
                            variant={currentPage === totalPages ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(totalPages)}
                          >
                            {totalPages}
                          </Button>
                        </>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No businesses found</h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your filters or sync more businesses from Google Places
                </p>
                <div className="flex items-center justify-center gap-4">
                  <Button onClick={clearFilters}>Clear All Filters</Button>
                  <Button variant="outline" asChild>
                    <Link href="/admin/sync">Sync Businesses</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CategoryPage() {
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
      <CategoryPageContent />
    </Suspense>
  );
}
