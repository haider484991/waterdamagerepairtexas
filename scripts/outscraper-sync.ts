/**
 * Outscraper Sync Script — Full Data Extraction
 *
 * Pulls ~3000 water damage restoration businesses from Outscraper Google Maps API
 * and saves them to src/data/businesses.json (local file, no database needed).
 * Captures ALL available data fields from the API.
 *
 * Usage: npx tsx scripts/outscraper-sync.ts
 *
 * Requires OUTSCRAPER_API_KEY in .env.local
 * Get your API key at: https://scraper.systems (Outscraper platform)
 *
 * The script is resumable — if it finds an existing businesses.json, it will
 * skip already-fetched place_ids and append new ones.
 */

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import slugify from "slugify";

dotenv.config({ path: ".env.local" });

// ============================================================================
// Configuration
// ============================================================================

const OUTSCRAPER_API_KEY = process.env.OUTSCRAPER_API_KEY;
if (!OUTSCRAPER_API_KEY) {
  console.error("ERROR: OUTSCRAPER_API_KEY is not set in .env.local");
  console.error("Get your API key at: https://scraper.systems");
  process.exit(1);
}

const API_BASE = "https://api.app.outscraper.com";
const TARGET_BUSINESSES = 2000;
const LIMIT_PER_QUERY = 40;
const DELAY_BETWEEN_REQUESTS_MS = 2000;
const RETRY_DELAY_MS = 5000;
const MAX_RETRIES = 2;

const DATA_DIR = path.join(process.cwd(), "src", "data");
const BUSINESSES_FILE = path.join(DATA_DIR, "businesses.json");

// ============================================================================
// Full Outscraper API response type — every known field
// ============================================================================

interface OutscraperPlace {
  // Core identity
  name?: string;
  place_id?: string;
  google_id?: string;
  cid?: string;

  // Address components
  full_address?: string;
  street?: string;
  borough?: string;
  city?: string;
  state?: string;
  us_state?: string;
  postal_code?: string;
  country?: string;
  country_code?: string;
  area_service?: boolean;

  // Location
  latitude?: number;
  longitude?: number;
  location_link?: string;
  plus_code?: string;

  // Contact
  phone?: string;
  site?: string;
  email?: string;

  // Classification
  type?: string;
  subtypes?: string[] | string;
  category?: string;

  // Description / about
  description?: string;
  about?: Record<string, any>;

  // Ratings & Reviews
  rating?: number;
  reviews?: number;
  reviews_per_score?: Record<string, number>;
  reviews_link?: string;
  reviews_tags?: string[] | string;
  reviews_data?: Array<{
    review_id?: string;
    author_title?: string;
    author_id?: string;
    author_image?: string;
    author_link?: string;
    review_text?: string;
    review_img_urls?: string[];
    owner_answer?: string;
    owner_answer_timestamp?: string;
    review_link?: string;
    review_rating?: number;
    review_timestamp?: string;
    review_datetime_utc?: string;
    review_likes?: number;
  }>;

  // Photos
  photo?: string;
  photos_count?: number;
  photos?: string[];
  street_view?: string;
  logo?: string;

  // Business status
  business_status?: string;
  verified?: boolean;
  owner_id?: string;
  owner_title?: string;
  owner_link?: string;

  // Hours
  working_hours?: Record<string, string[] | string>;
  working_hours_old_format?: string;

  // Price
  price_level?: number;
  range?: string;

  // Popular times (per-day, per-hour popularity data)
  popular_times?: Array<{
    day?: string;
    hours?: Array<{
      hour?: number;
      percentage?: number;
    }>;
  }>;

  // Links
  reservation_link?: string;
  menu_link?: string;
  order_links?: string[] | string;

  // Location context
  located_in?: string;
  located_google_id?: string;

  // Social media (from enrichment)
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;

  // Misc
  posts?: any[];
  query?: string;
}

// ============================================================================
// Local business type — captures everything
// ============================================================================

