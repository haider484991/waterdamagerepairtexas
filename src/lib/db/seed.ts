import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as dotenv from "dotenv";
import { categories, businesses, users, states, cities } from "./schema";
import bcrypt from "bcryptjs";
import { getAllStates, getAllCities } from "../location-data";

dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

// Water damage restoration categories (5 categories for USA)
const waterDamageCategories = [
  {
    name: "Water Damage Restoration",
    slug: "water-damage-restoration",
    icon: "Droplets",
    description: "Professional water damage restoration services including water extraction, structural drying, dehumidification, and property restoration across the USA",
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
    description: "Storm damage repair services including wind damage, hail damage, hurricane damage, and tornado damage restoration across the USA",
    section: "Repair",
    displayOrder: 5,
  },
];

// Sample water damage restoration businesses from US cities
const sampleWaterDamageBusinesses = [
  {
    name: "Houston Water Damage Pros",
    slug: "houston-water-damage-pros",
    description: "Premier water damage restoration company in Houston providing 24/7 emergency services, water extraction, and structural drying.",
    address: "1234 Westheimer Rd",
    city: "Houston",
    state: "TX",
    zip: "77006",
    phone: "(713) 555-0100",
    website: "https://houstonwaterdamagepros.com",
    lat: "29.7604",
    lng: "-95.3698",
    neighborhood: "Montrose",
    priceLevel: 2,
    ratingAvg: "4.70",
    reviewCount: 187,
    isFeatured: true,
    photos: [],
    hours: {
      monday: "Open 24 hours",
      tuesday: "Open 24 hours",
      wednesday: "Open 24 hours",
      thursday: "Open 24 hours",
      friday: "Open 24 hours",
      saturday: "Open 24 hours",
      sunday: "Open 24 hours",
    },
  },
  {
    name: "Austin Flood Recovery",
    slug: "austin-flood-recovery",
    description: "Central Texas's trusted flood cleanup and water damage restoration experts. Fast response, professional service.",
    address: "5678 Congress Ave",
    city: "Austin",
    state: "TX",
    zip: "78701",
    phone: "(512) 555-0200",
    website: "https://austinfloodrecovery.com",
    lat: "30.2672",
    lng: "-97.7431",
    neighborhood: "Downtown",
    priceLevel: 2,
    ratingAvg: "4.80",
    reviewCount: 245,
    isFeatured: true,
    photos: [],
    hours: {
      monday: "Open 24 hours",
      tuesday: "Open 24 hours",
      wednesday: "Open 24 hours",
      thursday: "Open 24 hours",
      friday: "Open 24 hours",
      saturday: "Open 24 hours",
      sunday: "Open 24 hours",
    },
  },
  {
    name: "DFW Mold Remediation",
    slug: "dfw-mold-remediation",
    description: "Expert mold inspection, testing, and remediation services for Dallas-Fort Worth. Certified professionals ensure safe environments.",
    address: "9876 Commerce St",
    city: "Dallas",
    state: "TX",
    zip: "75201",
    phone: "(214) 555-0300",
    website: "https://dfwmoldremediation.com",
    lat: "32.7767",
    lng: "-96.7970",
    neighborhood: "Deep Ellum",
    priceLevel: 2,
    ratingAvg: "4.60",
    reviewCount: 132,
    isFeatured: false,
    photos: [],
    hours: {
      monday: "7:00 AM - 7:00 PM",
      tuesday: "7:00 AM - 7:00 PM",
      wednesday: "7:00 AM - 7:00 PM",
      thursday: "7:00 AM - 7:00 PM",
      friday: "7:00 AM - 7:00 PM",
      saturday: "8:00 AM - 5:00 PM",
      sunday: "Closed",
    },
  },
  {
    name: "San Antonio Emergency Restoration",
    slug: "san-antonio-emergency-restoration",
    description: "24/7 emergency water damage and storm damage restoration. Rapid response team serving all of San Antonio and surrounding areas.",
    address: "321 River Walk",
    city: "San Antonio",
    state: "TX",
    zip: "78205",
    phone: "(210) 555-0400",
    website: "https://saemergencyrestoration.com",
    lat: "29.4241",
    lng: "-98.4936",
    neighborhood: "River Walk",
    priceLevel: 3,
    ratingAvg: "4.90",
    reviewCount: 298,
    isFeatured: true,
    photos: [],
    hours: {
      monday: "Open 24 hours",
      tuesday: "Open 24 hours",
      wednesday: "Open 24 hours",
      thursday: "Open 24 hours",
      friday: "Open 24 hours",
      saturday: "Open 24 hours",
      sunday: "Open 24 hours",
    },
  },
  {
    name: "Fort Worth Storm Damage Repair",
    slug: "fort-worth-storm-damage-repair",
    description: "Comprehensive storm damage repair including roof repair, hail damage, and wind damage restoration for Fort Worth area.",
    address: "4567 Main St",
    city: "Fort Worth",
    state: "TX",
    zip: "76102",
    phone: "(817) 555-0500",
    website: "https://fwstormdamage.com",
    lat: "32.7555",
    lng: "-97.3308",
    neighborhood: "Sundance Square",
    priceLevel: 2,
    ratingAvg: "4.75",
    reviewCount: 421,
    isFeatured: true,
    photos: [],
    hours: {
      monday: "Open 24 hours",
      tuesday: "Open 24 hours",
      wednesday: "Open 24 hours",
      thursday: "Open 24 hours",
      friday: "Open 24 hours",
      saturday: "Open 24 hours",
      sunday: "Open 24 hours",
    },
  },
];

