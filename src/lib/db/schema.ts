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
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  avatar: text("avatar"),
  role: varchar("role", { length: 50 }).default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("users_email_idx").on(table.email),
]);

// Categories table
export const categories = pgTable("categories", {
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
  index("categories_slug_idx").on(table.slug),
  index("categories_section_idx").on(table.section),
]);

// Businesses table
export const businesses = pgTable("businesses", {
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
  priceLevel: integer("price_level"),
  ratingAvg: decimal("rating_avg", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").default(0),
  isVerified: boolean("is_verified").default(false),
  isFeatured: boolean("is_featured").default(false),
  claimedBy: uuid("claimed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("businesses_slug_idx").on(table.slug),
  index("businesses_category_idx").on(table.categoryId),
  index("businesses_neighborhood_idx").on(table.neighborhood),
  index("businesses_rating_idx").on(table.ratingAvg),
  index("businesses_google_place_idx").on(table.googlePlaceId),
  index("businesses_city_idx").on(table.city),
  index("businesses_state_idx").on(table.state),
  index("businesses_city_state_idx").on(table.city, table.state),
]);

// Reviews table
export const reviews = pgTable("reviews", {
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
  index("reviews_business_idx").on(table.businessId),
  index("reviews_user_idx").on(table.userId),
  index("reviews_rating_idx").on(table.rating),
]);

// Favorites table
export const favorites = pgTable("favorites", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  businessId: uuid("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("favorites_user_idx").on(table.userId),
  index("favorites_business_idx").on(table.businessId),
]);

// Business Claims table
export const businessClaims = pgTable("business_claims", {
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
  index("business_claims_business_idx").on(table.businessId),
  index("business_claims_user_idx").on(table.userId),
  index("business_claims_status_idx").on(table.status),
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

// States table
export const states = pgTable("states", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 2 }).unique().notNull(),
  population: integer("population"),
  rank: integer("rank"),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("states_code_idx").on(table.code),
  index("states_slug_idx").on(table.slug),
  index("states_rank_idx").on(table.rank),
]);

// Cities table
export const cities = pgTable("cities", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  stateId: uuid("state_id").references(() => states.id, { onDelete: "cascade" }).notNull(),
  population: integer("population"),
  slug: varchar("slug", { length: 100 }).notNull(),
  lat: decimal("lat", { precision: 10, scale: 7 }),
  lng: decimal("lng", { precision: 10, scale: 7 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("cities_state_idx").on(table.stateId),
  index("cities_slug_idx").on(table.slug),
  index("cities_name_state_idx").on(table.name, table.stateId),
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
export const syncJobs = pgTable("sync_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, running, completed, failed
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
  index("sync_jobs_status_idx").on(table.status),
  index("sync_jobs_created_at_idx").on(table.createdAt),
]);

export type SyncJob = typeof syncJobs.$inferSelect;
export type NewSyncJob = typeof syncJobs.$inferInsert;
export type State = typeof states.$inferSelect;
export type NewState = typeof states.$inferInsert;
export type City = typeof cities.$inferSelect;
export type NewCity = typeof cities.$inferInsert;

