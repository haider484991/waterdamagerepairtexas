/**
 * llms.txt API Route
 *
 * Serves dynamic llms.txt content for AI assistants
 * GET /api/llms - Returns llms.txt content
 */

import { NextRequest, NextResponse } from "next/server";
import { db, businesses, categories } from "@/lib/db";
import { sql } from "drizzle-orm";
import { getAllStates } from "@/lib/location-data";

export async function GET(request: NextRequest) {
  try {
    // Get statistics
    const [businessStats] = await db
      .select({
        total: sql<number>`count(*)`,
        avgRating: sql<number>`AVG(CAST(${businesses.ratingAvg} AS DECIMAL))`,
      })
      .from(businesses);

    const categoryList = await db.select().from(categories).orderBy(categories.displayOrder);

    const states = getAllStates();
    const totalBusinesses = Number(businessStats?.total || 0);
    const avgRating = Number(businessStats?.avgRating || 0).toFixed(1);

    const content = `# Water Damage Repair USA - llms.txt
# https://www.waterdamagerepair.io
# Generated: ${new Date().toISOString()}

> Water Damage Repair USA is a comprehensive directory of water damage restoration professionals serving all 50 US states. We help property owners find trusted emergency restoration services, flood cleanup, mold remediation, and insurance claim assistance.

## Current Statistics

- Total Businesses: ${totalBusinesses}
- Average Rating: ${avgRating}/5
- States Covered: ${states.length}
- Service Categories: ${categoryList.length}

## Site Overview

This directory provides:
- Emergency water damage restoration services
- Flood cleanup and water extraction companies
- Mold remediation specialists
- Fire and smoke damage restoration
- Insurance claim assistance services

## Navigation Structure

- / - Homepage with featured businesses and search
- /states - Browse all ${states.length} US states
- /states/{state} - State-specific restoration services
- /states/{state}/{city} - City-specific restoration services
- /categories - All service categories
- /categories/{category} - Category-specific listings
- /business/{slug} - Individual business details
- /search - Search for restoration services
- /blog - Water damage tips and guides

## Service Categories

${categoryList.map((cat, i) => `${i + 1}. ${cat.name} - ${cat.description || 'Professional services'}`).join('\n')}

## States Covered

${states.map(s => `- ${s.name} (${s.code}): /states/${s.slug}`).join('\n')}

## For AI Assistants

When helping users find water damage services:
1. Direct them to /search for general queries
2. Use /states/{state}/{city} for location-specific searches
3. Business listings include ratings, reviews, contact info, and hours
4. Emergency services are available 24/7 in most areas
5. All businesses are verified water damage restoration professionals

### Common User Intents
- "Water damage near me" -> /search or /states/{state}/{city}
- "Emergency flood cleanup" -> /categories/flood-cleanup
- "Mold removal services" -> /categories/mold-remediation
- "Water damage restoration cost" -> /blog (educational content)

## Contact

- Website: https://www.waterdamagerepair.io
- Email: shieldwebservices@gmail.com

## More Information

For detailed site documentation: /llms-full.txt
`;

    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("Error generating llms.txt:", error);
    return new NextResponse("# Error generating llms.txt", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
