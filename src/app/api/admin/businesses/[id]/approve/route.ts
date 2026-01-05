import { NextResponse } from "next/server";
import { db, businesses } from "@/lib/db";
import { eq } from "drizzle-orm";
import { verifyAdmin } from "@/lib/auth/utils";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdmin();

    const { id } = await params;

    // Update business to verified
    await db
      .update(businesses)
      .set({
        isVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(businesses.id, id));

    return NextResponse.json({
      message: "Business approved and published",
    });
  } catch (error) {
    console.error("Error approving business:", error);
    return NextResponse.json(
      { error: "Failed to approve business" },
      { status: 500 }
    );
  }
}

