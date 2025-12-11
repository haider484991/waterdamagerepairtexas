import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, businesses } from "@/lib/db";
import { eq } from "drizzle-orm";

function isAdmin(email: string | null | undefined) {
  if (!email) return false;
  return (
    email === "admin@uspickleballdirectory.com" ||
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

