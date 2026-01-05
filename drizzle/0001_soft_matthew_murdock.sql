CREATE TABLE "blog_internal_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_post_id" uuid NOT NULL,
	"target_post_id" uuid NOT NULL,
	"anchor_text" varchar(255) NOT NULL,
	"inserted" boolean DEFAULT false,
	"position" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_job_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'pending',
	"keyword_id" uuid,
	"topic_id" uuid,
	"post_id" uuid,
	"started_at" timestamp,
	"finished_at" timestamp,
	"duration_ms" integer,
	"logs" jsonb DEFAULT '[]'::jsonb,
	"error" text,
	"token_usage" jsonb,
	"image_generated" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_keyword_lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_keywords" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"list_id" uuid NOT NULL,
	"keyword" varchar(500) NOT NULL,
	"intent" varchar(50) DEFAULT 'informational',
	"locale" varchar(10) DEFAULT 'en-US',
	"priority" integer DEFAULT 5,
	"status" varchar(50) DEFAULT 'pending',
	"last_used_at" timestamp,
	"usage_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_post_keywords" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"keyword_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic_id" uuid,
	"author_id" uuid,
	"title" varchar(500) NOT NULL,
	"slug" varchar(500) NOT NULL,
	"excerpt" text,
	"content_md" text NOT NULL,
	"content_html" text,
	"seo_title" varchar(70),
	"meta_description" varchar(170),
	"canonical_url" text,
	"cover_image_url" text,
	"og_image_url" text,
	"cover_image_alt" varchar(255),
	"faq_json" jsonb DEFAULT '[]'::jsonb,
	"toc_json" jsonb DEFAULT '[]'::jsonb,
	"reading_time" integer,
	"word_count" integer,
	"status" varchar(50) DEFAULT 'draft',
	"published_at" timestamp,
	"scheduled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "blog_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" jsonb NOT NULL,
	"description" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "blog_topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"keyword_id" uuid NOT NULL,
	"title" varchar(500) NOT NULL,
	"angle" text,
	"outline" jsonb,
	"score" integer DEFAULT 50,
	"status" varchar(50) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "blog_internal_links" ADD CONSTRAINT "blog_internal_links_source_post_id_blog_posts_id_fk" FOREIGN KEY ("source_post_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_internal_links" ADD CONSTRAINT "blog_internal_links_target_post_id_blog_posts_id_fk" FOREIGN KEY ("target_post_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_job_runs" ADD CONSTRAINT "blog_job_runs_keyword_id_blog_keywords_id_fk" FOREIGN KEY ("keyword_id") REFERENCES "public"."blog_keywords"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_job_runs" ADD CONSTRAINT "blog_job_runs_topic_id_blog_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."blog_topics"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_job_runs" ADD CONSTRAINT "blog_job_runs_post_id_blog_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_keywords" ADD CONSTRAINT "blog_keywords_list_id_blog_keyword_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."blog_keyword_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_post_keywords" ADD CONSTRAINT "blog_post_keywords_post_id_blog_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_post_keywords" ADD CONSTRAINT "blog_post_keywords_keyword_id_blog_keywords_id_fk" FOREIGN KEY ("keyword_id") REFERENCES "public"."blog_keywords"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_topic_id_blog_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."blog_topics"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_topics" ADD CONSTRAINT "blog_topics_keyword_id_blog_keywords_id_fk" FOREIGN KEY ("keyword_id") REFERENCES "public"."blog_keywords"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blog_internal_links_source_idx" ON "blog_internal_links" USING btree ("source_post_id");--> statement-breakpoint
CREATE INDEX "blog_internal_links_target_idx" ON "blog_internal_links" USING btree ("target_post_id");--> statement-breakpoint
CREATE INDEX "blog_job_runs_type_idx" ON "blog_job_runs" USING btree ("type");--> statement-breakpoint
CREATE INDEX "blog_job_runs_status_idx" ON "blog_job_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "blog_job_runs_created_at_idx" ON "blog_job_runs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "blog_keyword_lists_active_idx" ON "blog_keyword_lists" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "blog_keywords_list_idx" ON "blog_keywords" USING btree ("list_id");--> statement-breakpoint
CREATE INDEX "blog_keywords_status_idx" ON "blog_keywords" USING btree ("status");--> statement-breakpoint
CREATE INDEX "blog_keywords_priority_idx" ON "blog_keywords" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "blog_keywords_keyword_idx" ON "blog_keywords" USING btree ("keyword");--> statement-breakpoint
CREATE INDEX "blog_post_keywords_post_idx" ON "blog_post_keywords" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "blog_post_keywords_keyword_idx" ON "blog_post_keywords" USING btree ("keyword_id");--> statement-breakpoint
CREATE INDEX "blog_posts_slug_idx" ON "blog_posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "blog_posts_status_idx" ON "blog_posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "blog_posts_published_at_idx" ON "blog_posts" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "blog_posts_topic_idx" ON "blog_posts" USING btree ("topic_id");--> statement-breakpoint
CREATE INDEX "blog_posts_author_idx" ON "blog_posts" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "blog_settings_key_idx" ON "blog_settings" USING btree ("key");--> statement-breakpoint
CREATE INDEX "blog_topics_keyword_idx" ON "blog_topics" USING btree ("keyword_id");--> statement-breakpoint
CREATE INDEX "blog_topics_status_idx" ON "blog_topics" USING btree ("status");--> statement-breakpoint
CREATE INDEX "blog_topics_score_idx" ON "blog_topics" USING btree ("score");