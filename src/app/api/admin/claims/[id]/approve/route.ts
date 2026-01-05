import { NextResponse } from "next/server";
import { db, businessClaims, businesses } from "@/lib/db";
import { eq } from "drizzle-orm";
import { verifyAdmin } from "@/lib/auth/utils";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdmin();

    const { id } = await params;

    // Get the claim
    const [claim] = await db
      .select()
      .from(businessClaims)
      .where(eq(businessClaims.id, id))
      .limit(1);

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    // Update claim status
    await db
      .update(businessClaims)
      .set({ status: "approved", updatedAt: new Date() })
      .where(eq(businessClaims.id, id));

    // Update business to mark as claimed
    await db
      .update(businesses)
      .set({
        claimedBy: claim.userId,
        isVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(businesses.id, claim.businessId));

    return NextResponse.json({
      message: "Claim approved successfully",
    });
  } catch (error) {
    console.error("Error approving claim:", error);
    return NextResponse.json(
      { error: "Failed to approve claim" },
      { status: 500 }
    );
  }
}

