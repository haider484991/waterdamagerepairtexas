import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as dotenv from "dotenv";
import { categories, businesses, users, states, cities } from "./schema";
import bcrypt from "bcryptjs";
import { getAllStates, getAllCities } from "../location-data";

dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

// Pickleball-specific categories (5 categories)
const pickleballCategories = [
  {
    name: "Pickleball Courts & Facilities",
    slug: "pickleball-courts-facilities",
    icon: "MapPin",
    description: "Indoor and outdoor pickleball courts, multi-sport facilities, community centers, and recreation centers with dedicated pickleball amenities across the United States",
    section: "Facilities",
    displayOrder: 1,
  },
  {
    name: "Pickleball Clubs & Leagues",
    slug: "pickleball-clubs-leagues",
    icon: "Users",
    description: "Local pickleball clubs, competitive leagues, recreational play groups, meetups, and organized pickleball communities for players of all skill levels",
    section: "Community",
    displayOrder: 2,
  },
  {
    name: "Pickleball Equipment Stores",
    slug: "pickleball-equipment-stores",
    icon: "ShoppingBag",
    description: "Specialty stores selling pickleball paddles, balls, nets, apparel, accessories, and gear from top brands for recreational and competitive players",
    section: "Shopping",
    displayOrder: 3,
  },
  {
    name: "Pickleball Coaches & Instructors",
    slug: "pickleball-coaches-instructors",
    icon: "GraduationCap",
    description: "Certified pickleball coaches, instructors, personal trainers, clinics, and lessons for beginners, intermediate, and advanced players",
    section: "Education",
    displayOrder: 4,
  },
  {
    name: "Pickleball Tournaments & Events",
    slug: "pickleball-tournaments-events",
    icon: "Trophy",
    description: "Pickleball tournaments, competitions, events, championships, social gatherings, and community pickleball activities across the country",
    section: "Events",
    displayOrder: 5,
  },
];

// Sample pickleball businesses from various cities
const samplePickleballBusinesses = [
  {
    name: "LA Pickleball Club",
    slug: "la-pickleball-club",
    description: "Premier pickleball facility in Los Angeles featuring 12 indoor courts, pro shop, and coaching services for all skill levels.",
    address: "1234 Olympic Blvd",
    city: "Los Angeles",
    state: "CA",
    zip: "90015",
    phone: "(310) 555-0100",
    website: "https://lapickleballclub.com",
    lat: "34.0522",
    lng: "-118.2437",
    neighborhood: "Downtown LA",
    priceLevel: 2,
    ratingAvg: "4.70",
    reviewCount: 187,
    isFeatured: true,
    photos: [],
    hours: {
      monday: "6:00 AM - 10:00 PM",
      tuesday: "6:00 AM - 10:00 PM",
      wednesday: "6:00 AM - 10:00 PM",
      thursday: "6:00 AM - 10:00 PM",
      friday: "6:00 AM - 10:00 PM",
      saturday: "7:00 AM - 9:00 PM",
      sunday: "7:00 AM - 9:00 PM",
    },
  },
  {
    name: "Austin Pickleball Center",
    slug: "austin-pickleball-center",
    description: "Central Texas's largest pickleball complex with 16 outdoor courts, tournament hosting, and community leagues.",
    address: "5678 Congress Ave",
    city: "Austin",
    state: "TX",
    zip: "78701",
    phone: "(512) 555-0200",
    website: "https://austinpickleballcenter.com",
    lat: "30.2672",
    lng: "-97.7431",
    neighborhood: "South Congress",
    priceLevel: 2,
    ratingAvg: "4.80",
    reviewCount: 245,
    isFeatured: true,
    photos: [],
    hours: {
      monday: "7:00 AM - 9:00 PM",
      tuesday: "7:00 AM - 9:00 PM",
      wednesday: "7:00 AM - 9:00 PM",
      thursday: "7:00 AM - 9:00 PM",
      friday: "7:00 AM - 9:00 PM",
      saturday: "8:00 AM - 8:00 PM",
      sunday: "8:00 AM - 8:00 PM",
    },
  },
  {
    name: "Miami Pickleball Pro Shop",
    slug: "miami-pickleball-pro-shop",
    description: "Complete selection of pickleball paddles, balls, and accessories from all major brands. Expert staff to help you find the perfect gear.",
    address: "9876 Biscayne Blvd",
    city: "Miami",
    state: "FL",
    zip: "33138",
    phone: "(305) 555-0300",
    website: "https://miamipickleballshop.com",
    lat: "25.7617",
    lng: "-80.1918",
    neighborhood: "Biscayne",
    priceLevel: 2,
    ratingAvg: "4.60",
    reviewCount: 132,
    isFeatured: false,
    photos: [],
    hours: {
      monday: "10:00 AM - 7:00 PM",
      tuesday: "10:00 AM - 7:00 PM",
      wednesday: "10:00 AM - 7:00 PM",
      thursday: "10:00 AM - 7:00 PM",
      friday: "10:00 AM - 8:00 PM",
      saturday: "10:00 AM - 8:00 PM",
      sunday: "11:00 AM - 6:00 PM",
    },
  },
  {
    name: "Chicago Pickleball Academy",
    slug: "chicago-pickleball-academy",
    description: "Professional pickleball coaching and training programs. Private lessons, group clinics, and competitive training for tournament players.",
    address: "321 Lake Shore Dr",
    city: "Chicago",
    state: "IL",
    zip: "60601",
    phone: "(312) 555-0400",
    website: "https://chicagopickleballacademy.com",
    lat: "41.8781",
    lng: "-87.6298",
    neighborhood: "Loop",
    priceLevel: 3,
    ratingAvg: "4.90",
    reviewCount: 298,
    isFeatured: true,
    photos: [],
    hours: {
      monday: "6:00 AM - 9:00 PM",
      tuesday: "6:00 AM - 9:00 PM",
      wednesday: "6:00 AM - 9:00 PM",
      thursday: "6:00 AM - 9:00 PM",
      friday: "6:00 AM - 9:00 PM",
      saturday: "7:00 AM - 7:00 PM",
      sunday: "7:00 AM - 7:00 PM",
    },
  },
  {
    name: "Phoenix Pickleball League",
    slug: "phoenix-pickleball-league",
    description: "Year-round competitive and recreational pickleball leagues for all ages and skill levels. Join our vibrant community of players.",
    address: "4567 Camelback Rd",
    city: "Phoenix",
    state: "AZ",
    zip: "85018",
    phone: "(602) 555-0500",
    website: "https://phoenixpickleballleague.com",
    lat: "33.4484",
    lng: "-112.0740",
    neighborhood: "Arcadia",
    priceLevel: 2,
    ratingAvg: "4.75",
    reviewCount: 421,
    isFeatured: true,
    photos: [],
    hours: {
      monday: "6:00 AM - 10:00 PM",
      tuesday: "6:00 AM - 10:00 PM",
      wednesday: "6:00 AM - 10:00 PM",
      thursday: "6:00 AM - 10:00 PM",
      friday: "6:00 AM - 10:00 PM",
      saturday: "6:00 AM - 10:00 PM",
      sunday: "6:00 AM - 10:00 PM",
    },
  },
];

