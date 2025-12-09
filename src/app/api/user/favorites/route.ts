import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, favorites, businesses, categories } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userFavorites = await db
      .select({
        favorite: favorites,
        business: businesses,
        category: categories,
      })
      .from(favorites)
      .leftJoin(businesses, eq(favorites.businessId, businesses.id))
      .leftJoin(categories, eq(businesses.categoryId, categories.id))
      .where(eq(favorites.userId, session.user.id))
      .orderBy(desc(favorites.createdAt));

    const formattedFavorites = userFavorites
      .filter(f => f.business)
      .map(f => ({
        ...f.business,
        photos: (f.business?.photos as string[]) || [],
        category: f.category ? {
          name: f.category.name,
          slug: f.category.slug,
        } : null,
        favoritedAt: f.favorite.createdAt,
      }));

    return NextResponse.json({ favorites: formattedFavorites });
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { businessId } = await request.json();

    if (!businessId) {
      return NextResponse.json(
        { error: "Business ID required" },
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
      // Remove favorite
      await db
        .delete(favorites)
        .where(
          and(
            eq(favorites.userId, session.user.id),
            eq(favorites.businessId, businessId)
          )
        );
      return NextResponse.json({ favorited: false });
    }

    // Add favorite
    await db.insert(favorites).values({
      userId: session.user.id,
      businessId,
    });

    return NextResponse.json({ favorited: true });
  } catch (error) {
    console.error("Error toggling favorite:", error);
    return NextResponse.json(
      { error: "Failed to toggle favorite" },
      { status: 500 }
    );
  }
}
