import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, businesses, categories } from "@/lib/db";
import { eq, desc, isNull, and } from "drizzle-orm";

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

    // Get unverified businesses submitted through website (not from API)
    // Only show businesses where googlePlaceId is null (website submissions)
    const pendingBusinesses = await db
      .select({
        id: businesses.id,
        name: businesses.name,
        slug: businesses.slug,
        description: businesses.description,
        address: businesses.address,
        city: businesses.city,
        state: businesses.state,
        phone: businesses.phone,
        website: businesses.website,
        email: businesses.email,
        neighborhood: businesses.neighborhood,
        priceLevel: businesses.priceLevel,
        isVerified: businesses.isVerified,
        createdAt: businesses.createdAt,
        categoryName: categories.name,
        categorySlug: categories.slug,
      })
      .from(businesses)
      .leftJoin(categories, eq(businesses.categoryId, categories.id))
      .where(
        and(
          eq(businesses.isVerified, false),
          isNull(businesses.googlePlaceId) // Only website submissions, not API businesses
        )
      )
      .orderBy(desc(businesses.createdAt));

    const formattedBusinesses = pendingBusinesses.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      description: b.description,
      address: b.address,
      city: b.city,
      state: b.state,
      phone: b.phone,
      website: b.website,
      email: b.email,
      neighborhood: b.neighborhood,
      priceLevel: b.priceLevel,
      isVerified: b.isVerified,
      createdAt: b.createdAt,
      category: b.categoryName
        ? { name: b.categoryName, slug: b.categorySlug }
        : null,
    }));

    return NextResponse.json({ businesses: formattedBusinesses });
  } catch (error) {
    console.error("Error fetching pending businesses:", error);
    return NextResponse.json(
      { error: "Failed to fetch businesses" },
      { status: 500 }
    );
  }
}

