/**
 * Local Data Provider
 *
 * Reads businesses and categories from local JSON files in src/data/.
 * Replaces all database queries for business/category data.
 * Provides search, filter, sort, and pagination utilities.
 */

import businessesJson from "@/data/businesses.json";
import categoriesJson from "@/data/categories.json";

// ============================================================================
// Types
// ============================================================================

export interface LocalBusiness {
  // Core
  id: string;
  googlePlaceId: string | null;
  googleId: string | null;
  cid: string | null;
  name: string;
  slug: string;

  // Address
  description: string | null;
  address: string;
  street: string | null;
  city: string;
  state: string;
  zip: string | null;
  country: string | null;
  countryCode: string | null;
  neighborhood: string | null;
  areaService: boolean;

  // Contact
  phone: string | null;
  website: string | null;
  email: string | null;

  // Location
  lat: string | null;
  lng: string | null;
  plusCode: string | null;
  googleMapsUrl: string | null;

  // Classification
  type: string | null;
  subtypes: string[];
  googleCategory: string | null;
  categoryId: string;

  // About / amenities
  about: Record<string, any> | null;

  // Ratings & Reviews
  ratingAvg: string;
  reviewCount: number;
  reviewsPerScore: Record<string, number> | null;
  reviewsLink: string | null;
  reviewsTags: string[];
  reviewsData: Array<{
    reviewId: string | null;
    authorName: string | null;
    authorId: string | null;
    authorImage: string | null;
    authorLink: string | null;
    text: string | null;
    imageUrls: string[];
    ownerAnswer: string | null;
    ownerAnswerTimestamp: string | null;
    reviewLink: string | null;
    rating: number;
    timestamp: string | null;
    datetimeUtc: string | null;
    likes: number;
  }>;

  // Photos
  photos: string[];
  photosCount: number;
  streetView: string | null;
  logo: string | null;

  // Business status & ownership
  businessStatus: string | null;
  isVerified: boolean;
  isFeatured: boolean;
  ownerId: string | null;
  ownerTitle: string | null;
  ownerLink: string | null;

  // Hours
  hours: Record<string, string> | null;
  hoursRaw: Record<string, string[]> | null;
  hoursOldFormat: string | null;

  // Price
  priceLevel: number | null;
  priceRange: string | null;

  // Popular times
  popularTimes: Array<{
    day: string;
    hours: Array<{ hour: number; percentage: number }>;
  }>;

  // Links
  reservationLink: string | null;
  menuLink: string | null;
  orderLinks: string[];

  // Location context
  locatedIn: string | null;
  locatedGoogleId: string | null;

  // Social media
  facebook: string | null;
  instagram: string | null;
  twitter: string | null;
  linkedin: string | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Compat fields expected by existing components/SEO utils
  cachedImageUrls: string[] | null;
  lastEnrichedAt: Date | null;
  cachedPhone: string | null;
  cachedWebsite: string | null;
  cachedHours: Record<string, string> | null;
  cachedReviews: { authorName: string; rating: number; text: string; relativeTime: string; time: number; authorPhoto?: string }[] | null;
  claimedBy: string | null;
}

export interface LocalCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  section: string | null;
  displayOrder: number | null;
  createdAt: Date;
  parentId: string | null;
}

