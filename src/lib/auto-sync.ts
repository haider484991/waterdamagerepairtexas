/**
 * Auto-Sync System
 * 
 * Automatically saves Google Places results to the database to:
 * 1. Reduce Google API calls (rate limiting)
 * 2. Improve response times for subsequent searches
 * 3. Build up the local database organically from user searches
 * 
 * Flow:
 * - User searches for something
 * - If DB has no results, fetch from Google
 * - Auto-save Google results to DB in background
 * - Next search returns DB results (fast, no API call)
 */

import { db, businesses, categories } from "@/lib/db";
import { eq } from "drizzle-orm";
import slugify from "slugify";

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// Parse city and state from Google Places formatted address
function parseCityState(formattedAddress: string): { city: string; state: string; zip: string | null } {
  const parts = formattedAddress.split(",").map(p => p.trim());
  let city = "Unknown";
  let state = "XX";
  let zip: string | null = null;
  
  if (parts.length >= 3) {
    const stateZipPart = parts[parts.length - 2] || parts[parts.length - 1];
    const stateMatch = stateZipPart.match(/\b([A-Z]{2})\b/);
    if (stateMatch) state = stateMatch[1];
    const zipMatch = stateZipPart.match(/\b(\d{5})(?:-\d{4})?\b/);
    if (zipMatch) zip = zipMatch[1];
    const cityPart = parts[parts.length - 3];
    if (cityPart && !cityPart.match(/^\d/)) city = cityPart;
  }
  
  return { city, state, zip };
}

export interface GooglePlaceResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  vicinity?: string;
  geometry: { location: { lat: number; lng: number } };
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  types?: string[];
  photos?: Array<{ photo_reference: string }>;
  opening_hours?: { open_now?: boolean };
}

export interface SavedBusiness {
  id: string;
  googlePlaceId: string;
  name: string;
  slug: string;
  isNew: boolean;
}

/**
 * Generate a unique slug for a business
 */
async function generateUniqueSlug(name: string): Promise<string> {
  const baseSlug = slugify(name, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(eq(businesses.slug, slug))
      .limit(1);

    if (existing.length === 0) break;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Save a single Google Place to the database
 * Returns null if already exists, or the saved business
 */
export async function saveGooglePlaceToDb(
  place: GooglePlaceResult,
  categoryId?: string
): Promise<SavedBusiness | null> {
  try {
    // Check if already exists
    const existing = await db
      .select({ id: businesses.id, slug: businesses.slug })
      .from(businesses)
      .where(eq(businesses.googlePlaceId, place.place_id))
      .limit(1);

    if (existing.length > 0) {
      return {
        id: existing[0].id,
        googlePlaceId: place.place_id,
        name: place.name,
        slug: existing[0].slug,
        isNew: false,
      };
    }

    // Generate unique slug
    const slug = await generateUniqueSlug(place.name);

    // Parse address to extract city and state
    const address = place.formatted_address || place.vicinity || "";
    const addressParts = address.split(",").map((p) => p.trim());
    const { city, state, zip } = parseCityState(address);

    // Get first photo reference
    const photoRef = place.photos?.[0]?.photo_reference || null;

    // Insert into database - auto-approve API businesses
    const [inserted] = await db
      .insert(businesses)
      .values({
        googlePlaceId: place.place_id,
        name: place.name,
        slug,
        address: addressParts[0] || address,
        city,
        state,
        zip,
        lat: place.geometry.location.lat.toString(),
        lng: place.geometry.location.lng.toString(),
        categoryId: categoryId || null,
        ratingAvg: place.rating?.toString() || "0",
        reviewCount: place.user_ratings_total || 0,
        priceLevel: place.price_level ?? null,
        photos: photoRef ? [photoRef] : [],
        isVerified: true, // Auto-approve businesses from API
        isFeatured: (place.rating || 0) >= 4.5 && (place.user_ratings_total || 0) >= 50,
      })
      .returning({ id: businesses.id });

    console.log(`[Auto-Sync] Saved new business: ${place.name}`);

    return {
      id: inserted.id,
      googlePlaceId: place.place_id,
      name: place.name,
      slug,
      isNew: true,
    };
  } catch (error) {
    console.error(`[Auto-Sync] Error saving ${place.name}:`, error);
    return null;
  }
}

/**
 * Auto-save multiple Google Places to the database
 * Runs in background, doesn't block the response
 */
export async function autoSyncGooglePlaces(
  places: GooglePlaceResult[],
  categoryId?: string
): Promise<{ saved: number; skipped: number; errors: number }> {
  let saved = 0;
  let skipped = 0;
  let errors = 0;

  for (const place of places) {
    try {
      const result = await saveGooglePlaceToDb(place, categoryId);
      if (result) {
        if (result.isNew) {
          saved++;
        } else {
          skipped++;
        }
      } else {
        errors++;
      }
    } catch {
      errors++;
    }
  }

  console.log(`[Auto-Sync] Complete: ${saved} saved, ${skipped} skipped, ${errors} errors`);
  return { saved, skipped, errors };
}

/**
 * Search Google Places and auto-save results
 */
export async function searchAndSync(
  query: string,
  categoryId?: string
): Promise<GooglePlaceResult[]> {
  if (!GOOGLE_PLACES_API_KEY) return [];

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
    url.searchParams.set("query", `${query} water damage restoration Texas`);
    url.searchParams.set("key", GOOGLE_PLACES_API_KEY);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== "OK" || !data.results) {
      console.log(`[Auto-Sync] Google returned ${data.status} for "${query}"`);
      return [];
    }

    const places: GooglePlaceResult[] = data.results;

    // Auto-save in background (don't await to not slow down response)
    autoSyncGooglePlaces(places, categoryId).catch((err) =>
      console.error("[Auto-Sync] Background sync error:", err)
    );

    return places;
  } catch (error) {
    console.error("[Auto-Sync] Search error:", error);
    return [];
  }
}

/**
 * Get category ID by slug, create if doesn't exist
 */
export async function getOrCreateCategory(
  slug: string,
  name?: string
): Promise<string | null> {
  try {
    // Try to find existing
    const [existing] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);

    if (existing) return existing.id;

    // Create new category if name provided
    if (name) {
      const [created] = await db
        .insert(categories)
        .values({
          name,
          slug,
          icon: "MapPin",
          description: `${name} - Water damage restoration services across Texas`,
          section: "Restoration",
          displayOrder: 99,
        })
        .returning({ id: categories.id });

      console.log(`[Auto-Sync] Created new category: ${name}`);
      return created.id;
    }

    return null;
  } catch (error) {
    console.error("[Auto-Sync] Category error:", error);
    return null;
  }
}

/**
 * Water damage category to Google search queries mapping
 */
export const categorySearchQueries: Record<string, string[]> = {
  "water-damage-restoration": [
    "water damage restoration Texas",
    "water damage repair Texas",
    "water extraction services",
    "flood restoration company",
  ],
  "flood-cleanup": [
    "flood cleanup Texas",
    "flood damage restoration",
    "emergency flood service",
    "water removal service",
  ],
  "mold-remediation": [
    "mold remediation Texas",
    "mold removal service",
    "mold inspection",
    "mold testing",
  ],
  "emergency-services": [
    "24 hour water damage Texas",
    "emergency restoration service",
    "emergency water extraction",
  ],
  "storm-damage": [
    "storm damage repair Texas",
    "hurricane damage restoration",
    "wind damage repair",
    "hail damage restoration",
  ],
};

