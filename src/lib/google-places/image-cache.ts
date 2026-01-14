/**
 * Google Places Image Cache System
 * 
 * Resolves Google photo references to actual image URLs and caches them
 * in the database to reduce API calls.
 * 
 * Google's Photo API returns photo_references that need to be converted
 * to actual URLs via an API call. This module:
 * 1. Checks if we have a cached URL for a photo reference
 * 2. If not, fetches from Google and caches the resolved URL
 * 3. Returns the cached URL for future requests
 */

import { db, businesses } from "@/lib/db";
import { eq } from "drizzle-orm";

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const GOOGLE_PLACES_BASE_URL = "https://maps.googleapis.com/maps/api/place";

// Cache duration: 7 days in milliseconds
export const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Check if a business's cached data is still valid
 */
export function isCacheValid(lastEnrichedAt: Date | null): boolean {
    if (!lastEnrichedAt) return false;
    const age = Date.now() - new Date(lastEnrichedAt).getTime();
    return age < CACHE_DURATION_MS;
}

/**
 * Resolve a Google photo reference to an actual image URL.
 * Google's Photo API returns a redirect, so we follow it to get the final URL.
 */
export async function resolvePhotoUrl(
    photoReference: string,
    maxWidth: number = 800
): Promise<string | null> {
    if (!GOOGLE_PLACES_API_KEY || !photoReference) return null;

    try {
        const url = `${GOOGLE_PLACES_BASE_URL}/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`;

        // Use a HEAD request to follow redirects without downloading the full image
        const response = await fetch(url, {
            method: "HEAD",
            redirect: "follow",
        });

        if (response.ok) {
            // The final URL after redirects is the actual image URL
            return response.url;
        }
        return null;
    } catch (error) {
        console.error("[Image Cache] Error resolving photo URL:", error);
        return null;
    }
}

/**
 * Resolve multiple photo references to URLs
 */
export async function resolvePhotoUrls(
    photoReferences: string[],
    maxWidth: number = 800
): Promise<string[]> {
    if (!GOOGLE_PLACES_API_KEY || photoReferences.length === 0) return [];

    const resolvedUrls: string[] = [];

    // Process in sequence to avoid rate limiting
    for (const ref of photoReferences.slice(0, 10)) { // Max 10 photos
        const url = await resolvePhotoUrl(ref, maxWidth);
        if (url) {
            resolvedUrls.push(url);
        }
        // Small delay between requests
        await new Promise((r) => setTimeout(r, 50));
    }

    return resolvedUrls;
}

/**
 * Interface for Google Place details used for caching
 */
export interface CacheableGoogleData {
    photos?: Array<{ photo_reference: string }>;
    rating?: number;
    user_ratings_total?: number;
    price_level?: number;
    opening_hours?: {
        open_now?: boolean;
        weekday_text?: string[];
    };
    website?: string;
    formatted_phone_number?: string;
    url?: string; // Google Maps URL
    reviews?: Array<{
        author_name: string;
        rating: number;
        text: string;
        relative_time_description: string;
        time: number;
        profile_photo_url?: string;
    }>;
}

/**
 * Format Google's weekday_text to our hours format
 */
function formatHours(weekdayText?: string[]): Record<string, string> | null {
    if (!weekdayText) return null;

    const dayMap: Record<string, string> = {
        Monday: "monday",
        Tuesday: "tuesday",
        Wednesday: "wednesday",
        Thursday: "thursday",
        Friday: "friday",
        Saturday: "saturday",
        Sunday: "sunday",
    };

    const hours: Record<string, string> = {};

    for (const line of weekdayText) {
        const colonIndex = line.indexOf(":");
        if (colonIndex === -1) continue;

        const day = line.substring(0, colonIndex).trim();
        const time = line.substring(colonIndex + 1).trim();

        const dayKey = dayMap[day];
        if (dayKey) {
            hours[dayKey] = time;
        }
    }

    return Object.keys(hours).length > 0 ? hours : null;
}

/**
 * Save Google Places data to the database cache
 */
export async function cacheGoogleData(
    businessId: string,
    googleData: CacheableGoogleData,
    resolveImages: boolean = true
): Promise<void> {
    try {
        // Resolve photo references to actual URLs if requested
        let cachedImageUrls: string[] = [];
        if (resolveImages && googleData.photos && googleData.photos.length > 0) {
            const photoRefs = googleData.photos.map((p) => p.photo_reference);
            cachedImageUrls = await resolvePhotoUrls(photoRefs);
        }

        // Format reviews for caching
        const cachedReviews = googleData.reviews?.map((review) => ({
            authorName: review.author_name,
            rating: review.rating,
            text: review.text,
            relativeTime: review.relative_time_description,
            time: review.time,
            authorPhoto: review.profile_photo_url,
        })) || [];

        // Update the business with cached data
        await db
            .update(businesses)
            .set({
                cachedImageUrls: cachedImageUrls.length > 0 ? cachedImageUrls : undefined,
                cachedPhone: googleData.formatted_phone_number || undefined,
                cachedWebsite: googleData.website || undefined,
                cachedHours: formatHours(googleData.opening_hours?.weekday_text),
                cachedReviews: cachedReviews.length > 0 ? cachedReviews : undefined,
                googleMapsUrl: googleData.url || undefined,
                ratingAvg: googleData.rating?.toString() || undefined,
                reviewCount: googleData.user_ratings_total || undefined,
                priceLevel: googleData.price_level ?? undefined,
                lastEnrichedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(businesses.id, businessId));

        console.log(`[Image Cache] Cached data for business ${businessId}`);
    } catch (error) {
        console.error("[Image Cache] Error caching Google data:", error);
        throw error;
    }
}

/**
 * Get cached image URLs for a business, or resolve and cache if not available
 */
export async function getCachedOrResolveImages(
    businessId: string,
    googlePlaceId: string | null,
    existingPhotoRefs: string[],
    lastEnrichedAt: Date | null,
    existingCachedUrls?: string[]
): Promise<string[]> {
    // If we have valid cached URLs, return them
    if (existingCachedUrls && existingCachedUrls.length > 0 && isCacheValid(lastEnrichedAt)) {
        return existingCachedUrls;
    }

    // If we have photo references but no cached URLs, resolve them
    if (existingPhotoRefs && existingPhotoRefs.length > 0) {
        const resolvedUrls = await resolvePhotoUrls(existingPhotoRefs);

        if (resolvedUrls.length > 0) {
            // Cache the resolved URLs in the background
            db.update(businesses)
                .set({
                    cachedImageUrls: resolvedUrls,
                    lastEnrichedAt: new Date(),
                    updatedAt: new Date(),
                })
                .where(eq(businesses.id, businessId))
                .catch((err) => console.error("[Image Cache] Failed to save cached URLs:", err));
        }

        return resolvedUrls;
    }

    // Return empty if no photos available
    return [];
}

/**
 * Get the best available image URL for display
 * Prefers cached URLs, falls back to photo references with proxy
 */
export function getBestImageUrl(
    cachedImageUrls: string[] | null | undefined,
    photoRefs: string[] | null | undefined,
    index: number = 0,
    width: number = 400
): string {
    const placeholder = `https://placehold.co/${width}x${Math.floor(width * 0.75)}/f5f5f4/a3a3a3?text=No+Image`;

    // Try cached URL first
    if (cachedImageUrls && cachedImageUrls[index]) {
        return cachedImageUrls[index];
    }

    // Fall back to photo reference (will use proxy API)
    if (photoRefs && photoRefs[index]) {
        return `/api/images?ref=${photoRefs[index]}&maxwidth=${width}`;
    }

    return placeholder;
}
