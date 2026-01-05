DROP INDEX "blog_internal_links_target_idx";--> statement-breakpoint
ALTER TABLE "blog_internal_links" ALTER COLUMN "target_post_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "blog_internal_links" ADD COLUMN "target_business_id" uuid;--> statement-breakpoint
ALTER TABLE "blog_internal_links" ADD CONSTRAINT "blog_internal_links_target_business_id_businesses_id_fk" FOREIGN KEY ("target_business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blog_internal_links_target_post_idx" ON "blog_internal_links" USING btree ("target_post_id");--> statement-breakpoint
CREATE INDEX "blog_internal_links_target_biz_idx" ON "blog_internal_links" USING btree ("target_business_id");