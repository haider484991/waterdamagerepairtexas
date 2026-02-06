/**
 * Fetch Reviews for Existing Businesses
 *
 * Pulls individual reviews from Outscraper Google Maps Reviews API
 * for all businesses already in src/data/businesses.json.
 * Updates reviewsData[] and optionally refreshes photos[].
 *
 * Usage:
 *   npx tsx scripts/fetch-reviews.ts                  # fetch 20 reviews per business
 *   npx tsx scripts/fetch-reviews.ts --limit 50       # fetch 50 reviews per business
 *   npx tsx scripts/fetch-reviews.ts --photos         # also fetch extra photos
 *   npx tsx scripts/fetch-reviews.ts --dry-run        # preview without saving
 *
 * Requires OUTSCRAPER_API_KEY in .env.local
 */

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// ============================================================================
// Config
// ============================================================================

const OUTSCRAPER_API_KEY = process.env.OUTSCRAPER_API_KEY;
if (!OUTSCRAPER_API_KEY) {
  console.error("ERROR: OUTSCRAPER_API_KEY is not set in .env.local");
  console.error("Get your API key at: https://app.outscraper.com");
  process.exit(1);
}

const API_BASE = "https://api.app.outscraper.com";
const DELAY_BETWEEN_REQUESTS_MS = 2000;
const RETRY_DELAY_MS = 5000;
const MAX_RETRIES = 2;

const DATA_DIR = path.join(process.cwd(), "src", "data");
const BUSINESSES_FILE = path.join(DATA_DIR, "businesses.json");

// Parse CLI args
const args = process.argv.slice(2);
const REVIEWS_LIMIT = (() => {
  const idx = args.indexOf("--limit");
  return idx !== -1 && args[idx + 1] ? parseInt(args[idx + 1]) : 20;
})();
const MAX_BUSINESSES = (() => {
  const idx = args.indexOf("--max");
  return idx !== -1 && args[idx + 1] ? parseInt(args[idx + 1]) : Infinity;
})();
const FETCH_PHOTOS = args.includes("--photos");
const DRY_RUN = args.includes("--dry-run");

// ============================================================================
// Types (matching existing businesses.json schema)
// ============================================================================

interface ReviewData {
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
}

interface OutscraperReview {
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
}

interface OutscraperReviewsResponse {
  name?: string;
  place_id?: string;
  reviews_data?: OutscraperReview[];
  // The reviews endpoint may also return updated photos
  photo?: string;
  photos?: string[];
  photos_count?: number;
}

// Using `any` for the full business object since we only modify specific fields
type Business = Record<string, any>;

// ============================================================================
// Helpers
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function transformReview(r: OutscraperReview): ReviewData {
  return {
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
  };
}

// ============================================================================
// Outscraper Reviews API
// ============================================================================

