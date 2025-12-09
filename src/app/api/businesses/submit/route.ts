import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, businesses, categories } from "@/lib/db";
import { eq } from "drizzle-orm";
import slugify from "slugify";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      address,
      city,
      state,
      zip,
      phone,
      website,
      email,
      category: categorySlug,
      neighborhood,
      priceLevel,
    } = body;

    if (!name || !address || !categorySlug) {
      return NextResponse.json(
        { error: "Name, address, and category are required" },
        { status: 400 }
      );
    }

    // Get category ID
    const [categoryData] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, categorySlug))
      .limit(1);

    if (!categoryData) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    // Generate unique slug
    let slug = slugify(name, { lower: true, strict: true });
    let counter = 1;
    while (true) {
      const existing = await db
        .select({ id: businesses.id })
        .from(businesses)
        .where(eq(businesses.slug, slug))
        .limit(1);
      if (existing.length === 0) break;
      slug = `${slugify(name, { lower: true, strict: true })}-${counter}`;
      counter++;
    }

    // Create business with pending status (isVerified = false)
    const [newBusiness] = await db
      .insert(businesses)
      .values({
        name,
        slug,
        description: description || null,
        address,
        city: city || "Plano",
        state: state || "TX",
        zip: zip || null,
        phone: phone || null,
        website: website || null,
        email: email || null,
        categoryId: categoryData.id,
        neighborhood: neighborhood || null,
        priceLevel: priceLevel ? parseInt(priceLevel) : null,
        isVerified: false, // Pending admin approval
        isFeatured: false,
        ratingAvg: "0",
        reviewCount: 0,
        photos: [],
      })
      .returning();

    return NextResponse.json(
      {
        message: "Business submitted successfully",
        business: newBusiness,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting business:", error);
    return NextResponse.json(
      { error: "Failed to submit business" },
      { status: 500 }
    );
  }
}