interface LocalBusiness {
  // Core
  id: string;
  googlePlaceId: string;
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
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Top ~80 US cities by population
// ============================================================================

const TOP_CITIES: Array<{ city: string; state: string }> = [
  // California
  { city: "Los Angeles", state: "CA" },
  { city: "San Diego", state: "CA" },
  { city: "San Jose", state: "CA" },
  { city: "San Francisco", state: "CA" },
  { city: "Sacramento", state: "CA" },
  { city: "Fresno", state: "CA" },
  { city: "Long Beach", state: "CA" },
  { city: "Riverside", state: "CA" },
  { city: "Anaheim", state: "CA" },
  // Texas
  { city: "Houston", state: "TX" },
  { city: "San Antonio", state: "TX" },
  { city: "Dallas", state: "TX" },
  { city: "Austin", state: "TX" },
  { city: "Fort Worth", state: "TX" },
  { city: "El Paso", state: "TX" },
  { city: "Arlington", state: "TX" },
  { city: "Plano", state: "TX" },
  // Florida
  { city: "Jacksonville", state: "FL" },
  { city: "Miami", state: "FL" },
  { city: "Tampa", state: "FL" },
  { city: "Orlando", state: "FL" },
  { city: "Fort Lauderdale", state: "FL" },
  { city: "St. Petersburg", state: "FL" },
  { city: "Cape Coral", state: "FL" },
  // New York
  { city: "New York", state: "NY" },
  { city: "Buffalo", state: "NY" },
  { city: "Rochester", state: "NY" },
  // Pennsylvania
  { city: "Philadelphia", state: "PA" },
  { city: "Pittsburgh", state: "PA" },
  // Illinois
  { city: "Chicago", state: "IL" },
  { city: "Aurora", state: "IL" },
  // Ohio
  { city: "Columbus", state: "OH" },
  { city: "Cleveland", state: "OH" },
  { city: "Cincinnati", state: "OH" },
  { city: "Toledo", state: "OH" },
  // Georgia
  { city: "Atlanta", state: "GA" },
  { city: "Augusta", state: "GA" },
  { city: "Savannah", state: "GA" },
  // North Carolina
  { city: "Charlotte", state: "NC" },
  { city: "Raleigh", state: "NC" },
  { city: "Greensboro", state: "NC" },
  // Michigan
  { city: "Detroit", state: "MI" },
  { city: "Grand Rapids", state: "MI" },
  // New Jersey
  { city: "Newark", state: "NJ" },
  { city: "Jersey City", state: "NJ" },
  // Virginia
  { city: "Virginia Beach", state: "VA" },
  { city: "Richmond", state: "VA" },
  { city: "Norfolk", state: "VA" },
  // Washington
  { city: "Seattle", state: "WA" },
  { city: "Spokane", state: "WA" },
  { city: "Tacoma", state: "WA" },
  // Arizona
  { city: "Phoenix", state: "AZ" },
  { city: "Tucson", state: "AZ" },
  { city: "Mesa", state: "AZ" },
  // Massachusetts
  { city: "Boston", state: "MA" },
  { city: "Worcester", state: "MA" },
  // Tennessee
  { city: "Nashville", state: "TN" },
  { city: "Memphis", state: "TN" },
  { city: "Knoxville", state: "TN" },
  // Indiana
  { city: "Indianapolis", state: "IN" },
  { city: "Fort Wayne", state: "IN" },
  // Maryland
  { city: "Baltimore", state: "MD" },
  // Missouri
  { city: "Kansas City", state: "MO" },
  { city: "St. Louis", state: "MO" },
  // Wisconsin
  { city: "Milwaukee", state: "WI" },
  { city: "Madison", state: "WI" },
  // Colorado
  { city: "Denver", state: "CO" },
  { city: "Colorado Springs", state: "CO" },
  // Minnesota
  { city: "Minneapolis", state: "MN" },
  { city: "St. Paul", state: "MN" },
  // South Carolina
  { city: "Charleston", state: "SC" },
  { city: "Columbia", state: "SC" },
  // Alabama
  { city: "Birmingham", state: "AL" },
  { city: "Huntsville", state: "AL" },
  { city: "Mobile", state: "AL" },
  // Louisiana
  { city: "New Orleans", state: "LA" },
  { city: "Baton Rouge", state: "LA" },
];

// Search terms — one per category for even mix, cycled through cities
const SEARCH_TERMS = [
  // Water Damage Restoration
  "water damage restoration",
  // Flood Cleanup
  "flood cleanup services",
  // Mold Remediation
  "mold remediation",
  // Emergency Services
  "emergency water damage 24 hour",
  // Storm Damage Repair
  "storm damage repair",
];

// ============================================================================
// Helpers
// ============================================================================

let idCounter = 0;
function generateId(): string {
  idCounter++;
  return `biz-${Date.now()}-${idCounter.toString().padStart(5, "0")}`;
}

function generateSlug(name: string, city: string, state: string): string {
  const base = `${name} ${city} ${state}`;
  return slugify(base, { lower: true, strict: true, trim: true });
}

function normalizeHours(
  hours: Record<string, any> | undefined
): Record<string, string> | null {
  if (!hours || typeof hours !== "object" || Object.keys(hours).length === 0) return null;

  const normalized: Record<string, string> = {};
  const dayMap: Record<string, string> = {
    Monday: "monday",
    Tuesday: "tuesday",
    Wednesday: "wednesday",
    Thursday: "thursday",
    Friday: "friday",
    Saturday: "saturday",
    Sunday: "sunday",
  };

  for (const [key, value] of Object.entries(hours)) {
    const normalizedKey = dayMap[key] || key.toLowerCase();
    if (Array.isArray(value)) {
      normalized[normalizedKey] = value.join(", ");
    } else {
      normalized[normalizedKey] = String(value);
    }
  }

  return normalized;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadExistingBusinesses(): LocalBusiness[] {
  try {
    if (fs.existsSync(BUSINESSES_FILE)) {
      const raw = fs.readFileSync(BUSINESSES_FILE, "utf-8");
      const data = JSON.parse(raw);
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.log("Could not load existing businesses.json, starting fresh.");
  }
  return [];
}

function saveBusinesses(data: LocalBusiness[]): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(BUSINESSES_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// Normalize subtypes — API may return string or array
function normalizeSubtypes(subtypes: string[] | string | undefined): string[] {
  if (!subtypes) return [];
  if (Array.isArray(subtypes)) return subtypes;
  if (typeof subtypes === "string") return subtypes.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

// Categorize business based on its subtypes/name
function assignCategory(place: OutscraperPlace): string {
  const name = (place.name || "").toLowerCase();
  const subtypes = normalizeSubtypes(place.subtypes).map((s) => s.toLowerCase()).join(" ");
  const desc = (place.description || "").toLowerCase();
  const combined = `${name} ${subtypes} ${desc}`;

  if (combined.includes("mold")) return "cat-mold-remediation";
  if (combined.includes("flood")) return "cat-flood-cleanup";
  if (combined.includes("storm") || combined.includes("wind") || combined.includes("hail"))
    return "cat-storm-damage";
  if (combined.includes("emergency") || combined.includes("24/7") || combined.includes("24 hour"))
    return "cat-emergency-services";
  return "cat-water-damage-restoration";
}

// Transform reviews data from Outscraper format to our format
function transformReviews(
  reviewsData: OutscraperPlace["reviews_data"]
): LocalBusiness["reviewsData"] {
  if (!reviewsData || !Array.isArray(reviewsData)) return [];

  return reviewsData.map((r) => ({
    reviewId: r.review_id || null,
    authorName: r.author_title || null,
    authorId: r.author_id || null,
    authorImage: r.author_image || null,
    authorLink: r.author_link || null,
    text: r.review_text || null,
    imageUrls: r.review_img_urls || [],
    ownerAnswer: r.owner_answer || null,
    ownerAnswerTimestamp: r.owner_answer_timestamp || null,
    reviewLink: r.review_link || null,
    rating: r.review_rating || 0,
    timestamp: r.review_timestamp || null,
    datetimeUtc: r.review_datetime_utc || null,
    likes: r.review_likes || 0,
  }));
}

// Transform popular times from Outscraper format
function transformPopularTimes(
  pt: OutscraperPlace["popular_times"]
): LocalBusiness["popularTimes"] {
  if (!pt || !Array.isArray(pt)) return [];

  return pt
    .filter((d) => d.day)
    .map((d) => ({
      day: d.day!,
      hours: (d.hours || []).map((h) => ({
        hour: h.hour || 0,
        percentage: h.percentage || 0,
      })),
    }));
}

// Collect all photo URLs from the place
function collectPhotos(place: OutscraperPlace): string[] {
  const photos: string[] = [];

  // Main photo
  if (place.photo) photos.push(place.photo);

  // Additional photos array (if provided by API)
  if (place.photos && Array.isArray(place.photos)) {
    for (const p of place.photos) {
      if (p && !photos.includes(p)) photos.push(p);
    }
  }

  // Street view as bonus
  if (place.street_view && !photos.includes(place.street_view)) {
    photos.push(place.street_view);
  }

  return photos;
}

// ============================================================================
// Outscraper API
// ============================================================================

async function fetchFromOutscraper(
  query: string,
  limit: number,
  retries = 0
): Promise<OutscraperPlace[]> {
  const params = new URLSearchParams({
    query,
    limit: limit.toString(),
    language: "en",
    region: "US",
    async: "false",
    drop_duplicates: "true",
    // Request enriched fields
    fields: [
      "name", "place_id", "google_id", "cid",
      "full_address", "street", "borough", "city", "state", "us_state",
      "postal_code", "country", "country_code", "area_service",
      "latitude", "longitude", "location_link", "plus_code",
      "phone", "site",
      "type", "subtypes", "category", "description", "about",
      "rating", "reviews", "reviews_per_score", "reviews_link", "reviews_tags",
      "photo", "photos_count", "street_view", "logo",
      "working_hours", "working_hours_old_format",
      "business_status", "verified",
      "owner_id", "owner_title", "owner_link",
      "price_level", "range",
      "popular_times",
      "reservation_link", "menu_link", "order_links",
      "located_in", "located_google_id",
    ].join(","),
  });

  const url = `${API_BASE}/maps/search-v3?${params}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-API-KEY": OUTSCRAPER_API_KEY!,
        Accept: "application/json",
      },
    });

    if (response.status === 429) {
      console.log("  Rate limited. Waiting 30s...");
      await sleep(30000);
      if (retries < MAX_RETRIES) {
        return fetchFromOutscraper(query, limit, retries + 1);
      }
      return [];
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    // Response format: [[results for query 1]] for single query
    if (Array.isArray(data) && data.length > 0) {
      if (Array.isArray(data[0])) {
        return data[0] as OutscraperPlace[];
      }
      if (typeof data[0] === "object" && data[0] !== null && "name" in data[0]) {
        return data as OutscraperPlace[];
      }
    }

    // Handle { data: [[...]] } wrapper
    if (data && data.data && Array.isArray(data.data)) {
      if (Array.isArray(data.data[0])) {
        return data.data[0] as OutscraperPlace[];
      }
      return data.data as OutscraperPlace[];
    }

    console.log("  Unexpected response format:", JSON.stringify(data).slice(0, 200));
    return [];
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (retries < MAX_RETRIES) {
      console.log(`  Request failed: ${message}. Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await sleep(RETRY_DELAY_MS);
      return fetchFromOutscraper(query, limit, retries + 1);
    }
    throw err;
  }
}

// ============================================================================
// Transform Outscraper place -> LocalBusiness
// ============================================================================

function transformPlace(
  place: OutscraperPlace,
  fallbackCity: string,
  fallbackState: string,
  seenSlugs: Set<string>
): LocalBusiness | null {
  if (!place.place_id || !place.name) return null;

  // Skip non-US
  if (
    place.country_code &&
    place.country_code !== "US" &&
    place.country_code !== "USA"
  ) {
    return null;
  }

  // Skip permanently closed
  if (
    place.business_status &&
    place.business_status !== "OPERATIONAL" &&
    place.business_status !== "CLOSED_TEMPORARILY"
  ) {
    return null;
  }

  const bizCity = place.city || fallbackCity;
  const bizState = place.us_state || place.state || fallbackState;

  // Generate unique slug
  let slug = generateSlug(place.name, bizCity, bizState);
  let suffix = 1;
  let finalSlug = slug;
  while (seenSlugs.has(finalSlug)) {
    finalSlug = `${slug}-${suffix}`;
    suffix++;
  }
  slug = finalSlug;

  const hours = normalizeHours(place.working_hours);
  const photos = collectPhotos(place);
  const reviews = transformReviews(place.reviews_data);
  const popularTimes = transformPopularTimes(place.popular_times);

  return {
    // Core
    id: generateId(),
    googlePlaceId: place.place_id,
    googleId: place.google_id || null,
    cid: place.cid || null,
    name: place.name,
    slug,

    // Address
    description: place.description || null,
    address: place.full_address || place.street || "Address not available",
    street: place.street || null,
    city: bizCity,
    state: bizState,
    zip: place.postal_code || null,
    country: place.country || "United States",
    countryCode: place.country_code || "US",
    neighborhood: place.borough || null,
    areaService: place.area_service || false,

    // Contact
    phone: place.phone || null,
    website: place.site || null,
    email: place.email || null,

    // Location
    lat: place.latitude?.toString() || null,
    lng: place.longitude?.toString() || null,
    plusCode: place.plus_code || null,
    googleMapsUrl: place.location_link || null,

    // Classification
    type: place.type || null,
    subtypes: normalizeSubtypes(place.subtypes),
    googleCategory: place.category || null,
    categoryId: assignCategory(place),

    // About / amenities
    about: place.about || null,

    // Ratings & Reviews
    ratingAvg: place.rating?.toFixed(2) || "0",
    reviewCount: place.reviews || 0,
    reviewsPerScore: place.reviews_per_score || null,
    reviewsLink: place.reviews_link || null,
    reviewsTags: Array.isArray(place.reviews_tags) ? place.reviews_tags : place.reviews_tags ? [place.reviews_tags] : [],
    reviewsData: reviews,

    // Photos
    photos,
    photosCount: place.photos_count || photos.length,
    streetView: place.street_view || null,
    logo: place.logo || null,

    // Business status & ownership
    businessStatus: place.business_status || null,
    isVerified: place.verified || false,
    isFeatured: false,
    ownerId: place.owner_id || null,
    ownerTitle: place.owner_title || null,
    ownerLink: place.owner_link || null,

    // Hours
    hours,
    hoursRaw: (place.working_hours as Record<string, string[]> | null) || null,
    hoursOldFormat: place.working_hours_old_format || null,

    // Price
    priceLevel: place.price_level || null,
    priceRange: place.range || null,

    // Popular times
    popularTimes,

    // Links
    reservationLink: place.reservation_link || null,
    menuLink: place.menu_link || null,
    orderLinks: Array.isArray(place.order_links) ? place.order_links : place.order_links ? [place.order_links] : [],

    // Location context
    locatedIn: place.located_in || null,
    locatedGoogleId: place.located_google_id || null,

    // Social media
    facebook: place.facebook || null,
    instagram: place.instagram || null,
    twitter: place.twitter || null,
    linkedin: place.linkedin || null,

    // Timestamps
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log("============================================");
  console.log("  Outscraper -> Local JSON Sync (Full Data)");
  console.log("============================================\n");
  console.log(`Target:    ~${TARGET_BUSINESSES} businesses`);
  console.log(`Cities:    ${TOP_CITIES.length}`);
  console.log(`Terms:     ${SEARCH_TERMS.length}`);
  console.log(`Per query: ${LIMIT_PER_QUERY}`);
  console.log(`Output:    ${BUSINESSES_FILE}\n`);

  // Load existing data (for resume support)
  const existingBusinesses = loadExistingBusinesses();
  const allBusinesses: LocalBusiness[] = [...existingBusinesses];

  // Track duplicates
  const seenPlaceIds = new Set<string>();
  const seenSlugs = new Set<string>();

  for (const biz of existingBusinesses) {
    if (biz.googlePlaceId) seenPlaceIds.add(biz.googlePlaceId);
    if (biz.slug) seenSlugs.add(biz.slug);
  }

  console.log(`Existing businesses loaded: ${existingBusinesses.length}`);
  if (existingBusinesses.length >= TARGET_BUSINESSES) {
    console.log("Already have enough businesses. Nothing to do.");
    return;
  }

  // Stats
  let totalNew = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  let totalApiCalls = 0;

  // Rotate search terms per city for even category mix
  // E.g. City1+Term1, City1+Term2, ..., City2+Term1, City2+Term2, ...
  for (let i = 0; i < TOP_CITIES.length; i++) {
    if (existingBusinesses.length + totalNew >= TARGET_BUSINESSES) {
      console.log(`\nReached target of ${TARGET_BUSINESSES}. Stopping.`);
      break;
    }

    const { city, state } = TOP_CITIES[i];
    console.log(`\n--- City ${i + 1}/${TOP_CITIES.length}: ${city}, ${state} ---`);

    for (const searchTerm of SEARCH_TERMS) {
      if (existingBusinesses.length + totalNew >= TARGET_BUSINESSES) break;

      const query = `${searchTerm} ${city} ${state}`;

      console.log(`[${totalApiCalls + 1}] "${query}"`);

      try {
        const results = await fetchFromOutscraper(query, LIMIT_PER_QUERY);
        totalApiCalls++;
        console.log(`  Found ${results.length} results`);

        let batchNew = 0;
        let batchSkipped = 0;

        for (const place of results) {
          try {
            if (!place.place_id || !place.name) {
              batchSkipped++;
              continue;
            }

            if (seenPlaceIds.has(place.place_id)) {
              batchSkipped++;
              continue;
            }

            const business = transformPlace(place, city, state, seenSlugs);
            if (!business) {
              batchSkipped++;
              continue;
            }

            allBusinesses.push(business);
            seenPlaceIds.add(place.place_id);
            seenSlugs.add(business.slug);
            batchNew++;
            totalNew++;
          } catch (transformErr: unknown) {
            const tmsg = transformErr instanceof Error ? transformErr.message : String(transformErr);
            console.error(`  Transform error for "${place.name}": ${tmsg}`);
            batchSkipped++;
          }
        }

        totalSkipped += batchSkipped;
        console.log(
          `  Added: ${batchNew} | Skipped: ${batchSkipped} | Total: ${existingBusinesses.length + totalNew}/${TARGET_BUSINESSES}`
        );

        // Save after each city (resume-safe)
        saveBusinesses(allBusinesses);

        // Rate limiting
        await sleep(DELAY_BETWEEN_REQUESTS_MS);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`  API Error: ${msg}`);
        totalErrors++;
        // Save what we have so far
        saveBusinesses(allBusinesses);
        await sleep(RETRY_DELAY_MS);
      }
    } // end search terms loop
  } // end cities loop

  // Final save
  saveBusinesses(allBusinesses);

  console.log("\n============================================");
  console.log("  Sync Complete");
  console.log("============================================");
  console.log(`API calls:     ${totalApiCalls}`);
  console.log(`New added:     ${totalNew}`);
  console.log(`Skipped:       ${totalSkipped}`);
  console.log(`Errors:        ${totalErrors}`);
  console.log(`Total in file: ${allBusinesses.length}`);
  console.log(`Saved to:      ${BUSINESSES_FILE}`);
  console.log("============================================\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
