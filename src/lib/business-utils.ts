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
 * Check if a business is currently open
 */
export function isBusinessOpen(hours: Record<string, string> | null): boolean {
    if (!hours) return false;

    const now = new Date();
    const days = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
    ];
    const currentDay = days[now.getDay()];
    const todayHours = hours[currentDay];

    if (!todayHours || todayHours.toLowerCase() === "closed") return false;

    // Simple check - for production, parse time ranges properly
    return true;
}
