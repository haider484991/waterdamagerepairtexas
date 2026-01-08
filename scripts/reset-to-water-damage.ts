#!/usr/bin/env tsx
/**
 * Reset Database to Water Damage Restoration
 * - Clears all old pickleball categories and businesses
 * - Adds water damage categories
 * - Clears old blog posts
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db, categories, businesses, reviews, favorites, businessClaims, blogPosts, blogTopics, blogKeywords } from "../src/lib/db/index";
import { sql } from "drizzle-orm";

// Water damage restoration categories (5 categories for Texas)
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

async function resetDatabase() {
  console.log("\n💧 RESETTING DATABASE TO WATER DAMAGE RESTORATION\n");
  console.log("=".repeat(50));

  try {
    // Step 1: Clear related tables first (foreign key constraints)
    console.log("\n📦 Step 1: Clearing related tables...");

    const [reviewCount] = await db.select({ count: sql<number>`count(*)` }).from(reviews);
    await db.delete(reviews);
    console.log(`   ✅ Deleted ${reviewCount?.count || 0} reviews`);

    const [favCount] = await db.select({ count: sql<number>`count(*)` }).from(favorites);
    await db.delete(favorites);
    console.log(`   ✅ Deleted ${favCount?.count || 0} favorites`);

    const [claimCount] = await db.select({ count: sql<number>`count(*)` }).from(businessClaims);
    await db.delete(businessClaims);
    console.log(`   ✅ Deleted ${claimCount?.count || 0} business claims`);

    // Step 2: Clear businesses
    console.log("\n🏢 Step 2: Clearing all businesses...");
    const [bizCount] = await db.select({ count: sql<number>`count(*)` }).from(businesses);
    await db.delete(businesses);
    console.log(`   ✅ Deleted ${bizCount?.count || 0} businesses`);

    // Step 3: Clear old categories
    console.log("\n📂 Step 3: Clearing old categories...");
    const [catCount] = await db.select({ count: sql<number>`count(*)` }).from(categories);
    await db.delete(categories);
    console.log(`   ✅ Deleted ${catCount?.count || 0} categories`);

    // Step 4: Clear blog content
    console.log("\n📝 Step 4: Clearing blog content...");

    const [postCount] = await db.select({ count: sql<number>`count(*)` }).from(blogPosts);
    await db.delete(blogPosts);
    console.log(`   ✅ Deleted ${postCount?.count || 0} blog posts`);

    const [topicCount] = await db.select({ count: sql<number>`count(*)` }).from(blogTopics);
    await db.delete(blogTopics);
    console.log(`   ✅ Deleted ${topicCount?.count || 0} blog topics`);

    const [keywordCount] = await db.select({ count: sql<number>`count(*)` }).from(blogKeywords);
    await db.delete(blogKeywords);
    console.log(`   ✅ Deleted ${keywordCount?.count || 0} blog keywords`);

    // Step 5: Add water damage categories
    console.log("\n💧 Step 5: Adding water damage categories...");
    const insertedCategories = await db.insert(categories).values(waterDamageCategories).returning();
    console.log(`   ✅ Added ${insertedCategories.length} water damage categories:`);
    insertedCategories.forEach((cat) => {
      console.log(`      - ${cat.name} (${cat.slug})`);
    });

    // Step 6: Add sample water damage keywords for blog
    console.log("\n🔑 Step 6: Adding water damage blog keywords...");
    const waterDamageKeywords = [
      { keyword: "water damage restoration Texas", searchVolume: 2400, difficulty: 45, intent: "commercial" },
      { keyword: "flood cleanup Houston", searchVolume: 1800, difficulty: 40, intent: "commercial" },
      { keyword: "mold remediation Dallas", searchVolume: 1200, difficulty: 35, intent: "commercial" },
      { keyword: "emergency water extraction", searchVolume: 900, difficulty: 30, intent: "commercial" },
      { keyword: "storm damage repair Austin", searchVolume: 720, difficulty: 38, intent: "commercial" },
      { keyword: "water damage insurance claim", searchVolume: 1500, difficulty: 42, intent: "informational" },
      { keyword: "how to dry out flooded basement", searchVolume: 2100, difficulty: 25, intent: "informational" },
      { keyword: "signs of water damage in walls", searchVolume: 1600, difficulty: 20, intent: "informational" },
      { keyword: "cost of water damage restoration", searchVolume: 1300, difficulty: 35, intent: "informational" },
      { keyword: "24 hour water damage service", searchVolume: 800, difficulty: 45, intent: "commercial" },
    ];

    const insertedKeywords = await db.insert(blogKeywords).values(waterDamageKeywords).returning();
    console.log(`   ✅ Added ${insertedKeywords.length} blog keywords`);

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("🎉 DATABASE RESET COMPLETE!");
    console.log("=".repeat(50));
    console.log("\n📊 Summary:");
    console.log(`   Categories: ${insertedCategories.length}`);
    console.log(`   Blog Keywords: ${insertedKeywords.length}`);
    console.log(`   Businesses: 0 (sync from Google Places)`);
    console.log(`   Blog Posts: 0 (generate with AI)`);
    console.log("\n📋 Next Steps:");
    console.log("   1. Login to admin panel: /admin");
    console.log("   2. Go to Sync page to sync businesses from Google Places");
    console.log("   3. Go to Blog > Keywords to generate blog content");
    console.log("\n");

  } catch (error) {
    console.error("\n❌ Error resetting database:", error);
    process.exit(1);
  }

  process.exit(0);
}

resetDatabase();
