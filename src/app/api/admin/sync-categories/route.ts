import { NextResponse } from "next/server";
import { db, categories, businesses } from "@/lib/db";
import { eq, sql } from "drizzle-orm";
import slugify from "slugify";
import {
  resetSyncProgress,
  updateSyncProgress,
  completeSyncProgress,
  errorSyncProgress,
} from "@/lib/sync-progress";

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address?: string;
  vicinity?: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  types?: string[];
  photos?: Array<{
    photo_reference: string;
  }>;
}

// Pickleball-specific categories (5 categories matching seed file)
const pickleballCategories = [
  {
    name: "Pickleball Courts & Facilities",
    slug: "pickleball-courts-facilities",
    icon: "MapPin",
    description: "Indoor and outdoor pickleball courts, multi-sport facilities, community centers, and recreation centers with dedicated pickleball amenities across the United States",
    section: "Facilities",
    displayOrder: 1,
  },
  {
    name: "Pickleball Clubs & Leagues",
    slug: "pickleball-clubs-leagues",
    icon: "Users",
    description: "Local pickleball clubs, competitive leagues, recreational play groups, meetups, and organized pickleball communities for players of all skill levels",
    section: "Community",
    displayOrder: 2,
  },
  {
    name: "Pickleball Equipment Stores",
    slug: "pickleball-equipment-stores",
    icon: "ShoppingBag",
    description: "Specialty stores selling pickleball paddles, balls, nets, apparel, accessories, and gear from top brands for recreational and competitive players",
    section: "Shopping",
    displayOrder: 3,
  },
  {
    name: "Pickleball Coaches & Instructors",
    slug: "pickleball-coaches-instructors",
    icon: "GraduationCap",
    description: "Certified pickleball coaches, instructors, personal trainers, clinics, and lessons for beginners, intermediate, and advanced players",
    section: "Education",
    displayOrder: 4,
  },
  {
    name: "Pickleball Tournaments & Events",
    slug: "pickleball-tournaments-events",
    icon: "Trophy",
    description: "Pickleball tournaments, competitions, events, championships, social gatherings, and community pickleball activities across the country",
    section: "Events",
    displayOrder: 5,
  },
];

// Pickleball-specific search queries for Google Places API
const categorySearchQueries: Record<string, string[]> = {
  "pickleball-courts-facilities": [
    "pickleball courts",
    "pickleball facilities",
    "indoor pickleball courts",
    "pickleball recreation center",
  ],
  "pickleball-clubs-leagues": [
    "pickleball club",
    "pickleball league",
    "pickleball association",
  ],
  "pickleball-equipment-stores": [
    "pickleball equipment",
    "pickleball store",
    "pickleball shop",
    "pickleball gear",
  ],
  "pickleball-coaches-instructors": [
    "pickleball coach",
    "pickleball instructor",
    "pickleball lessons",
    "pickleball academy",
  ],
  "pickleball-tournaments-events": [
    "pickleball tournament",
    "pickleball event",
    "pickleball championship",
  ],
};

async function searchGooglePlaces(query: string, cityName?: string, stateCode?: string): Promise<GooglePlace[]> {
  if (!GOOGLE_PLACES_API_KEY) {
    return [];
  }

  try {
    const searchQuery = cityName && stateCode 
      ? `${query} in ${cityName}, ${stateCode}`
      : query;
      
    const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
    url.searchParams.set("query", searchQuery);
    url.searchParams.set("key", GOOGLE_PLACES_API_KEY);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("Google Places API error:", data.status, data.error_message);
      return [];
    }

    return data.results || [];
  } catch (error) {
    console.error("Error searching Google Places:", error);
    return [];
  }
}

