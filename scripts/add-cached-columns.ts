import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);

async function addCachedColumns() {
    console.log("Adding cached columns to wd_businesses table...");
    console.log("This migration only ADDS columns - nothing will be removed.");

    try {
        // Add cached_image_urls column
        await sql`ALTER TABLE "wd_businesses" ADD COLUMN IF NOT EXISTS "cached_image_urls" jsonb DEFAULT '[]'::jsonb`;
        console.log("✓ Added cached_image_urls column");

        // Add last_enriched_at column
        await sql`ALTER TABLE "wd_businesses" ADD COLUMN IF NOT EXISTS "last_enriched_at" timestamp`;
        console.log("✓ Added last_enriched_at column");

        // Add cached_phone column
        await sql`ALTER TABLE "wd_businesses" ADD COLUMN IF NOT EXISTS "cached_phone" varchar(50)`;
        console.log("✓ Added cached_phone column");

        // Add cached_website column
        await sql`ALTER TABLE "wd_businesses" ADD COLUMN IF NOT EXISTS "cached_website" text`;
        console.log("✓ Added cached_website column");

        // Add cached_hours column
        await sql`ALTER TABLE "wd_businesses" ADD COLUMN IF NOT EXISTS "cached_hours" jsonb`;
        console.log("✓ Added cached_hours column");

        // Add cached_reviews column
        await sql`ALTER TABLE "wd_businesses" ADD COLUMN IF NOT EXISTS "cached_reviews" jsonb DEFAULT '[]'::jsonb`;
        console.log("✓ Added cached_reviews column");

        // Add google_maps_url column
        await sql`ALTER TABLE "wd_businesses" ADD COLUMN IF NOT EXISTS "google_maps_url" text`;
        console.log("✓ Added google_maps_url column");

        console.log("\n✅ All columns added successfully!");
        console.log("Your existing data is unchanged.");

        // Verify
        const result = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'wd_businesses' 
      AND column_name IN ('cached_image_urls', 'last_enriched_at', 'cached_phone', 'cached_website', 'cached_hours', 'cached_reviews', 'google_maps_url')
    `;
        console.log("\nVerified columns:", result.map(r => r.column_name).join(", "));
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

addCachedColumns();
