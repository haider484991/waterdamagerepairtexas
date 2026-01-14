/**
 * Water Damage Schema - Uses wd_ prefixed tables
 * This schema is for the Water Damage Repair Texas website
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  decimal,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("wd_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  avatar: text("avatar"),
  role: varchar("role", { length: 50 }).default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("wd_users_email_idx").on(table.email),
]);

// Categories table
export const categories = pgTable("wd_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).unique().notNull(),
  icon: varchar("icon", { length: 100 }),
  description: text("description"),
  parentId: uuid("parent_id"),
  section: varchar("section", { length: 100 }),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("wd_categories_slug_idx").on(table.slug),
  index("wd_categories_section_idx").on(table.section),
]);

// Businesses table
export const businesses = pgTable("wd_businesses", {
  id: uuid("id").primaryKey().defaultRandom(),
  googlePlaceId: varchar("google_place_id", { length: 255 }).unique(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).unique().notNull(),
  description: text("description"),
  address: varchar("address", { length: 500 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 50 }).notNull(),
  zip: varchar("zip", { length: 20 }),
  phone: varchar("phone", { length: 50 }),
  website: text("website"),
  email: varchar("email", { length: 255 }),
  lat: decimal("lat", { precision: 10, scale: 7 }),
  lng: decimal("lng", { precision: 10, scale: 7 }),
  categoryId: uuid("category_id").references(() => categories.id),
  neighborhood: varchar("neighborhood", { length: 100 }),
  hours: jsonb("hours").$type<Record<string, string>>(),
  photos: jsonb("photos").$type<string[]>().default([]),
  // Cached Google Places data - reduces API calls
  cachedImageUrls: jsonb("cached_image_urls").$type<string[]>().default([]),
  lastEnrichedAt: timestamp("last_enriched_at"),
  cachedPhone: varchar("cached_phone", { length: 50 }),
  cachedWebsite: text("cached_website"),
  cachedHours: jsonb("cached_hours").$type<Record<string, string>>(),
  cachedReviews: jsonb("cached_reviews").$type<Array<{
    authorName: string;
    rating: number;
    text: string;
    relativeTime: string;
    time: number;
    authorPhoto?: string;
  }>>().default([]),
  googleMapsUrl: text("google_maps_url"),
  priceLevel: integer("price_level"),
  ratingAvg: decimal("rating_avg", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").default(0),
  isVerified: boolean("is_verified").default(false),
  isFeatured: boolean("is_featured").default(false),
  claimedBy: uuid("claimed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("wd_businesses_slug_idx").on(table.slug),
  index("wd_businesses_category_idx").on(table.categoryId),
  index("wd_businesses_neighborhood_idx").on(table.neighborhood),
  index("wd_businesses_rating_idx").on(table.ratingAvg),
  index("wd_businesses_google_place_idx").on(table.googlePlaceId),
  index("wd_businesses_city_idx").on(table.city),
  index("wd_businesses_state_idx").on(table.state),
  index("wd_businesses_city_state_idx").on(table.city, table.state),
]);

// Reviews table
export const reviews = pgTable("wd_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  rating: integer("rating").notNull(),
  title: varchar("title", { length: 255 }),
  content: text("content"),
  photos: jsonb("photos").$type<string[]>().default([]),
  helpfulCount: integer("helpful_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("wd_reviews_business_idx").on(table.businessId),
  index("wd_reviews_user_idx").on(table.userId),
  index("wd_reviews_rating_idx").on(table.rating),
]);

// Favorites table
export const favorites = pgTable("wd_favorites", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  businessId: uuid("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("wd_favorites_user_idx").on(table.userId),
  index("wd_favorites_business_idx").on(table.businessId),
]);

// Business Claims table
export const businessClaims = pgTable("wd_business_claims", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  verificationCode: varchar("verification_code", { length: 10 }),
  businessRole: varchar("business_role", { length: 100 }),
  phone: varchar("phone", { length: 50 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("wd_business_claims_business_idx").on(table.businessId),
  index("wd_business_claims_user_idx").on(table.userId),
  index("wd_business_claims_status_idx").on(table.status),
]);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  reviews: many(reviews),
  favorites: many(favorites),
  claims: many(businessClaims),
  claimedBusinesses: many(businesses),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
  }),
  children: many(categories),
  businesses: many(businesses),
}));

export const businessesRelations = relations(businesses, ({ one, many }) => ({
  category: one(categories, {
    fields: [businesses.categoryId],
    references: [categories.id],
  }),
  owner: one(users, {
    fields: [businesses.claimedBy],
    references: [users.id],
  }),
  reviews: many(reviews),
  favorites: many(favorites),
  claims: many(businessClaims),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  business: one(businesses, {
    fields: [reviews.businessId],
    references: [businesses.id],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
  business: one(businesses, {
    fields: [favorites.businessId],
    references: [businesses.id],
  }),
}));

export const businessClaimsRelations = relations(businessClaims, ({ one }) => ({
  business: one(businesses, {
    fields: [businessClaims.businessId],
    references: [businesses.id],
  }),
  user: one(users, {
    fields: [businessClaims.userId],
    references: [users.id],
  }),
}));

// States table - shared between sites, no prefix needed but using for consistency
export const states = pgTable("wd_states", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 2 }).unique().notNull(),
  population: integer("population"),
  rank: integer("rank"),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("wd_states_code_idx").on(table.code),
  index("wd_states_slug_idx").on(table.slug),
  index("wd_states_rank_idx").on(table.rank),
]);

// Cities table
export const cities = pgTable("wd_cities", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  stateId: uuid("state_id").references(() => states.id, { onDelete: "cascade" }).notNull(),
  population: integer("population"),
  slug: varchar("slug", { length: 100 }).notNull(),
  lat: decimal("lat", { precision: 10, scale: 7 }),
  lng: decimal("lng", { precision: 10, scale: 7 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("wd_cities_state_idx").on(table.stateId),
  index("wd_cities_slug_idx").on(table.slug),
  index("wd_cities_name_state_idx").on(table.name, table.stateId),
]);

export const statesRelations = relations(states, ({ many }) => ({
  cities: many(cities),
}));

export const citiesRelations = relations(cities, ({ one }) => ({
  state: one(states, {
    fields: [cities.stateId],
    references: [states.id],
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Business = typeof businesses.$inferSelect;
export type NewBusiness = typeof businesses.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
export type Favorite = typeof favorites.$inferSelect;
export type NewFavorite = typeof favorites.$inferInsert;
export type BusinessClaim = typeof businessClaims.$inferSelect;
export type NewBusinessClaim = typeof businessClaims.$inferInsert;

// Sync Jobs table - tracks bulk sync progress
export const syncJobs = pgTable("wd_sync_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  totalCities: integer("total_cities").default(0),
  completedCities: integer("completed_cities").default(0),
  totalBusinessesFound: integer("total_businesses_found").default(0),
  totalBusinessesInserted: integer("total_businesses_inserted").default(0),
  totalBusinessesSkipped: integer("total_businesses_skipped").default(0),
  totalApiCalls: integer("total_api_calls").default(0),
  errorMessage: text("error_message"),
  config: jsonb("config").$type<{
    maxStates?: number;
    citiesPerState?: number;
    queriesPerCity?: number;
    stateCode?: string;
    selectedStates?: string[];
    selectedCities?: string[];
  }>(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("wd_sync_jobs_status_idx").on(table.status),
  index("wd_sync_jobs_created_at_idx").on(table.createdAt),
]);

export type SyncJob = typeof syncJobs.$inferSelect;
export type NewSyncJob = typeof syncJobs.$inferInsert;
export type State = typeof states.$inferSelect;
export type NewState = typeof states.$inferInsert;
export type City = typeof cities.$inferSelect;
export type NewCity = typeof cities.$inferInsert;

// ============================================================================
// BLOG SYSTEM TABLES
// ============================================================================

// Blog Keyword Lists
export const blogKeywordLists = pgTable("wd_blog_keyword_lists", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  settings: jsonb("settings").$type<{
    tone?: "conversational" | "professional" | "friendly" | "authoritative";
    audience?: string;
    targetWordCount?: { min: number; max: number };
    language?: string;
    brandVoice?: string;
  }>().default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("wd_blog_keyword_lists_active_idx").on(table.isActive),
]);

// Blog Keywords
export const blogKeywords = pgTable("wd_blog_keywords", {
  id: uuid("id").primaryKey().defaultRandom(),
  listId: uuid("list_id").references(() => blogKeywordLists.id, { onDelete: "cascade" }).notNull(),
  keyword: varchar("keyword", { length: 500 }).notNull(),
  intent: varchar("intent", { length: 50 }).$type<"informational" | "transactional" | "navigational" | "commercial">().default("informational"),
  locale: varchar("locale", { length: 10 }).default("en-US"),
  priority: integer("priority").default(5),
  status: varchar("status", { length: 50 }).$type<"pending" | "used" | "skipped" | "exhausted">().default("pending"),
  lastUsedAt: timestamp("last_used_at"),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("wd_blog_keywords_list_idx").on(table.listId),
  index("wd_blog_keywords_status_idx").on(table.status),
  index("wd_blog_keywords_priority_idx").on(table.priority),
  index("wd_blog_keywords_keyword_idx").on(table.keyword),
]);

// Blog Topics
export const blogTopics = pgTable("wd_blog_topics", {
  id: uuid("id").primaryKey().defaultRandom(),
  keywordId: uuid("keyword_id").references(() => blogKeywords.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  angle: text("angle"),
  outline: jsonb("outline").$type<{
    sections: Array<{
      heading: string;
      subheadings?: string[];
      keyPoints?: string[];
    }>;
  }>(),
  score: integer("score").default(50),
  status: varchar("status", { length: 50 }).$type<"pending" | "approved" | "rejected" | "used">().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("wd_blog_topics_keyword_idx").on(table.keywordId),
  index("wd_blog_topics_status_idx").on(table.status),
  index("wd_blog_topics_score_idx").on(table.score),
]);

// Blog Posts
export const blogPosts = pgTable("wd_blog_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  topicId: uuid("topic_id").references(() => blogTopics.id, { onDelete: "set null" }),
  authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),

  title: varchar("title", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 500 }).unique().notNull(),
  excerpt: text("excerpt"),
  contentMd: text("content_md").notNull(),
  contentHtml: text("content_html"),

  seoTitle: varchar("seo_title", { length: 70 }),
  metaDescription: varchar("meta_description", { length: 170 }),
  canonicalUrl: text("canonical_url"),

  coverImageUrl: text("cover_image_url"),
  ogImageUrl: text("og_image_url"),
  coverImageAlt: varchar("cover_image_alt", { length: 255 }),

  faqJson: jsonb("faq_json").$type<Array<{ question: string; answer: string }>>().default([]),
  tocJson: jsonb("toc_json").$type<Array<{ id: string; text: string; level: number }>>().default([]),

  readingTime: integer("reading_time"),
  wordCount: integer("word_count"),

  status: varchar("status", { length: 50 }).$type<"draft" | "scheduled" | "published" | "archived">().default("draft"),
  publishedAt: timestamp("published_at"),
  scheduledAt: timestamp("scheduled_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("wd_blog_posts_slug_idx").on(table.slug),
  index("wd_blog_posts_status_idx").on(table.status),
  index("wd_blog_posts_published_at_idx").on(table.publishedAt),
  index("wd_blog_posts_topic_idx").on(table.topicId),
  index("wd_blog_posts_author_idx").on(table.authorId),
]);

// Blog Post Keywords
export const blogPostKeywords = pgTable("wd_blog_post_keywords", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").references(() => blogPosts.id, { onDelete: "cascade" }).notNull(),
  keywordId: uuid("keyword_id").references(() => blogKeywords.id, { onDelete: "cascade" }).notNull(),
  isPrimary: boolean("is_primary").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("wd_blog_post_keywords_post_idx").on(table.postId),
  index("wd_blog_post_keywords_keyword_idx").on(table.keywordId),
]);

// Blog Internal Links
export const blogInternalLinks = pgTable("wd_blog_internal_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourcePostId: uuid("source_post_id").references(() => blogPosts.id, { onDelete: "cascade" }).notNull(),
  targetPostId: uuid("target_post_id").references(() => blogPosts.id, { onDelete: "cascade" }),
  targetBusinessId: uuid("target_business_id").references(() => businesses.id, { onDelete: "cascade" }),
  anchorText: varchar("anchor_text", { length: 255 }).notNull(),
  inserted: boolean("inserted").default(false),
  position: integer("position"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("wd_blog_internal_links_source_idx").on(table.sourcePostId),
  index("wd_blog_internal_links_target_post_idx").on(table.targetPostId),
  index("wd_blog_internal_links_target_biz_idx").on(table.targetBusinessId),
]);

// Blog Job Runs
export const blogJobRuns = pgTable("wd_blog_job_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: varchar("type", { length: 50 }).$type<"topic_generation" | "article_generation" | "seo_optimization" | "image_generation" | "publishing" | "full_pipeline">().notNull(),
  status: varchar("status", { length: 50 }).$type<"pending" | "running" | "completed" | "failed">().default("pending"),

  keywordId: uuid("keyword_id").references(() => blogKeywords.id, { onDelete: "set null" }),
  topicId: uuid("topic_id").references(() => blogTopics.id, { onDelete: "set null" }),
  postId: uuid("post_id").references(() => blogPosts.id, { onDelete: "set null" }),

  startedAt: timestamp("started_at"),
  finishedAt: timestamp("finished_at"),
  durationMs: integer("duration_ms"),

  logs: jsonb("logs").$type<Array<{ timestamp: string; level: string; message: string }>>().default([]),
  error: text("error"),

  tokenUsage: jsonb("token_usage").$type<{
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    model?: string;
  }>(),
  imageGenerated: boolean("image_generated").default(false),

  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("wd_blog_job_runs_type_idx").on(table.type),
  index("wd_blog_job_runs_status_idx").on(table.status),
  index("wd_blog_job_runs_created_at_idx").on(table.createdAt),
]);

// Blog Settings
export const blogSettings = pgTable("wd_blog_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 100 }).unique().notNull(),
  value: jsonb("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("wd_blog_settings_key_idx").on(table.key),
]);

// Blog Relations
export const blogKeywordListsRelations = relations(blogKeywordLists, ({ many }) => ({
  keywords: many(blogKeywords),
}));

export const blogKeywordsRelations = relations(blogKeywords, ({ one, many }) => ({
  list: one(blogKeywordLists, {
    fields: [blogKeywords.listId],
    references: [blogKeywordLists.id],
  }),
  topics: many(blogTopics),
  postKeywords: many(blogPostKeywords),
  jobRuns: many(blogJobRuns),
}));

export const blogTopicsRelations = relations(blogTopics, ({ one, many }) => ({
  keyword: one(blogKeywords, {
    fields: [blogTopics.keywordId],
    references: [blogKeywords.id],
  }),
  posts: many(blogPosts),
  jobRuns: many(blogJobRuns),
}));

export const blogPostsRelations = relations(blogPosts, ({ one, many }) => ({
  topic: one(blogTopics, {
    fields: [blogPosts.topicId],
    references: [blogTopics.id],
  }),
  author: one(users, {
    fields: [blogPosts.authorId],
    references: [users.id],
  }),
  postKeywords: many(blogPostKeywords),
  outgoingLinks: many(blogInternalLinks, { relationName: "sourcePost" }),
  incomingLinks: many(blogInternalLinks, { relationName: "targetPost" }),
  jobRuns: many(blogJobRuns),
}));

export const blogPostKeywordsRelations = relations(blogPostKeywords, ({ one }) => ({
  post: one(blogPosts, {
    fields: [blogPostKeywords.postId],
    references: [blogPosts.id],
  }),
  keyword: one(blogKeywords, {
    fields: [blogPostKeywords.keywordId],
    references: [blogKeywords.id],
  }),
}));

export const blogInternalLinksRelations = relations(blogInternalLinks, ({ one }) => ({
  sourcePost: one(blogPosts, {
    fields: [blogInternalLinks.sourcePostId],
    references: [blogPosts.id],
    relationName: "sourcePost",
  }),
  targetPost: one(blogPosts, {
    fields: [blogInternalLinks.targetPostId],
    references: [blogPosts.id],
    relationName: "targetPost",
  }),
  targetBusiness: one(businesses, {
    fields: [blogInternalLinks.targetBusinessId],
    references: [businesses.id],
  }),
}));

export const blogJobRunsRelations = relations(blogJobRuns, ({ one }) => ({
  keyword: one(blogKeywords, {
    fields: [blogJobRuns.keywordId],
    references: [blogKeywords.id],
  }),
  topic: one(blogTopics, {
    fields: [blogJobRuns.topicId],
    references: [blogTopics.id],
  }),
  post: one(blogPosts, {
    fields: [blogJobRuns.postId],
    references: [blogPosts.id],
  }),
}));

// Blog Types
export type BlogKeywordList = typeof blogKeywordLists.$inferSelect;
export type NewBlogKeywordList = typeof blogKeywordLists.$inferInsert;
export type BlogKeyword = typeof blogKeywords.$inferSelect;
export type NewBlogKeyword = typeof blogKeywords.$inferInsert;
export type BlogTopic = typeof blogTopics.$inferSelect;
export type NewBlogTopic = typeof blogTopics.$inferInsert;
export type BlogPost = typeof blogPosts.$inferSelect;
export type NewBlogPost = typeof blogPosts.$inferInsert;
export type BlogPostKeyword = typeof blogPostKeywords.$inferSelect;
export type NewBlogPostKeyword = typeof blogPostKeywords.$inferInsert;
export type BlogInternalLink = typeof blogInternalLinks.$inferSelect;
export type NewBlogInternalLink = typeof blogInternalLinks.$inferInsert;
export type BlogJobRun = typeof blogJobRuns.$inferSelect;
export type NewBlogJobRun = typeof blogJobRuns.$inferInsert;
export type BlogSetting = typeof blogSettings.$inferSelect;
export type NewBlogSetting = typeof blogSettings.$inferInsert;
