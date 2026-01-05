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

    // Delete the rejected business
    await db.delete(businesses).where(eq(businesses.id, id));

    return NextResponse.json({
      message: "Business rejected and removed",
    });
  } catch (error) {
    console.error("Error rejecting business:", error);
    return NextResponse.json(
      { error: "Failed to reject business" },
      { status: 500 }
    );
  }
}

