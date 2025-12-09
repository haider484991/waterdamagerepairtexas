import { NextResponse } from "next/server";
import { db, businesses } from "@/lib/db";
import { eq } from "drizzle-orm";
import { generateBusinessContent } from "@/lib/content-generator";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Find business by slug
    const business = await db.query.businesses.findFirst({
      where: eq(businesses.slug, slug),
      with: {
        category: true,
      },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Generate dynamic content
    const content = generateBusinessContent(business, business.category);

    return NextResponse.json(content);
  } catch (error) {
    console.error("Error generating business content:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}
