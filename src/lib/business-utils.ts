/**
 * Shared Business Utilities
 * 
 * These utilities are safe for use in Client Components.
 * They do NOT contain any database or server-only logic.
 */

/**
 * Format Google's weekday_text to our hours format
 */
export function formatHours(weekdayText?: string[]): Record<string, string> | null {
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
 * Get image URL from photo reference
 * Returns placeholder if no photo
 */
export function getImageUrl(
    photo: string | null | undefined,
    width = 400
): string {
    const placeholder = `https://placehold.co/${width}x${Math.floor(width * 0.75)}/f5f5f4/a3a3a3?text=No+Image`;

    if (!photo) return placeholder;

    // Already a full URL
    if (photo.startsWith("http")) {
        // Extract Google photo reference if present
        if (photo.includes("photo_reference=")) {
            const match = photo.match(/photo_reference=([^&]+)/);
            if (match) {
                return `/api/images?ref=${match[1]}&maxwidth=${width}`;
            }
        }
        return photo;
    }

    // Local placeholder path
    if (photo.startsWith("/images/")) return placeholder;

    // Photo reference - use proxy
    return `/api/images?ref=${photo}&maxwidth=${width}`;
}

/**
 * Shape a full business record down to just the fields BusinessCard renders.
 *
 * BusinessCard is a client component, so every business handed to it gets
 * serialised into the RSC flight payload. The scraped records carry
 * `reviewsData` (six full review bodies), eight `photos`, `reviewsPerScore`,
 * `about` and `plusCode` — none of which the card displays. On a big city page
 * that was tens of kilobytes of dead JSON per screenful.
 */
export function toCardBusiness<
    T extends {
        id: string;
        name: string;
        slug: string;
        address: string;
        city: string;
        state: string;
    },
>(business: T) {
    const b = business as T & Record<string, unknown>;
    return {
        id: b.id,
        name: b.name,
        slug: b.slug,
        address: b.address,
        city: b.city,
        state: b.state,
        description: (b.description ?? null) as string | null,
        neighborhood: (b.neighborhood ?? null) as string | null,
        // The card only ever renders photos[0].
        photos: Array.isArray(b.photos) && b.photos.length > 0 ? [b.photos[0] as string] : null,
        priceLevel: (b.priceLevel ?? null) as number | null,
        ratingAvg: (b.ratingAvg ?? null) as string | null,
        reviewCount: (b.reviewCount ?? null) as number | null,
        isVerified: (b.isVerified ?? null) as boolean | null,
        isFeatured: (b.isFeatured ?? null) as boolean | null,
        // No `isOpenNow` / `hours`: the card no longer shows an open/closed
        // badge (it was a guess), and nothing else on the card reads hours.
        googlePlaceId: (b.googlePlaceId ?? null) as string | null,
        logo: (b.logo ?? null) as string | null,
        category: (b.category ?? null) as
            | { name: string; slug: string; section?: string | null }
            | null,
    };
}
