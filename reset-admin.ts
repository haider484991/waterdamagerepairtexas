/**
 * Reset admin password script
 * Run with: npx tsx -r dotenv/config reset-admin.ts dotenv_config_path=.env.local
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db, users } from "./src/lib/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function resetAdmin() {
  try {
    const adminEmail = "admin@pickleballcourts.io";
    const adminPassword = "admin123";

    console.log("🔍 Checking for admin user...");

    // Check if admin exists
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1);

    if (existing) {
      console.log("✅ Admin user found! Resetting password...");
      
      // Hash new password
      const passwordHash = await bcrypt.hash(adminPassword, 12);

      // Update password
      await db
        .update(users)
        .set({
          passwordHash,
          role: "admin", // Ensure role is set
        })
        .where(eq(users.email, adminEmail));

      console.log("✅ Password reset successfully!");
      console.log(`\n📧 Email: ${adminEmail}`);
      console.log(`🔑 Password: ${adminPassword}`);
      console.log("\n🔐 You can now login at: http://localhost:3000/login");
    } else {
      console.log("❌ Admin user not found. Creating new admin...");
      
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
      console.log(`\n📧 Email: ${adminEmail}`);
      console.log(`🔑 Password: ${adminPassword}`);
      console.log("\n🔐 You can now login at: http://localhost:3000/login");
    }
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

resetAdmin();
