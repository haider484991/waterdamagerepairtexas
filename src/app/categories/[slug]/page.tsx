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

// Water damage service-specific filters based on category
const getCategorySpecificFilters = (categorySlug: string) => {
  switch (categorySlug) {
    case "water-damage-restoration":
      return {
        serviceType: [
          { value: "all", label: "All Services" },
          { value: "residential", label: "Residential" },
          { value: "commercial", label: "Commercial" },
          { value: "both", label: "Both" },
        ],
        availability: [
          { value: "all", label: "Any Availability" },
          { value: "24-7", label: "24/7 Service" },
          { value: "emergency", label: "Emergency Response" },
          { value: "scheduled", label: "Scheduled Only" },
        ],
        certification: [
          { value: "all", label: "Any Certification" },
          { value: "iicrc", label: "IICRC Certified" },
          { value: "rrt", label: "RRT Certified" },
          { value: "insured", label: "Fully Insured" },
        ],
      };
    case "flood-cleanup":
      return {
        serviceType: [
          { value: "all", label: "All Types" },
          { value: "residential", label: "Residential" },
          { value: "commercial", label: "Commercial" },
          { value: "industrial", label: "Industrial" },
        ],
        responseTime: [
          { value: "all", label: "Any Response Time" },
          { value: "immediate", label: "Immediate (< 1 hour)" },
          { value: "same-day", label: "Same Day" },
          { value: "next-day", label: "Next Day" },
        ],
      };
    case "mold-remediation":
      return {
        serviceType: [
          { value: "all", label: "All Services" },
          { value: "inspection", label: "Inspection Only" },
          { value: "removal", label: "Removal" },
          { value: "prevention", label: "Prevention" },
          { value: "full-service", label: "Full Service" },
        ],
        certification: [
          { value: "all", label: "Any Certification" },
          { value: "certified", label: "Certified" },
          { value: "licensed", label: "Licensed" },
          { value: "both", label: "Certified & Licensed" },
        ],
      };
    case "emergency-services":
      return {
        availability: [
          { value: "all", label: "Any Availability" },
          { value: "24-7", label: "24/7 Available" },
          { value: "weekends", label: "Weekends" },
          { value: "holidays", label: "Holidays" },
        ],
        responseTime: [
          { value: "all", label: "Any Response Time" },
          { value: "30-min", label: "Under 30 Minutes" },
          { value: "1-hour", label: "Under 1 Hour" },
          { value: "2-hours", label: "Under 2 Hours" },
        ],
      };
    case "storm-damage":
      return {
        damageType: [
          { value: "all", label: "All Types" },
          { value: "wind", label: "Wind Damage" },
          { value: "hail", label: "Hail Damage" },
          { value: "flood", label: "Flood Damage" },
          { value: "tornado", label: "Tornado Damage" },
        ],
        serviceType: [
          { value: "all", label: "All Services" },
          { value: "assessment", label: "Assessment" },
          { value: "repair", label: "Repair" },
          { value: "restoration", label: "Full Restoration" },
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
  
  // Category-specific filter states for water damage services
  const categoryFilters = getCategorySpecificFilters(slug);
  const [serviceType, setServiceType] = useState(searchParams.get("serviceType") || "all");
  const [availability, setAvailability] = useState(searchParams.get("availability") || "all");
  const [certification, setCertification] = useState(searchParams.get("certification") || "all");
  const [responseTime, setResponseTime] = useState(searchParams.get("responseTime") || "all");
  const [damageType, setDamageType] = useState(searchParams.get("damageType") || "all");
  
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
      
      // Add category-specific filters for water damage services
      if (serviceType !== "all") params.set("serviceType", serviceType);
      if (availability !== "all") params.set("availability", availability);
      if (certification !== "all") params.set("certification", certification);
      if (responseTime !== "all") params.set("responseTime", responseTime);
      if (damageType !== "all") params.set("damageType", damageType);

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
  }, [slug, selectedState, selectedCity, minRating, priceLevel, sortBy, serviceType, availability, certification, responseTime, damageType, currentPage]);

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
    setServiceType("all");
    setAvailability("all");
    setCertification("all");
    setResponseTime("all");
    setDamageType("all");
    router.push(`/categories/${slug}`, { scroll: false });
  };

  const hasActiveFilters =
    sortBy !== "relevance" ||
    selectedState !== "all" ||
    selectedCity !== "all" ||
    minRating !== "0" ||
    priceLevel !== "0" ||
    serviceType !== "all" ||
    availability !== "all" ||
    certification !== "all" ||
    responseTime !== "all" ||
    damageType !== "all";

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

      {/* Category-Specific Filters for Water Damage Services */}
      {categoryFilters && slug === "water-damage-restoration" && (
        <>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Service Type
            </label>
            <Select
              value={serviceType}
              onValueChange={(value) => {
                setServiceType(value);
                updateFilters("serviceType", value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All services" />
              </SelectTrigger>
              <SelectContent>
                {categoryFilters.serviceType?.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Availability
            </label>
            <Select
              value={availability}
              onValueChange={(value) => {
                setAvailability(value);
                updateFilters("availability", value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any availability" />
              </SelectTrigger>
              <SelectContent>
                {categoryFilters.availability?.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label}
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
              value={certification}
              onValueChange={(value) => {
                setCertification(value);
                updateFilters("certification", value);
              }}
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
        </>
      )}

      {categoryFilters && slug === "flood-cleanup" && (
        <>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Service Type
            </label>
            <Select
              value={serviceType}
              onValueChange={(value) => {
                setServiceType(value);
                updateFilters("serviceType", value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                {categoryFilters.serviceType?.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Response Time
            </label>
            <Select
              value={responseTime}
              onValueChange={(value) => {
                setResponseTime(value);
                updateFilters("responseTime", value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any response time" />
              </SelectTrigger>
              <SelectContent>
                {categoryFilters.responseTime?.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {categoryFilters && slug === "mold-remediation" && (
        <>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Service Type
            </label>
            <Select
              value={serviceType}
              onValueChange={(value) => {
                setServiceType(value);
                updateFilters("serviceType", value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All services" />
              </SelectTrigger>
              <SelectContent>
                {categoryFilters.serviceType?.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
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
              value={certification}
              onValueChange={(value) => {
                setCertification(value);
                updateFilters("certification", value);
              }}
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
        </>
      )}

      {categoryFilters && slug === "emergency-services" && (
        <>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Availability
            </label>
            <Select
              value={availability}
              onValueChange={(value) => {
                setAvailability(value);
                updateFilters("availability", value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any availability" />
              </SelectTrigger>
              <SelectContent>
                {categoryFilters.availability?.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Response Time
            </label>
            <Select
              value={responseTime}
              onValueChange={(value) => {
                setResponseTime(value);
                updateFilters("responseTime", value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any response time" />
              </SelectTrigger>
              <SelectContent>
                {categoryFilters.responseTime?.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {categoryFilters && slug === "storm-damage" && (
        <>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Damage Type
            </label>
            <Select
              value={damageType}
              onValueChange={(value) => {
                setDamageType(value);
                updateFilters("damageType", value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                {categoryFilters.damageType?.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Service Type
            </label>
            <Select
              value={serviceType}
              onValueChange={(value) => {
                setServiceType(value);
                updateFilters("serviceType", value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All services" />
              </SelectTrigger>
              <SelectContent>
                {categoryFilters.serviceType?.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {/* Price Filter */}
      {categoryFilters && (
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
  const displayDescription = category?.description || `Browse ${displayName} services across Texas`;
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
                {serviceType !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {categoryFilters?.serviceType?.find(s => s.value === serviceType)?.label}
                    <button onClick={() => { setServiceType("all"); updateFilters("serviceType", ""); }}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {availability !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {categoryFilters?.availability?.find(a => a.value === availability)?.label}
                    <button onClick={() => { setAvailability("all"); updateFilters("availability", ""); }}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {certification !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {categoryFilters?.certification?.find(c => c.value === certification)?.label}
                    <button onClick={() => { setCertification("all"); updateFilters("certification", ""); }}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {responseTime !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {categoryFilters?.responseTime?.find(r => r.value === responseTime)?.label}
                    <button onClick={() => { setResponseTime("all"); updateFilters("responseTime", ""); }}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {damageType !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {categoryFilters?.damageType?.find(d => d.value === damageType)?.label}
                    <button onClick={() => { setDamageType("all"); updateFilters("damageType", ""); }}>
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
