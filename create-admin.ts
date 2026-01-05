/**
 * Quick script to create admin user
 * Run with: npx tsx create-admin.ts
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db, users } from "./src/lib/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function createAdmin() {
  try {
    const adminEmail = "admin@pickleballcourts.io";
    const adminPassword = "admin123";

    // Check if admin already exists
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1);

    if (existing) {
      console.log("✅ Admin user already exists!");
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    // Create admin user
    const [admin] = await db
      .insert(users)
      .values({
        email: adminEmail,
        passwordHash,
        name: "Admin User",
        role: "admin",
      })
      .returning();

    console.log("✅ Admin user created successfully!");
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log("\n🔐 You can now login at: http://localhost:3000/login");
  } catch (error) {
    console.error("❌ Error creating admin:", error);
    process.exit(1);
  }
}

createAdmin();
