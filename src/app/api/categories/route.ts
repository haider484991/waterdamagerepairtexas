import { NextResponse } from "next/server";
import { db, categories } from "@/lib/db";
import { asc } from "drizzle-orm";

export async function GET() {
  try {
    const allCategories = await db
      .select()
      .from(categories)
      .orderBy(asc(categories.displayOrder), asc(categories.name));

    return NextResponse.json({ categories: allCategories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories", categories: [] }, { status: 500 });
  }
}

