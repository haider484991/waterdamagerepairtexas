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

export function mapGoogleCategoryToWaterDamage(types: string[], businessName: string): string | null {
  const nameLower = businessName.toLowerCase();

  // Check business name for water damage keywords first
  if (nameLower.includes("water damage") || nameLower.includes("restoration") || nameLower.includes("flood")) {
    if (nameLower.includes("mold") || nameLower.includes("remediation")) {
      return "mold-remediation";
    }
    if (nameLower.includes("emergency") || nameLower.includes("24") || nameLower.includes("rapid")) {
      return "emergency-water-removal";
    }
    if (nameLower.includes("flood") || nameLower.includes("storm")) {
      return "flood-damage-restoration";
    }
    if (nameLower.includes("dry") || nameLower.includes("dehumidif")) {
      return "structural-drying-services";
    }
    // Default to water damage restoration
    return "water-damage-restoration";
  }

  // Map Google types to water damage categories
  const categoryMapping: Record<string, string> = {
    plumber: "water-damage-restoration",
    contractor: "water-damage-restoration",
    general_contractor: "water-damage-restoration",
    home_improvement_store: "water-damage-restoration",
    roofing_contractor: "flood-damage-restoration",
    fire_damage_restoration_service: "water-damage-restoration",
    water_damage_restoration_service: "water-damage-restoration",
  };

  for (const type of types) {
    if (categoryMapping[type]) {
      return categoryMapping[type];
    }
  }

  return null;
}

