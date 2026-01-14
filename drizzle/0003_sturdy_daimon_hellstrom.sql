ALTER TABLE "businesses" ADD COLUMN "cached_image_urls" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "last_enriched_at" timestamp;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "cached_phone" varchar(50);--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "cached_website" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "cached_hours" jsonb;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "cached_reviews" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "google_maps_url" text;