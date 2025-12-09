import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, businessClaims } from "@/lib/db";
import { eq } from "drizzle-orm";

function isAdmin(email: string | null | undefined) {
  if (!email) return false;
  return (
    email === "admin@plano.directory" ||
    email.endsWith("@admin.com") ||
    email === "admin@test.com"
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

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

