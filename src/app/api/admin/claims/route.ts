import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, businessClaims, businesses, users } from "@/lib/db";
import { eq, desc } from "drizzle-orm";

// Check if user is admin
function isAdmin(email: string | null | undefined) {
  if (!email) return false;
  return (
    email === "admin@plano.directory" ||
    email.endsWith("@admin.com") ||
    email === "admin@test.com"
  );
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const claims = await db
      .select({
        id: businessClaims.id,
        status: businessClaims.status,
        businessRole: businessClaims.businessRole,
        phone: businessClaims.phone,
        notes: businessClaims.notes,
        createdAt: businessClaims.createdAt,
        userId: businessClaims.userId,
        businessId: businessClaims.businessId,
        userName: users.name,
        userEmail: users.email,
        businessName: businesses.name,
        businessSlug: businesses.slug,
        businessAddress: businesses.address,
      })
      .from(businessClaims)
      .leftJoin(users, eq(businessClaims.userId, users.id))
      .leftJoin(businesses, eq(businessClaims.businessId, businesses.id))
      .orderBy(desc(businessClaims.createdAt));

    const formattedClaims = claims.map((c) => ({
      id: c.id,
      status: c.status,
      businessRole: c.businessRole,
      phone: c.phone,
      notes: c.notes,
      createdAt: c.createdAt,
      user: {
        id: c.userId,
        name: c.userName,
        email: c.userEmail,
      },
      business: {
        id: c.businessId,
        name: c.businessName,
        slug: c.businessSlug,
        address: c.businessAddress,
      },
    }));

    return NextResponse.json({ claims: formattedClaims });
  } catch (error) {
    console.error("Error fetching claims:", error);
    return NextResponse.json(
      { error: "Failed to fetch claims" },
      { status: 500 }
    );
  }
}