async function syncBusinessesForCategory(
  categorySlug: string, 
  categoryId: string,
  cityName?: string,
  stateCode?: string
): Promise<{ inserted: number; skipped: number }> {
  if (!GOOGLE_PLACES_API_KEY) {
    return { inserted: 0, skipped: 0 };
  }

  const queries = categorySearchQueries[categorySlug] || [];
  if (queries.length === 0) {
    return { inserted: 0, skipped: 0 };
  }

  let inserted = 0;
  let skipped = 0;

  // Use first 2 queries to avoid too many API calls
  for (const query of queries.slice(0, 2)) {
    try {
      const places = await searchGooglePlaces(query, cityName, stateCode);

      for (const place of places) {
        // Check if business already exists
        const existing = await db
          .select()
          .from(businesses)
          .where(eq(businesses.googlePlaceId, place.place_id))
          .limit(1);

        if (existing.length > 0) {
          skipped++;
          continue;
        }

        // Generate unique slug
        const baseSlug = slugify(place.name, { lower: true, strict: true });
        let slug = baseSlug;
        let counter = 1;
        while (true) {
          const existingSlug = await db
            .select()
            .from(businesses)
            .where(eq(businesses.slug, slug))
            .limit(1);
          if (existingSlug.length === 0) break;
          slug = `${baseSlug}-${counter}`;
          counter++;
        }

        // Parse address
        const address = place.formatted_address || place.vicinity || "";
        const addressParts = address.split(",").map((p) => p.trim());
        
        // Extract city and state from address or use provided values
        let city = cityName || "Unknown";
        let state = stateCode || "XX";
        let zip = "";
        
        if (addressParts.length >= 2) {
          // Try to extract from formatted address
          const lastPart = addressParts[addressParts.length - 1];
          const secondLastPart = addressParts[addressParts.length - 2];
          
          // Extract zip code
          const zipMatch = secondLastPart?.match(/\b\d{5}(?:-\d{4})?\b/);
          if (zipMatch) {
            zip = zipMatch[0];
          }
          
          // Extract state
          const stateMatch = secondLastPart?.match(/\b([A-Z]{2})\b/);
          if (stateMatch) {
            state = stateMatch[1];
          }
          
          // Extract city (usually second to last part before state/zip)
          if (addressParts.length >= 3) {
            const cityPart = addressParts[addressParts.length - 2];
            const cityWithoutZipState = cityPart.replace(/\b([A-Z]{2})\b/, '').replace(/\b\d{5}(?:-\d{4})?\b/, '').trim();
            if (cityWithoutZipState) {
              city = cityWithoutZipState;
            }
          }
        }

        // Store thumbnail photo reference
        const thumbnailPhoto = place.photos?.[0]?.photo_reference || null;

        // Insert business - auto-approve API businesses
        await db.insert(businesses).values({
          googlePlaceId: place.place_id,
          name: place.name,
          slug,
          address: addressParts[0] || address,
          city,
          state,
          zip,
          lat: place.geometry.location.lat.toString(),
          lng: place.geometry.location.lng.toString(),
          categoryId,
          ratingAvg: place.rating?.toString() || "0",
          reviewCount: place.user_ratings_total || 0,
          priceLevel: place.price_level,
          photos: thumbnailPhoto ? [thumbnailPhoto] : [],
          isVerified: true,
          isFeatured: (place.rating || 0) >= 4.5 && (place.user_ratings_total || 0) >= 50,
        });

        inserted++;
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (error) {
      console.error(`Error syncing businesses for ${categorySlug}:`, error);
    }
  }

  return { inserted, skipped };
}

export async function POST() {
  try {
    // Initialize progress tracking
    resetSyncProgress(pickleballCategories.length);
    updateSyncProgress({
      currentStep: "Syncing pickleball categories...",
      categoriesAdded: 0,
      categoriesUpdated: 0,
      categoriesRemoved: 0,
    });

    let added = 0;
    let updated = 0;
    let removed = 0;
    const validSlugs = new Set(pickleballCategories.map(c => c.slug));

    // Step 1: Add missing categories and update existing ones
    for (let i = 0; i < pickleballCategories.length; i++) {
      const cat = pickleballCategories[i];
      updateSyncProgress({
        currentStep: `Processing category ${i + 1}/${pickleballCategories.length}: ${cat.name}`,
        currentCategory: cat.name,
        categoriesProcessed: i,
      });

      const [existingCat] = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, cat.slug))
        .limit(1);

      if (!existingCat) {
        await db.insert(categories).values(cat);
        added++;
        updateSyncProgress({
          categoriesAdded: added,
        });
        console.log(`✅ Added category: ${cat.name}`);
      } else {
        const needsUpdate = 
          existingCat.name !== cat.name ||
          existingCat.icon !== cat.icon ||
          existingCat.description !== cat.description ||
          existingCat.section !== cat.section ||
          existingCat.displayOrder !== cat.displayOrder;

        if (needsUpdate) {
          await db
            .update(categories)
            .set({
              name: cat.name,
              icon: cat.icon,
              description: cat.description,
              section: cat.section,
              displayOrder: cat.displayOrder,
            })
            .where(eq(categories.slug, cat.slug));
          updated++;
          updateSyncProgress({
            categoriesUpdated: updated,
          });
          console.log(`🔄 Updated category: ${cat.name}`);
        }
      }
    }

    // Step 2: Find and remove orphaned categories
    const allExistingCategories = await db.select().from(categories);
    const orphanedCategories = allExistingCategories.filter(
      cat => !validSlugs.has(cat.slug)
    );

    for (const orphan of orphanedCategories) {
      const [businessCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(businesses)
        .where(eq(businesses.categoryId, orphan.id));

      const hasBusinesses = Number(businessCount?.count || 0) > 0;

      if (!hasBusinesses) {
        await db.delete(categories).where(eq(categories.id, orphan.id));
        removed++;
        updateSyncProgress({
          categoriesRemoved: removed,
        });
        console.log(`🗑️ Removed orphaned category: ${orphan.name}`);
      } else {
        console.log(`⚠️ Cannot remove category "${orphan.name}" - it has ${businessCount?.count} businesses`);
      }
    }

    const [finalCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(categories);

    updateSyncProgress({
      categoriesProcessed: pickleballCategories.length,
      currentStep: "Category sync completed.",
    });

    // Note: Business sync would be done separately via the multi-location sync endpoint
    completeSyncProgress();

    return NextResponse.json({
      success: true,
      categories: {
        added,
        updated,
        removed,
        totalExpected: pickleballCategories.length,
        totalInDatabase: Number(finalCount?.count || 0),
      },
      message: `Sync complete: ${added} categories added, ${updated} updated, ${removed} removed. Use /api/admin/sync-multi-location to sync businesses.`,
    });
  } catch (error) {
    console.error("Error syncing categories:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    errorSyncProgress(errorMessage);
    return NextResponse.json(
      { error: "Failed to sync categories", details: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const existingCategories = await db.select().from(categories);
    const validSlugs = new Set(pickleballCategories.map(c => c.slug));
    
    const missingCategories = pickleballCategories.filter(
      (cat) => !existingCategories.some((e) => e.slug === cat.slug)
    );

    const orphanedCategories = existingCategories.filter(
      (cat) => !validSlugs.has(cat.slug)
    );

    interface OrphanedCategoryWithBusinesses {
      id: string;
      name: string;
      slug: string;
      businessCount: number;
    }
    const orphanedWithBusinesses: OrphanedCategoryWithBusinesses[] = [];
    for (const orphan of orphanedCategories) {
      const [businessCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(businesses)
        .where(eq(businesses.categoryId, orphan.id));
      
      if (Number(businessCount?.count || 0) > 0) {
        orphanedWithBusinesses.push({
          id: orphan.id,
          name: orphan.name,
          slug: orphan.slug,
          businessCount: Number(businessCount?.count || 0),
        });
      }
    }

    return NextResponse.json({
      totalExpected: pickleballCategories.length,
      totalInDatabase: existingCategories.length,
      missing: missingCategories.length,
      missingList: missingCategories.map((c) => c.name),
      orphaned: orphanedCategories.length,
      orphanedList: orphanedCategories.map((c) => ({
        name: c.name,
        slug: c.slug,
        hasBusinesses: orphanedWithBusinesses.some(o => o.id === c.id),
      })),
      status: existingCategories.length === pickleballCategories.length && orphanedCategories.length === 0 
        ? "synced" 
        : "needs_sync",
    });
  } catch (error) {
    console.error("Error checking categories:", error);
    return NextResponse.json(
      { error: "Failed to check categories" },
      { status: 500 }
    );
  }
}
