import { NextResponse } from "next/server";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// This endpoint creates an admin user
// In production, this should be protected or removed
export async function POST(request: Request) {
  try {
    const { secretKey } = await request.json();

    // Simple protection - require a secret key
    // In production, use environment variable
    if (secretKey !== "create-admin-2024" && secretKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminEmail = "admin@uspickleballdirectory.com";
    const adminPassword = "Admin123!"; // Change this after first login

    // Check if admin already exists
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({
        message: "Admin user already exists",
        email: adminEmail,
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    // Create admin user
    const [admin] = await db
      .insert(users)
      .values({
        email: adminEmail,
        passwordHash,
        name: "Admin",
        role: "admin",
      })
      .returning();

    return NextResponse.json({
      message: "Admin user created successfully",
      email: adminEmail,
      tempPassword: adminPassword,
      note: "Please change the password after first login!",
    });
  } catch (error) {
    console.error("Error creating admin:", error);
    return NextResponse.json(
      { error: "Failed to create admin user" },
      { status: 500 }
    );
  }
}