export interface BusinessWithCategory extends LocalBusiness {
  category: LocalCategory | null;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SearchFilters {
  query?: string;
  categorySlug?: string;
  city?: string;
  state?: string;
  neighborhood?: string;
  minRating?: string;
  featured?: boolean;
  sort?: "relevance" | "rating" | "reviews" | "name";
  page?: number;
  limit?: number;
}

// ============================================================================
// Data loading (cached in memory at module level)
// ============================================================================

// Hydrate raw JSON with compat fields, defaults, and Date objects
const allBusinesses: LocalBusiness[] = (businessesJson as any[]).map((b) => ({
  ...b,
  // Ensure new fields have defaults for backwards compat with old JSON
  googleId: b.googleId ?? null,
  cid: b.cid ?? null,
  street: b.street ?? null,
  country: b.country ?? null,
  countryCode: b.countryCode ?? null,
  areaService: b.areaService ?? false,
  plusCode: b.plusCode ?? null,
  type: b.type ?? null,
  subtypes: b.subtypes ?? [],
  googleCategory: b.googleCategory ?? null,
  about: b.about ?? null,
  reviewsPerScore: b.reviewsPerScore ?? null,
  reviewsLink: b.reviewsLink ?? null,
  reviewsTags: b.reviewsTags ?? [],
  reviewsData: b.reviewsData ?? [],
  photosCount: b.photosCount ?? (b.photos?.length || 0),
  streetView: b.streetView ?? null,
  logo: b.logo ?? null,
  businessStatus: b.businessStatus ?? null,
  ownerId: b.ownerId ?? null,
  ownerTitle: b.ownerTitle ?? null,
  ownerLink: b.ownerLink ?? null,
  hoursRaw: b.hoursRaw ?? null,
  hoursOldFormat: b.hoursOldFormat ?? null,
  priceRange: b.priceRange ?? null,
  popularTimes: b.popularTimes ?? [],
  reservationLink: b.reservationLink ?? null,
  menuLink: b.menuLink ?? null,
  orderLinks: b.orderLinks ?? [],
  locatedIn: b.locatedIn ?? null,
  locatedGoogleId: b.locatedGoogleId ?? null,
  facebook: b.facebook ?? null,
  instagram: b.instagram ?? null,
  twitter: b.twitter ?? null,
  linkedin: b.linkedin ?? null,
  // Date conversions
  createdAt: new Date(b.createdAt || Date.now()),
  updatedAt: new Date(b.updatedAt || Date.now()),
  // Compat fields for existing components/SEO utils
  cachedImageUrls: b.cachedImageUrls ?? b.photos ?? null,
  lastEnrichedAt: b.lastEnrichedAt ? new Date(b.lastEnrichedAt) : null,
  cachedPhone: b.cachedPhone ?? b.phone ?? null,
  cachedWebsite: b.cachedWebsite ?? b.website ?? null,
  cachedHours: b.cachedHours ?? b.hours ?? null,
  cachedReviews: b.cachedReviews ?? null,
  claimedBy: b.claimedBy ?? null,
}));

const allCategories: LocalCategory[] = (categoriesJson as any[]).map((c) => ({
  ...c,
  icon: c.icon ?? null,
  description: c.description ?? null,
  section: c.section ?? null,
  displayOrder: c.displayOrder ?? null,
  createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
  parentId: c.parentId ?? null,
}));

// Pre-built indexes for fast lookups
const businessBySlug = new Map<string, LocalBusiness>();
const businessById = new Map<string, LocalBusiness>();
const businessByPlaceId = new Map<string, LocalBusiness>();
const categoryBySlug = new Map<string, LocalCategory>();
const categoryById = new Map<string, LocalCategory>();

for (const biz of allBusinesses) {
  businessBySlug.set(biz.slug, biz);
  businessById.set(biz.id, biz);
  if (biz.googlePlaceId) businessByPlaceId.set(biz.googlePlaceId, biz);
}

for (const cat of allCategories) {
  categoryBySlug.set(cat.slug, cat);
  categoryById.set(cat.id, cat);
}

// ============================================================================
// Helpers
// ============================================================================

function attachCategory(biz: LocalBusiness): BusinessWithCategory {
  return { ...biz, category: categoryById.get(biz.categoryId) || null };
}

function matchesQuery(biz: LocalBusiness, q: string): boolean {
  const lower = q.toLowerCase();
  return (
    biz.name.toLowerCase().includes(lower) ||
    (biz.description || "").toLowerCase().includes(lower) ||
    biz.city.toLowerCase().includes(lower) ||
    biz.state.toLowerCase().includes(lower) ||
    biz.address.toLowerCase().includes(lower)
  );
}

function sortBusinesses(
  list: LocalBusiness[],
  sort: string
): LocalBusiness[] {
  const copy = [...list];
  switch (sort) {
    case "rating":
      return copy.sort(
        (a, b) => parseFloat(b.ratingAvg) - parseFloat(a.ratingAvg)
      );
    case "reviews":
      return copy.sort((a, b) => b.reviewCount - a.reviewCount);
    case "name":
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case "relevance":
    default:
      // Featured first, then by rating
      return copy.sort((a, b) => {
        if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
        return parseFloat(b.ratingAvg) - parseFloat(a.ratingAvg);
      });
  }
}

// ============================================================================
// Query functions
// ============================================================================

/** Get all categories */
export function getCategories(): LocalCategory[] {
  return allCategories;
}

/** Get a single category by slug */
export function getCategoryBySlug(slug: string): LocalCategory | null {
  return categoryBySlug.get(slug) || null;
}

/** Get a single business by slug */
export function getBusinessBySlug(slug: string): BusinessWithCategory | null {
  const biz = businessBySlug.get(slug);
  if (!biz) return null;
  return attachCategory(biz);
}

/** Get a single business by id */
export function getBusinessById(id: string): BusinessWithCategory | null {
  const biz = businessById.get(id);
  if (!biz) return null;
  return attachCategory(biz);
}

/** Get a single business by Google Place ID */
export function getBusinessByPlaceId(
  placeId: string
): BusinessWithCategory | null {
  const biz = businessByPlaceId.get(placeId);
  if (!biz) return null;
  return attachCategory(biz);
}

/** Get total business count */
export function getBusinessCount(): number {
  return allBusinesses.length;
}

/** Search and filter businesses with pagination */
export function searchBusinesses(
  filters: SearchFilters = {}
): PaginatedResult<BusinessWithCategory> {
  const {
    query,
    categorySlug,
    city,
    state,
    neighborhood,
    minRating,
    featured,
    sort = "relevance",
    page = 1,
    limit = 12,
  } = filters;

  let filtered = [...allBusinesses];

  if (query) {
    filtered = filtered.filter((b) => matchesQuery(b, query));
  }

  if (categorySlug && categorySlug !== "all") {
    const cat = categoryBySlug.get(categorySlug);
    if (cat) {
      filtered = filtered.filter((b) => b.categoryId === cat.id);
    }
  }

  if (city) {
    const cityLower = city.toLowerCase();
    filtered = filtered.filter((b) => b.city.toLowerCase() === cityLower);
  }

  if (state) {
    const stateLower = state.toLowerCase();
    filtered = filtered.filter(
      (b) =>
        b.state.toLowerCase() === stateLower ||
        b.state.toLowerCase() === stateLower
    );
  }

  if (neighborhood && neighborhood !== "all") {
    filtered = filtered.filter(
      (b) => b.neighborhood?.toLowerCase() === neighborhood.toLowerCase()
    );
  }

  if (minRating) {
    const min = parseFloat(minRating);
    filtered = filtered.filter((b) => parseFloat(b.ratingAvg) >= min);
  }

  if (featured) {
    filtered = filtered.filter((b) => b.isFeatured);
  }

  // Sort
  filtered = sortBusinesses(filtered, sort);

  // Paginate
  const total = filtered.length;
  const offset = (page - 1) * limit;
  const paged = filtered.slice(offset, offset + limit);

  return {
    data: paged.map(attachCategory),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/** Get businesses by city and state */
export function getBusinessesByCity(
  city: string,
  state: string,
  options: { sort?: string; limit?: number } = {}
): BusinessWithCategory[] {
  const { sort = "rating", limit: max } = options;
  const cityLower = city.toLowerCase();
  const stateLower = state.toLowerCase();

  let filtered = allBusinesses.filter(
    (b) =>
      b.city.toLowerCase() === cityLower &&
      b.state.toLowerCase() === stateLower
  );

  filtered = sortBusinesses(filtered, sort);
  if (max) filtered = filtered.slice(0, max);

  return filtered.map(attachCategory);
}

/** Get businesses by state */
export function getBusinessesByState(
  state: string,
  options: { sort?: string; limit?: number } = {}
): BusinessWithCategory[] {
  const { sort = "rating", limit: max } = options;
  const stateLower = state.toLowerCase();

  let filtered = allBusinesses.filter(
    (b) => b.state.toLowerCase() === stateLower
  );

  filtered = sortBusinesses(filtered, sort);
  if (max) filtered = filtered.slice(0, max);

  return filtered.map(attachCategory);
}

/** Get businesses by category */
export function getBusinessesByCategory(
  categorySlug: string,
  options: { sort?: string; limit?: number } = {}
): BusinessWithCategory[] {
  const { sort = "rating", limit: max } = options;
  const cat = categoryBySlug.get(categorySlug);
  if (!cat) return [];

  let filtered = allBusinesses.filter((b) => b.categoryId === cat.id);
  filtered = sortBusinesses(filtered, sort);
  if (max) filtered = filtered.slice(0, max);

  return filtered.map(attachCategory);
}

/** Get featured businesses */
export function getFeaturedBusinesses(
  limit = 6
): BusinessWithCategory[] {
  const featured = allBusinesses.filter((b) => b.isFeatured);
  if (featured.length > 0) {
    return sortBusinesses(featured, "rating")
      .slice(0, limit)
      .map(attachCategory);
  }
  // Fallback: top rated if none are flagged as featured
  return sortBusinesses([...allBusinesses], "rating")
    .slice(0, limit)
    .map(attachCategory);
}

/** Get recently added businesses */
export function getRecentBusinesses(
  limit = 6
): BusinessWithCategory[] {
  const sorted = [...allBusinesses].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
  return sorted.slice(0, limit).map(attachCategory);
}

/** Get similar businesses (same city or category, excluding the given one) */
export function getSimilarBusinesses(
  slug: string,
  limit = 4
): BusinessWithCategory[] {
  const biz = businessBySlug.get(slug);
  if (!biz) return [];

  // Same city first, then same category
  const sameCity = allBusinesses.filter(
    (b) =>
      b.slug !== slug &&
      b.city.toLowerCase() === biz.city.toLowerCase() &&
      b.state.toLowerCase() === biz.state.toLowerCase()
  );

  const sameCategory = allBusinesses.filter(
    (b) =>
      b.slug !== slug &&
      b.categoryId === biz.categoryId &&
      !sameCity.includes(b)
  );

  const combined = [...sameCity, ...sameCategory];
  return sortBusinesses(combined, "rating")
    .slice(0, limit)
    .map(attachCategory);
}

/** Get search suggestions (autocomplete) */
export function getSearchSuggestions(
  query: string,
  limit = 5
): { name: string; slug: string; city: string; state: string }[] {
  if (!query || query.length < 2) return [];

  const lower = query.toLowerCase();
  const matches = allBusinesses
    .filter((b) => b.name.toLowerCase().includes(lower))
    .slice(0, limit)
    .map((b) => ({
      name: b.name,
      slug: b.slug,
      city: b.city,
      state: b.state,
    }));

  return matches;
}

/** Get all unique neighborhoods with counts */
export function getNeighborhoods(): Array<{
  neighborhood: string;
  count: number;
  avgRating: string;
}> {
  const map = new Map<
    string,
    { count: number; totalRating: number }
  >();

  for (const biz of allBusinesses) {
    if (!biz.neighborhood) continue;
    const existing = map.get(biz.neighborhood) || {
      count: 0,
      totalRating: 0,
    };
    existing.count++;
    existing.totalRating += parseFloat(biz.ratingAvg);
    map.set(biz.neighborhood, existing);
  }

  return Array.from(map.entries())
    .map(([neighborhood, data]) => ({
      neighborhood,
      count: data.count,
      avgRating: (data.totalRating / data.count).toFixed(2),
    }))
    .sort((a, b) => b.count - a.count);
}

/** Get aggregate stats */
export function getStats(): {
  totalBusinesses: number;
  totalCategories: number;
  totalCities: number;
  totalStates: number;
  avgRating: string;
  totalReviews: number;
} {
  const cities = new Set(allBusinesses.map((b) => `${b.city}-${b.state}`));
  const states = new Set(allBusinesses.map((b) => b.state));
  const totalRating = allBusinesses.reduce(
    (sum, b) => sum + parseFloat(b.ratingAvg),
    0
  );
  const totalReviews = allBusinesses.reduce(
    (sum, b) => sum + b.reviewCount,
    0
  );

  return {
    totalBusinesses: allBusinesses.length,
    totalCategories: allCategories.length,
    totalCities: cities.size,
    totalStates: states.size,
    avgRating:
      allBusinesses.length > 0
        ? (totalRating / allBusinesses.length).toFixed(2)
        : "0",
    totalReviews,
  };
}

/** Get category stats (count of businesses per category) */
export function getCategoryStats(): Array<{
  category: LocalCategory;
  count: number;
}> {
  const countMap = new Map<string, number>();
  for (const biz of allBusinesses) {
    countMap.set(biz.categoryId, (countMap.get(biz.categoryId) || 0) + 1);
  }

  return allCategories.map((cat) => ({
    category: cat,
    count: countMap.get(cat.id) || 0,
  }));
}

/** Get state-level stats */
export function getStateStats(
  stateCode: string
): {
  businessCount: number;
  cities: Array<{ city: string; count: number }>;
  categories: Array<{ category: LocalCategory; count: number }>;
} {
  const stateLower = stateCode.toLowerCase();
  const stateBusinesses = allBusinesses.filter(
    (b) => b.state.toLowerCase() === stateLower
  );

  const cityMap = new Map<string, number>();
  const catMap = new Map<string, number>();

  for (const biz of stateBusinesses) {
    cityMap.set(biz.city, (cityMap.get(biz.city) || 0) + 1);
    catMap.set(biz.categoryId, (catMap.get(biz.categoryId) || 0) + 1);
  }

  return {
    businessCount: stateBusinesses.length,
    cities: Array.from(cityMap.entries())
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count),
    categories: allCategories
      .map((cat) => ({ category: cat, count: catMap.get(cat.id) || 0 }))
      .filter((c) => c.count > 0),
  };
}

/** Get all businesses for sitemap */
export function getAllBusinessesForSitemap(): Array<{
  slug: string;
  updatedAt: Date;
  isFeatured: boolean;
  isVerified: boolean;
}> {
  return allBusinesses.map((b) => ({
    slug: b.slug,
    updatedAt: b.updatedAt,
    isFeatured: b.isFeatured,
    isVerified: b.isVerified,
  }));
}

/** Get all unique cities grouped by state */
export function getCitiesWithBusinesses(): Map<
  string,
  Array<{ city: string; count: number }>
> {
  const stateMap = new Map<string, Map<string, number>>();

  for (const biz of allBusinesses) {
    if (!stateMap.has(biz.state)) stateMap.set(biz.state, new Map());
    const cityMap = stateMap.get(biz.state)!;
    cityMap.set(biz.city, (cityMap.get(biz.city) || 0) + 1);
  }

  const result = new Map<string, Array<{ city: string; count: number }>>();
  for (const [state, cityMap] of stateMap.entries()) {
    result.set(
      state,
      Array.from(cityMap.entries())
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
    );
  }

  return result;
}

/** Get top businesses across all data (for llms.txt etc.) */
export function getTopBusinesses(
  limit = 20
): BusinessWithCategory[] {
  return sortBusinesses([...allBusinesses], "rating")
    .slice(0, limit)
    .map(attachCategory);
}
