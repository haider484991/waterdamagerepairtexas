import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, favorites, businesses, categories } from "@/lib/db";
import { eq, and } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user's favorites with business details
    const userFavorites = await db
      .select({
        favorite: favorites,
        business: businesses,
        category: categories,
      })
      .from(favorites)
      .leftJoin(businesses, eq(favorites.businessId, businesses.id))
      .leftJoin(categories, eq(businesses.categoryId, categories.id))
      .where(eq(favorites.userId, session.user.id));

    const formattedFavorites = userFavorites.map((f) => ({
      id: f.favorite.id,
      createdAt: f.favorite.createdAt,
      business: {
        ...f.business,
        category: f.category,
      },
    }));

    return NextResponse.json(formattedFavorites);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return NextResponse.json(
      { error: "Failed to fetch favorites" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { businessId } = await request.json();

    if (!businessId) {
      return NextResponse.json(
        { error: "Business ID is required" },
        { status: 400 }
      );
    }

    // Check if already favorited
    const existing = await db
      .select()
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, session.user.id),
          eq(favorites.businessId, businessId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Already favorited" },
        { status: 409 }
      );
    }

    // Add favorite
    const [newFavorite] = await db
      .insert(favorites)
      .values({
        userId: session.user.id,
        businessId,
      })
      .returning();

    return NextResponse.json(newFavorite, { status: 201 });
  } catch (error) {
    console.error("Error adding favorite:", error);
    return NextResponse.json(
      { error: "Failed to add favorite" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json(
        { error: "Business ID is required" },
        { status: 400 }
      );
    }

    await db
      .delete(favorites)
      .where(
        and(
          eq(favorites.userId, session.user.id),
          eq(favorites.businessId, businessId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing favorite:", error);
    return NextResponse.json(
      { error: "Failed to remove favorite" },
      { status: 500 }
    );
  }
}

