const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const GOOGLE_PLACES_BASE_URL = "https://maps.googleapis.com/maps/api/place";

export interface GooglePlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  types?: string[];
  formatted_phone_number?: string;
  website?: string;
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: number;
  }>;
}

export interface PlaceSearchParams {
  query: string;
  location?: string;
  radius?: number;
  type?: string;
}

export async function searchPlaces(params: PlaceSearchParams): Promise<GooglePlaceResult[]> {
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn("Google Places API key not configured");
    return [];
  }

  const { query, location, radius = 25000, type } = params;
  
  const searchParams = new URLSearchParams({
    query,
    key: GOOGLE_PLACES_API_KEY,
  });

  if (location) {
    searchParams.append("location", location);
    searchParams.append("radius", radius.toString());
  }

  if (type) {
    searchParams.append("type", type);
  }

  try {
    const response = await fetch(
      `${GOOGLE_PLACES_BASE_URL}/textsearch/json?${searchParams.toString()}`
    );
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("Error searching Google Places:", error);
    return [];
  }
}

export async function getPlaceDetails(placeId: string): Promise<GooglePlaceResult | null> {
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn("Google Places API key not configured");
    return null;
  }

  const fields = [
    "place_id",
    "name",
    "formatted_address",
    "geometry",
    "rating",
    "user_ratings_total",
    "price_level",
    "opening_hours",
    "photos",
    "formatted_phone_number",
    "website",
    "reviews",
    "types",
  ].join(",");

  try {
    const response = await fetch(
      `${GOOGLE_PLACES_BASE_URL}/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_PLACES_API_KEY}`
    );
    const data = await response.json();
    return data.result || null;
  } catch (error) {
    console.error("Error getting place details:", error);
    return null;
  }
}

export function getPhotoUrl(photoReference: string, maxWidth = 400): string {
  if (!GOOGLE_PLACES_API_KEY) return "/images/placeholder-business.jpg";
  return `${GOOGLE_PLACES_BASE_URL}/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`;
}

export function parseHoursFromGoogle(weekdayText?: string[]): Record<string, string> {
  if (!weekdayText) return {};
  
  const hours: Record<string, string> = {};
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  
  weekdayText.forEach((text) => {
    const match = text.match(/^(\w+):\s*(.+)$/);
    if (match) {
      const day = match[1].toLowerCase();
      if (days.includes(day)) {
        hours[day] = match[2];
      }
    }
  });
  
  return hours;
}

export function mapGoogleCategoryToPickleball(types: string[], businessName: string): string | null {
  const nameLower = businessName.toLowerCase();
  
  // Check business name for pickleball keywords first
  if (nameLower.includes("pickleball")) {
    if (nameLower.includes("club") || nameLower.includes("league") || nameLower.includes("association")) {
      return "pickleball-clubs-leagues";
    }
    if (nameLower.includes("shop") || nameLower.includes("store") || nameLower.includes("equipment") || nameLower.includes("gear")) {
      return "pickleball-equipment-stores";
    }
    if (nameLower.includes("coach") || nameLower.includes("instructor") || nameLower.includes("lesson") || nameLower.includes("academy")) {
      return "pickleball-coaches-instructors";
    }
    if (nameLower.includes("tournament") || nameLower.includes("event") || nameLower.includes("championship")) {
      return "pickleball-tournaments-events";
    }
    // Default to courts & facilities if pickleball is mentioned
    return "pickleball-courts-facilities";
  }
  
  // Map Google types to pickleball categories
  const categoryMapping: Record<string, string> = {
    stadium: "pickleball-courts-facilities",
    gym: "pickleball-courts-facilities",
    recreation_center: "pickleball-courts-facilities",
    sports_complex: "pickleball-courts-facilities",
    athletic_field: "pickleball-courts-facilities",
    community_center: "pickleball-courts-facilities",
    sporting_goods_store: "pickleball-equipment-stores",
    store: "pickleball-equipment-stores",
    school: "pickleball-coaches-instructors",
    event_venue: "pickleball-tournaments-events",
  };

  for (const type of types) {
    if (categoryMapping[type]) {
      return categoryMapping[type];
    }
  }
  
  return null;
}