async function fetchReviews(
  placeId: string,
  limit: number,
  retries = 0
): Promise<OutscraperReviewsResponse | null> {
  const params = new URLSearchParams({
    query: placeId,
    reviewsLimit: limit.toString(),
    sort: "newest",
    language: "en",
    region: "US",
    async: "false",
  });

  const url = `${API_BASE}/maps/reviews-v3?${params}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-API-KEY": OUTSCRAPER_API_KEY!,
        Accept: "application/json",
      },
    });

    if (response.status === 429) {
      console.log("    Rate limited. Waiting 30s...");
      await sleep(30000);
      if (retries < MAX_RETRIES) {
        return fetchReviews(placeId, limit, retries + 1);
      }
      return null;
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    // Response format: [[{place data with reviews_data}]]
    if (Array.isArray(data) && data.length > 0) {
      const inner = Array.isArray(data[0]) ? data[0] : data;
      if (inner.length > 0 && typeof inner[0] === "object") {
        return inner[0] as OutscraperReviewsResponse;
      }
    }

    // Handle { data: [[...]] } wrapper
    if (data?.data && Array.isArray(data.data)) {
      const inner = Array.isArray(data.data[0]) ? data.data[0] : data.data;
      if (inner.length > 0) {
        return inner[0] as OutscraperReviewsResponse;
      }
    }

    console.log("    Unexpected response format:", JSON.stringify(data).slice(0, 200));
    return null;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (retries < MAX_RETRIES) {
      console.log(`    Request failed: ${message}. Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await sleep(RETRY_DELAY_MS);
      return fetchReviews(placeId, limit, retries + 1);
    }
    console.error(`    Failed after ${MAX_RETRIES} retries: ${message}`);
    return null;
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log("============================================");
  console.log("  Fetch Reviews for Existing Businesses");
  console.log("============================================\n");
  console.log(`Reviews per business: ${REVIEWS_LIMIT}`);
  console.log(`Max businesses:      ${MAX_BUSINESSES === Infinity ? "all" : MAX_BUSINESSES}`);
  console.log(`Fetch photos:        ${FETCH_PHOTOS}`);
  console.log(`Dry run:             ${DRY_RUN}`);
  console.log(`Data file:           ${BUSINESSES_FILE}\n`);

  // Load existing businesses
  if (!fs.existsSync(BUSINESSES_FILE)) {
    console.error("ERROR: businesses.json not found at", BUSINESSES_FILE);
    process.exit(1);
  }

  const raw = fs.readFileSync(BUSINESSES_FILE, "utf-8");
  const businesses: Business[] = JSON.parse(raw);
  console.log(`Loaded ${businesses.length} businesses\n`);

  // Filter to businesses that have a googlePlaceId and need reviews
  const allNeedReviews = businesses
    .filter((b) => b.googlePlaceId && (!b.reviewsData || b.reviewsData.length === 0))
    .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0)); // Most reviewed first

  const alreadyHasReviews = businesses.length - allNeedReviews.length;

  // Apply --max limit
  const needsReviews = MAX_BUSINESSES < Infinity
    ? allNeedReviews.slice(0, MAX_BUSINESSES)
    : allNeedReviews;

  console.log(`Businesses needing reviews: ${allNeedReviews.length}`);
  console.log(`Processing (--max):         ${needsReviews.length}`);
  console.log(`Already have reviews:       ${alreadyHasReviews}`);
  console.log(`Estimated API cost:         ~$${((needsReviews.length * REVIEWS_LIMIT) / 1000 * 2).toFixed(2)}`);
  console.log("");

  if (DRY_RUN) {
    console.log("DRY RUN — no API calls will be made.");
    console.log("\nBusinesses that would be updated:");
    for (const b of needsReviews.slice(0, 10)) {
      console.log(`  - ${b.name} (${b.city}, ${b.state}) — ${b.reviewCount} reviews on Google`);
    }
    if (needsReviews.length > 10) {
      console.log(`  ... and ${needsReviews.length - 10} more`);
    }
    return;
  }

  // Build a map for quick lookup
  const businessMap = new Map<string, Business>();
  for (const b of businesses) {
    if (b.googlePlaceId) {
      businessMap.set(b.googlePlaceId, b);
    }
  }

  // Stats
  let totalUpdated = 0;
  let totalReviewsFetched = 0;
  let totalPhotosFetched = 0;
  let totalErrors = 0;

  for (let i = 0; i < needsReviews.length; i++) {
    const biz = needsReviews[i];
    const placeId = biz.googlePlaceId;

    console.log(
      `[${i + 1}/${needsReviews.length}] ${biz.name} (${biz.city}, ${biz.state}) — ${biz.reviewCount} Google reviews`
    );

    try {
      const result = await fetchReviews(placeId, REVIEWS_LIMIT);

      if (!result) {
        console.log("    No data returned, skipping.");
        totalErrors++;
        continue;
      }

      const reviews = result.reviews_data || [];
      const transformed = reviews.map(transformReview);

      // Update the business in the original array
      const original = businessMap.get(placeId);
      if (original) {
        original.reviewsData = transformed;
        original.updatedAt = new Date().toISOString();

        // Optionally update photos
        if (FETCH_PHOTOS && result.photos && result.photos.length > 0) {
          const existingPhotos = new Set(original.photos || []);
          let newPhotos = 0;
          for (const photo of result.photos) {
            if (photo && !existingPhotos.has(photo)) {
              original.photos.push(photo);
              existingPhotos.add(photo);
              newPhotos++;
            }
          }
          if (result.photo && !existingPhotos.has(result.photo)) {
            original.photos.push(result.photo);
            newPhotos++;
          }
          totalPhotosFetched += newPhotos;
          if (newPhotos > 0) {
            original.photosCount = original.photos.length;
            console.log(`    +${newPhotos} new photos`);
          }
        }

        totalUpdated++;
        totalReviewsFetched += transformed.length;
        console.log(`    Fetched ${transformed.length} reviews`);

        // Preview first review
        if (transformed.length > 0 && transformed[0].text) {
          const preview = transformed[0].text.slice(0, 80);
          console.log(`    Latest: "${preview}${transformed[0].text.length > 80 ? "..." : ""}"`);
        }
      }

      // Save periodically (every 5 businesses) for resume safety
      if (totalUpdated % 5 === 0) {
        fs.writeFileSync(BUSINESSES_FILE, JSON.stringify(businesses, null, 4), "utf-8");
        console.log("    [Saved progress]");
      }

      // Rate limiting
      await sleep(DELAY_BETWEEN_REQUESTS_MS);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`    ERROR: ${msg}`);
      totalErrors++;

      // Save what we have so far
      fs.writeFileSync(BUSINESSES_FILE, JSON.stringify(businesses, null, 4), "utf-8");
      await sleep(RETRY_DELAY_MS);
    }
  }

  // Final save
  fs.writeFileSync(BUSINESSES_FILE, JSON.stringify(businesses, null, 4), "utf-8");

  console.log("\n============================================");
  console.log("  Review Fetch Complete");
  console.log("============================================");
  console.log(`Businesses updated: ${totalUpdated}`);
  console.log(`Reviews fetched:    ${totalReviewsFetched}`);
  if (FETCH_PHOTOS) {
    console.log(`New photos added:   ${totalPhotosFetched}`);
  }
  console.log(`Errors:             ${totalErrors}`);
  console.log(`Saved to:           ${BUSINESSES_FILE}`);
  console.log("============================================\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
