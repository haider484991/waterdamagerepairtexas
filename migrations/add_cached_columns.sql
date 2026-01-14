-- Migration: Add cached Google Places data columns to wd_businesses table
-- Run this SQL in your Neon database console to apply the changes

-- Add cached_image_urls column (stores resolved Google photo URLs)
ALTER TABLE "wd_businesses" ADD COLUMN IF NOT EXISTS "cached_image_urls" jsonb DEFAULT '[]'::jsonb;

-- Add last_enriched_at column (tracks when data was last fetched from Google)
ALTER TABLE "wd_businesses" ADD COLUMN IF NOT EXISTS "last_enriched_at" timestamp;

-- Add cached_phone column (cached phone from Google)
ALTER TABLE "wd_businesses" ADD COLUMN IF NOT EXISTS "cached_phone" varchar(50);

-- Add cached_website column (cached website from Google)
ALTER TABLE "wd_businesses" ADD COLUMN IF NOT EXISTS "cached_website" text;

-- Add cached_hours column (cached business hours from Google)
ALTER TABLE "wd_businesses" ADD COLUMN IF NOT EXISTS "cached_hours" jsonb;

-- Add cached_reviews column (cached Google reviews)
ALTER TABLE "wd_businesses" ADD COLUMN IF NOT EXISTS "cached_reviews" jsonb DEFAULT '[]'::jsonb;

-- Add google_maps_url column (direct Google Maps link)
ALTER TABLE "wd_businesses" ADD COLUMN IF NOT EXISTS "google_maps_url" text;

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'wd_businesses' 
AND column_name IN ('cached_image_urls', 'last_enriched_at', 'cached_phone', 'cached_website', 'cached_hours', 'cached_reviews', 'google_maps_url');
