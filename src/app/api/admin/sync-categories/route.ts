import { NextResponse } from "next/server";
import { db, categories, businesses } from "@/lib/db";
import { eq, sql } from "drizzle-orm";
import slugify from "slugify";
import { verifyAdmin } from "@/lib/auth/utils";
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

// Water damage service categories (5 categories for Texas)
const waterDamageCategories = [
  {
    name: "Water Damage Restoration",
    slug: "water-damage-restoration",
    icon: "Droplets",
    description: "Professional water damage restoration services including water extraction, structural drying, dehumidification, and property restoration across Texas",
    section: "Restoration",
    displayOrder: 1,
  },
  {
    name: "Flood Cleanup",
    slug: "flood-cleanup",
    icon: "Waves",
    description: "Emergency flood cleanup services, water removal, sewage cleanup, and flood damage repair for residential and commercial properties",
    section: "Emergency",
    displayOrder: 2,
  },
  {
    name: "Mold Remediation",
    slug: "mold-remediation",
    icon: "ShieldCheck",
    description: "Professional mold inspection, testing, removal, and remediation services to ensure safe and healthy indoor environments",
    section: "Health",
    displayOrder: 3,
  },
  {
    name: "Emergency Services",
    slug: "emergency-services",
    icon: "AlertTriangle",
    description: "24/7 emergency water damage response, immediate water extraction, and rapid disaster recovery services available around the clock",
    section: "Emergency",
    displayOrder: 4,
  },
  {
    name: "Storm Damage Repair",
    slug: "storm-damage",
    icon: "Wind",
    description: "Storm damage repair services including wind damage, hail damage, hurricane damage, and tornado damage restoration across Texas",
    section: "Repair",
    displayOrder: 5,
  },
];

// Water damage service search queries for Google Places API
const categorySearchQueries: Record<string, string[]> = {
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
    await verifyAdmin();

    // Initialize progress tracking
    resetSyncProgress(waterDamageCategories.length);
    updateSyncProgress({
      currentStep: "Syncing water damage categories...",
      categoriesAdded: 0,
      categoriesUpdated: 0,
      categoriesRemoved: 0,
    });

    let added = 0;
    let updated = 0;
    let removed = 0;
    const validSlugs = new Set(waterDamageCategories.map(c => c.slug));

    // Step 1: Add missing categories and update existing ones
    for (let i = 0; i < waterDamageCategories.length; i++) {
      const cat = waterDamageCategories[i];
      updateSyncProgress({
        currentStep: `Processing category ${i + 1}/${waterDamageCategories.length}: ${cat.name}`,
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
      categoriesProcessed: waterDamageCategories.length,
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
        totalExpected: waterDamageCategories.length,
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
    await verifyAdmin();

    const existingCategories = await db.select().from(categories);
    const validSlugs = new Set(waterDamageCategories.map(c => c.slug));
    
    const missingCategories = waterDamageCategories.filter(
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
      totalExpected: waterDamageCategories.length,
      totalInDatabase: existingCategories.length,
      missing: missingCategories.length,
      missingList: missingCategories.map((c) => c.name),
      orphaned: orphanedCategories.length,
      orphanedList: orphanedCategories.map((c) => ({
        name: c.name,
        slug: c.slug,
        hasBusinesses: orphanedWithBusinesses.some(o => o.id === c.id),
      })),
      status: existingCategories.length === waterDamageCategories.length && orphanedCategories.length === 0 
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
