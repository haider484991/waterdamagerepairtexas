import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, businessClaims, businesses } from "@/lib/db";
import { eq, and } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { businessId, role, phone, email, notes } = body;

    if (!businessId || !role || !phone) {
      return NextResponse.json(
        { error: "Business ID, role, and phone are required" },
        { status: 400 }
      );
    }

    // Check if business exists
    const business = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (business.length === 0) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    // Check if business is already claimed
    if (business[0].claimedBy) {
      return NextResponse.json(
        { error: "This business has already been claimed" },
        { status: 409 }
      );
    }

    // Check if user already has a pending claim
    const existingClaim = await db
      .select()
      .from(businessClaims)
      .where(
        and(
          eq(businessClaims.businessId, businessId),
          eq(businessClaims.userId, session.user.id),
          eq(businessClaims.status, "pending")
        )
      )
      .limit(1);

    if (existingClaim.length > 0) {
      return NextResponse.json(
        { error: "You already have a pending claim for this business" },
        { status: 409 }
      );
    }

    // Generate verification code
    const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Create claim
    const [newClaim] = await db
      .insert(businessClaims)
      .values({
        businessId,
        userId: session.user.id,
        status: "pending",
        verificationCode,
        businessRole: role,
        phone,
        notes: notes || null,
      })
      .returning();

    return NextResponse.json(
      {
        message: "Claim request submitted successfully",
        claim: newClaim,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating claim:", error);
    return NextResponse.json(
      { error: "Failed to create claim" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user's claims
    const claims = await db
      .select({
        claim: businessClaims,
        business: businesses,
      })
      .from(businessClaims)
      .leftJoin(businesses, eq(businessClaims.businessId, businesses.id))
      .where(eq(businessClaims.userId, session.user.id));

    const formattedClaims = claims.map((c) => ({
      ...c.claim,
      business: c.business,
    }));

    return NextResponse.json(formattedClaims);
  } catch (error) {
    console.error("Error fetching claims:", error);
    return NextResponse.json(
      { error: "Failed to fetch claims" },
      { status: 500 }
    );
  }
}