async function seed() {
  console.log("🏓 Starting US Pickleball Directory database seed...");

  try {
    // Seed states (Top 25 US states)
    console.log("📍 Seeding states...");
    const statesData = getAllStates();
    const insertedStates = await db.insert(states).values(statesData).returning();
    console.log(`✅ Inserted ${insertedStates.length} states`);

    // Create state lookup map
    const stateMap = new Map(insertedStates.map(s => [s.code, s.id]));

    // Seed cities (Cities with population > 10k)
    console.log("🏙️ Seeding cities...");
    const citiesData = getAllCities().map(city => ({
      name: city.name,
      stateId: stateMap.get(city.stateCode)!,
      population: city.population,
      slug: city.slug,
      lat: city.lat.toString(),
      lng: city.lng.toString(),
    }));
    const insertedCities = await db.insert(cities).values(citiesData).returning();
    console.log(`✅ Inserted ${insertedCities.length} cities`);

    // Seed pickleball categories
    console.log("🎾 Seeding pickleball categories...");
    const insertedCategories = await db.insert(categories).values(pickleballCategories).returning();
    console.log(`✅ Inserted ${insertedCategories.length} pickleball categories`);

    // Create category lookup map
    const categoryMap = new Map(insertedCategories.map(c => [c.slug, c.id]));

    // Seed sample pickleball businesses
    console.log("🏢 Seeding sample pickleball businesses...");
    const categorySlugs = [
      "pickleball-courts-facilities",
      "pickleball-courts-facilities",
      "pickleball-equipment-stores",
      "pickleball-coaches-instructors",
      "pickleball-clubs-leagues",
    ];
    
    const businessesWithCategories = samplePickleballBusinesses.map((business, index) => ({
      ...business,
      categoryId: categoryMap.get(categorySlugs[index])!,
    }));

    const insertedBusinesses = await db.insert(businesses).values(businessesWithCategories).returning();
    console.log(`✅ Inserted ${insertedBusinesses.length} sample pickleball businesses`);

    // Create a demo user
    console.log("👤 Creating demo user...");
    const hashedPassword = await bcrypt.hash("demo123", 10);
    const [demoUser] = await db.insert(users).values({
      email: "demo@pickleballcourts.io",
      passwordHash: hashedPassword,
      name: "Demo User",
      role: "user",
    }).returning();
    console.log(`✅ Created demo user: ${demoUser.email}`);

    // Create an admin user
    console.log("👑 Creating admin user...");
    const adminPassword = await bcrypt.hash("admin123", 10);
    const [adminUser] = await db.insert(users).values({
      email: "admin@pickleballcourts.io",
      passwordHash: adminPassword,
      name: "Admin User",
      role: "admin",
    }).returning();
    console.log(`✅ Created admin user: ${adminUser.email}`);

    console.log("\n🎉 Seed completed successfully!");
    console.log("\n📋 Summary:");
    console.log(`   - States: ${insertedStates.length}`);
    console.log(`   - Cities: ${insertedCities.length}`);
    console.log(`   - Pickleball Categories: ${insertedCategories.length}`);
    console.log(`   - Sample Businesses: ${insertedBusinesses.length}`);
    console.log(`   - Users: 2`);
    console.log("\n🔐 Login Credentials:");
    console.log(`   Demo: demo@pickleballcourts.io / demo123`);
    console.log(`   Admin: admin@pickleballcourts.io / admin123`);
    console.log("\n🏓 US Pickleball Directory is ready!");
    console.log("   Run migrations: npm run db:push");
    console.log("   Then seed: npm run db:seed");

  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();
