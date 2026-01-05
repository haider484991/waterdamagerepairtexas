import { NextResponse } from "next/server";
import { db, businessClaims } from "@/lib/db";
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
      .set({ status: "rejected", updatedAt: new Date() })
      .where(eq(businessClaims.id, id));

    return NextResponse.json({
      message: "Claim rejected",
    });
  } catch (error) {
    console.error("Error rejecting claim:", error);
    return NextResponse.json(
      { error: "Failed to reject claim" },
      { status: 500 }
    );
  }
}

