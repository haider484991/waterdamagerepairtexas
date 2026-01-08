#!/usr/bin/env tsx
/**
 * Clear all placeholder businesses from the database
 * Run: npx tsx scripts/clear-businesses.ts
 */

// Load env FIRST before any other imports
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db, businesses, reviews, favorites, businessClaims } from "../src/lib/db/index";

async function main() {
  console.log("🗑️  Clearing placeholder data from database...\n");

  // Delete in order due to foreign key constraints

  // 1. Delete favorites (references businesses)
  const deletedFavorites = await db.delete(favorites).returning({ id: favorites.id });
  console.log(`✅ Deleted ${deletedFavorites.length} favorites`);

  // 2. Delete reviews (references businesses)
  const deletedReviews = await db.delete(reviews).returning({ id: reviews.id });
  console.log(`✅ Deleted ${deletedReviews.length} reviews`);

  // 3. Delete business claims (references businesses)
  const deletedClaims = await db.delete(businessClaims).returning({ id: businessClaims.id });
  console.log(`✅ Deleted ${deletedClaims.length} business claims`);

  // 4. Delete all businesses
  const deletedBusinesses = await db.delete(businesses).returning({ id: businesses.id });
  console.log(`✅ Deleted ${deletedBusinesses.length} businesses`);

  console.log("\n🎉 Database cleared! Ready for Google Places API data.");
  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