async function seed() {
  console.log("💧 Starting Water Damage Repair USA database seed...");

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

    // Seed water damage categories
    console.log("💧 Seeding water damage categories...");
    const insertedCategories = await db.insert(categories).values(waterDamageCategories).returning();
    console.log(`✅ Inserted ${insertedCategories.length} water damage categories`);

    // Create category lookup map
    const categoryMap = new Map(insertedCategories.map(c => [c.slug, c.id]));

    // Seed sample water damage businesses
    console.log("🏢 Seeding sample water damage businesses...");
    const categorySlugs = [
      "water-damage-restoration",
      "flood-cleanup",
      "mold-remediation",
      "emergency-services",
      "storm-damage",
    ];

    const businessesWithCategories = sampleWaterDamageBusinesses.map((business, index) => ({
      ...business,
      categoryId: categoryMap.get(categorySlugs[index])!,
    }));

    const insertedBusinesses = await db.insert(businesses).values(businessesWithCategories).returning();
    console.log(`✅ Inserted ${insertedBusinesses.length} sample water damage businesses`);

    // Create a demo user
    console.log("👤 Creating demo user...");
    const hashedPassword = await bcrypt.hash("demo123", 10);
    const [demoUser] = await db.insert(users).values({
      email: "demo@waterdamagerepairtexas.net",
      passwordHash: hashedPassword,
      name: "Demo User",
      role: "user",
    }).returning();
    console.log(`✅ Created demo user: ${demoUser.email}`);

    // Create an admin user
    console.log("👑 Creating admin user...");
    const adminPassword = await bcrypt.hash("admin123", 10);
    const [adminUser] = await db.insert(users).values({
      email: "admin@waterdamagerepairtexas.net",
      passwordHash: adminPassword,
      name: "Admin User",
      role: "admin",
    }).returning();
    console.log(`✅ Created admin user: ${adminUser.email}`);

    console.log("\n🎉 Seed completed successfully!");
    console.log("\n📋 Summary:");
    console.log(`   - States: ${insertedStates.length}`);
    console.log(`   - Cities: ${insertedCities.length}`);
    console.log(`   - Water Damage Categories: ${insertedCategories.length}`);
    console.log(`   - Sample Businesses: ${insertedBusinesses.length}`);
    console.log(`   - Users: 2`);
    console.log("\n🔐 Login Credentials:");
    console.log(`   Demo: demo@waterdamagerepairtexas.net / demo123`);
    console.log(`   Admin: admin@waterdamagerepairtexas.net / admin123`);
    console.log("\n💧 Water Damage Repair USA is ready!");
    console.log("   Run migrations: npm run db:push");
    console.log("   Then seed: npm run db:seed");

  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();
