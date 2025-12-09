import { NextResponse } from "next/server";

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export interface GooglePlaceDetails {
  place_id: string;
  name: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  url?: string; // Google Maps URL
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
    periods?: Array<{
      open: { day: number; time: string };
      close?: { day: number; time: string };
    }>;
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  reviews?: Array<{
    author_name: string;
    author_url?: string;
    profile_photo_url?: string;
    rating: number;
    relative_time_description: string;
    text: string;
    time: number;
  }>;
  types?: string[];
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

interface PlaceDetailsResponse {
  result?: GooglePlaceDetails;
  status: string;
  error_message?: string;
}

// Fetch full details from Google Places API
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get("placeId");
    
    // Fields to fetch (optimized to reduce costs)
    const fields = searchParams.get("fields") || 
      "place_id,name,formatted_address,formatted_phone_number,website,url,rating,user_ratings_total,price_level,opening_hours,photos,reviews,types,geometry";

    if (!placeId) {
      return NextResponse.json({ error: "Place ID required" }, { status: 400 });
    }

    if (!GOOGLE_PLACES_API_KEY) {
      return NextResponse.json({ 
        error: "Google Places API not configured",
        placeId 
      }, { status: 500 });
    }

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_PLACES_API_KEY}`;

    const response = await fetch(url, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    const data: PlaceDetailsResponse = await response.json();

    if (data.status !== "OK") {
      return NextResponse.json({ 
        error: data.error_message || `Google API error: ${data.status}`,
        status: data.status 
      }, { status: 400 });
    }

    const result = data.result!;
    
    // Format the response
    const formattedDetails = {
      placeId: result.place_id,
      name: result.name,
      address: result.formatted_address,
      phone: result.formatted_phone_number,
      website: result.website,
      googleMapsUrl: result.url,
      rating: result.rating,
      reviewCount: result.user_ratings_total,
      priceLevel: result.price_level,
      types: result.types,
      location: result.geometry?.location,
      
      // Hours - format for easier use
      hours: result.opening_hours?.weekday_text ? 
        formatHours(result.opening_hours.weekday_text) : null,
      isOpenNow: result.opening_hours?.open_now,
      
      // Photos - just the references, frontend will use proxy
      photos: result.photos?.map(p => p.photo_reference) || [],
      
      // Reviews from Google
      reviews: result.reviews?.map((review, index) => ({
        id: `google-${result.place_id}-${index}`,
        rating: review.rating,
        content: review.text,
        relativeTime: review.relative_time_description,
        createdAt: new Date(review.time * 1000).toISOString(),
        source: "google" as const,
        user: {
          name: review.author_name,
          avatar: review.profile_photo_url || null,
          profileUrl: review.author_url || null,
        },
      })) || [],
    };

    return NextResponse.json(formattedDetails);
  } catch (error) {
    console.error("Error fetching Google Place details:", error);
    return NextResponse.json(
      { error: "Failed to fetch place details" },
      { status: 500 }
    );
  }
}

// Convert Google's weekday_text to our hours format
function formatHours(weekdayText: string[]): Record<string, string> {
  const dayMap: Record<string, string> = {
    "Monday": "monday",
    "Tuesday": "tuesday", 
    "Wednesday": "wednesday",
    "Thursday": "thursday",
    "Friday": "friday",
    "Saturday": "saturday",
    "Sunday": "sunday",
  };

  const hours: Record<string, string> = {};
  
  for (const line of weekdayText) {
    // Format: "Monday: 9:00 AM – 5:00 PM" or "Monday: Closed"
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;
    
    const day = line.substring(0, colonIndex).trim();
    const time = line.substring(colonIndex + 1).trim();
    
    const dayKey = dayMap[day];
    if (dayKey) {
      hours[dayKey] = time;
    }
  }
  
  return hours;
}

