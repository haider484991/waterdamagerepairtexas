"use client";

import { useState, useEffect, Suspense, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  MapPin,
  Grid3X3,
  List,
  Map,
  X,
  SlidersHorizontal,
  Star,
  Building2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Skeleton } from "@/components/ui/skeleton";
import { BusinessCard } from "@/components/business";
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
  googlePlaceId?: string | null;
  category: { name: string; slug: string } | null;
}

interface Suggestion {
  id: string;
  name: string;
  slug: string;
  type: "business" | "category" | "search";
}

const categories = [
  { value: "all", label: "All Services" },
  { value: "water-damage-restoration", label: "Water Damage Restoration" },
  { value: "flood-cleanup", label: "Flood Cleanup" },
  { value: "mold-remediation", label: "Mold Remediation" },
  { value: "emergency-services", label: "Emergency Services" },
  { value: "storm-damage", label: "Storm Damage Repair" },
];

const stateFilters = [
  { value: "all", label: "All States" },
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
  { value: "DC", label: "Washington D.C." },
];

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

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid");
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState<Business[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Suggestions state
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  // Filter states
  const [category, setCategory] = useState(searchParams.get("category") || "all");
  const [stateFilter, setStateFilter] = useState(searchParams.get("state") || "all");
  const [minRating, setMinRating] = useState(searchParams.get("rating") || "0");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "relevance");
  const [dataSource, setDataSource] = useState<"database" | "google" | "hybrid" | null>(null);
  const [autoSynced, setAutoSynced] = useState(false);

  // Fetch suggestions
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setSuggestionsLoading(true);
    try {
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error("Suggestions error:", error);
      setSuggestions([]);
    } finally {
      setSuggestionsLoading(false);
    }
  }, []);

  // Debounce suggestions
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        fetchSuggestions(query);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, fetchSuggestions]);

  // Fetch search results
  const fetchResults = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchParams.get("q")) params.set("q", searchParams.get("q")!);
      if (searchParams.get("category") && searchParams.get("category") !== "all") {
        params.set("category", searchParams.get("category")!);
      }
      if (searchParams.get("state") && searchParams.get("state") !== "all") {
        params.set("state", searchParams.get("state")!);
      }
      if (searchParams.get("rating") && searchParams.get("rating") !== "0") {
        params.set("rating", searchParams.get("rating")!);
      }
      if (searchParams.get("sort") && searchParams.get("sort") !== "relevance") {
        params.set("sort", searchParams.get("sort")!);
      }
      params.set("page", page.toString());
      params.set("limit", "50");

      const response = await fetch(`/api/search?${params.toString()}`);
      const data = await response.json();
      
      setResults(data.data || []);
      setTotalResults(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 0);
      setCurrentPage(data.pagination?.page || 1);
      setDataSource(data.dataSource || null);
      setAutoSynced(data.autoSynced || false);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchResults(1);
  }, [fetchResults]);

  // Sync state with URL params
  useEffect(() => {
    setQuery(searchParams.get("q") || "");
    setCategory(searchParams.get("category") || "all");
    setStateFilter(searchParams.get("state") || "all");
    setMinRating(searchParams.get("rating") || "0");
    setSortBy(searchParams.get("sort") || "relevance");
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (category !== "all") params.set("category", category);
    if (stateFilter !== "all") params.set("state", stateFilter);
    if (minRating !== "0") params.set("rating", minRating);
    if (sortBy !== "relevance") params.set("sort", sortBy);
    router.push(`/search?${params.toString()}`);
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setShowSuggestions(false);
    if (suggestion.type === "business") {
      router.push(`/business/${suggestion.slug}`);
    } else if (suggestion.type === "category") {
      router.push(`/categories/${suggestion.slug}`);
    } else {
      setQuery(suggestion.name);
      router.push(`/search?q=${encodeURIComponent(suggestion.name)}`);
    }
  };

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all" && value !== "0" && value !== "relevance") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/search?${params.toString()}`, { scroll: false });
  };

  const clearFilters = () => {
    setCategory("all");
    setStateFilter("all");
    setMinRating("0");
    setSortBy("relevance");
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    router.push(`/search?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/search?${params.toString()}`, { scroll: true });
    fetchResults(page);
  };

  const hasActiveFilters =
    category !== "all" || stateFilter !== "all" || minRating !== "0";

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Category Filter */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">
          Category
        </label>
        <Select
          value={category}
          onValueChange={(value) => {
            setCategory(value);
            updateFilter("category", value);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* State Filter */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">
          State
        </label>
        <Select
          value={stateFilter}
          onValueChange={(value) => {
            setStateFilter(value);
            updateFilter("state", value);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select state" />
          </SelectTrigger>
          <SelectContent>
            {stateFilters.map((s: { value: string; label: string }) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Rating Filter */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">
          Minimum Rating
        </label>
        <Select
          value={minRating}
          onValueChange={(value) => {
            setMinRating(value);
            updateFilter("rating", value);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Any rating" />
          </SelectTrigger>
          <SelectContent>
            {ratingFilters.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <Button
          variant="outline"
          onClick={clearFilters}
          className="w-full"
        >
          Clear All Filters
        </Button>
      )}
    </div>
  );

  // Pagination component
  const Pagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const showPages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
    let endPage = Math.min(totalPages, startPage + showPages - 1);

    if (endPage - startPage < showPages - 1) {
      startPage = Math.max(1, endPage - showPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
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
          {startPage > 1 && (
            <>
              <Button
                variant={currentPage === 1 ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(1)}
              >
                1
              </Button>
              {startPage > 2 && <span className="px-2 text-muted-foreground">...</span>}
            </>
          )}

          {pages.map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => handlePageChange(page)}
            >
              {page}
            </Button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="px-2 text-muted-foreground">...</span>}
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
    );
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Search Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <form onSubmit={handleSearch}>
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Search businesses, categories, or services..."
                className="pl-12 pr-24 py-6 text-lg bg-white border-border shadow-sm"
              />
              <Button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                Search
              </Button>

              {/* Suggestions Dropdown */}
              <AnimatePresence>
                {showSuggestions && (suggestions.length > 0 || suggestionsLoading) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
                  >
                    {suggestionsLoading ? (
                      <div className="p-4 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="py-2">
                        {suggestions.map((suggestion) => (
                          <button
                            key={`${suggestion.type}-${suggestion.id}`}
                            type="button"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-secondary/50 transition-colors text-left"
                          >
                            {suggestion.type === "business" && (
                              <Building2 className="w-4 h-4 text-primary" />
                            )}
                            {suggestion.type === "category" && (
                              <Tag className="w-4 h-4 text-blue-500" />
                            )}
                            {suggestion.type === "search" && (
                              <Search className="w-4 h-4 text-muted-foreground" />
                            )}
                            <div className="flex-1">
                              <p className="font-medium">{suggestion.name}</p>
                              <p className="text-xs text-muted-foreground capitalize">
                                {suggestion.type}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </form>

          {query && (
            <p className="text-center mt-4 text-muted-foreground">
              Showing results for &quot;<span className="text-foreground font-medium">{query}</span>&quot;
              {stateFilter !== "all" && ` in ${stateFilters.find((s: { value: string; label: string }) => s.value === stateFilter)?.label}`}
              {stateFilter === "all" && " across the USA"}
            </p>
          )}
        </motion.div>

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

          {/* Main Content */}
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
                  {totalResults} results found
                </span>
                {dataSource && (
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs",
                      dataSource === "google" && "border-blue-600/50 text-blue-600",
                      dataSource === "database" && "border-green-600/50 text-green-600",
                      dataSource === "hybrid" && "border-blue-600/50 text-blue-600"
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
                        <Badge className="ml-2 bg-primary text-primary-foreground">
                          Active
                        </Badge>
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

                {/* Sort */}
                <Select
                  value={sortBy}
                  onValueChange={(value) => {
                    setSortBy(value);
                    updateFilter("sort", value);
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
                  <button
                    onClick={() => setViewMode("map")}
                    className={cn(
                      "p-1.5 rounded transition-colors",
                      viewMode === "map"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Map className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {category !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {categories.find((c) => c.value === category)?.label}
                    <button
                      onClick={() => {
                        setCategory("all");
                        updateFilter("category", "all");
                      }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {stateFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    <MapPin className="w-3 h-3" />
                    {stateFilters.find((s: { value: string; label: string }) => s.value === stateFilter)?.label}
                    <button
                      onClick={() => {
                        setStateFilter("all");
                        updateFilter("state", "all");
                      }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {minRating !== "0" && (
                  <Badge variant="secondary" className="gap-1">
                    <Star className="w-3 h-3" />
                    {minRating}+ stars
                    <button
                      onClick={() => {
                        setMinRating("0");
                        updateFilter("rating", "0");
                      }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}

            {/* Results Grid */}
            {viewMode === "map" ? (
              <div className="glass-card rounded-xl p-8 min-h-[500px] flex items-center justify-center">
                <div className="text-center">
                  <Map className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Map view coming soon. Configure your Google Maps API key to enable.
                  </p>
                </div>
              </div>
            ) : isLoading ? (
              <div
                className={cn(
                  "grid gap-6",
                  viewMode === "grid"
                    ? "md:grid-cols-2 xl:grid-cols-3"
                    : "grid-cols-1"
                )}
              >
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
            ) : results.length > 0 ? (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={cn(
                    "grid gap-6",
                    viewMode === "grid"
                      ? "md:grid-cols-2 xl:grid-cols-3"
                      : "grid-cols-1"
                  )}
                >
                  {results.map((business, index) => (
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
                <Pagination />
              </>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground mb-6">
                  Try different keywords or adjust your filters
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

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Loading search...</p>
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
