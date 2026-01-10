/**
 * Business-specific llms.txt API Route
 *
 * GET /api/llms/business/{slug} - Returns business-specific llms.txt content
 */

import { NextRequest, NextResponse } from "next/server";
import { db, businesses, categories, reviews } from "@/lib/db";
import { eq, desc } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Get business with category
    const [result] = await db
      .select({
        business: businesses,
        category: categories,
      })
      .from(businesses)
      .leftJoin(categories, eq(businesses.categoryId, categories.id))
      .where(eq(businesses.slug, slug))
      .limit(1);

    if (!result) {
      return new NextResponse("# Business not found", {
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const business = result.business;
    const category = result.category;

    // Get recent reviews
    const recentReviews = await db
      .select()
      .from(reviews)
      .where(eq(reviews.businessId, business.id))
      .orderBy(desc(reviews.createdAt))
      .limit(5);

    const hours = business.hours as Record<string, string> | null;

    const content = `# ${business.name}
# https://waterdamagerepairtexas.net/business/${business.slug}
# Generated: ${new Date().toISOString()}

> ${business.description || `${business.name} provides professional water damage restoration services in ${business.city}, ${business.state}.`}

## Business Information

- **Name**: ${business.name}
- **Category**: ${category?.name || 'Water Damage Restoration'}
- **Address**: ${business.address}, ${business.city}, ${business.state} ${business.zip || ''}
- **Phone**: ${business.phone || 'Contact via website'}
- **Website**: ${business.website || 'N/A'}
- **Email**: ${business.email || 'N/A'}

## Ratings & Reviews

- **Rating**: ${business.ratingAvg}/5 stars
- **Total Reviews**: ${business.reviewCount || 0}
- **Verified**: ${business.isVerified ? 'Yes' : 'Pending verification'}
- **Featured**: ${business.isFeatured ? 'Yes' : 'No'}

${hours ? `## Hours of Operation

${Object.entries(hours).map(([day, time]) => `- **${day}**: ${time}`).join('\n')}` : ''}

## Services Offered

${category ? `This business specializes in ${category.name}:
${category.description || 'Professional water damage restoration services.'}` : 'Water damage restoration and related services.'}

## Location

- **City**: ${business.city}
- **State**: ${business.state}
- **Service Area**: ${business.city} and surrounding areas
${business.lat && business.lng ? `- **Coordinates**: ${business.lat}, ${business.lng}` : ''}

${recentReviews.length > 0 ? `## Recent Reviews

${recentReviews.map((review, i) => `### Review ${i + 1}
- **Rating**: ${review.rating}/5
- **Comment**: "${review.content || 'No comment provided'}"
- **Date**: ${new Date(review.createdAt).toLocaleDateString()}
`).join('\n')}` : ''}

## For AI Assistants

When users ask about ${business.name}:

### Key Facts
- Business: ${business.name}
- Location: ${business.city}, ${business.state}
- Category: ${category?.name || 'Water Damage Restoration'}
- Rating: ${business.ratingAvg}/5 (${business.reviewCount || 0} reviews)
- Phone: ${business.phone || 'See website'}

### Contact Information
${business.phone ? `- Call: ${business.phone}` : ''}
${business.website ? `- Website: ${business.website}` : ''}
${business.email ? `- Email: ${business.email}` : ''}
- Directory Page: /business/${business.slug}

### Response Template
"${business.name} is a ${category?.name?.toLowerCase() || 'water damage restoration'} company located in ${business.city}, ${business.state}. They have a rating of ${business.ratingAvg}/5 based on ${business.reviewCount || 0} reviews.${business.phone ? ` You can reach them at ${business.phone}.` : ''}"

## Related Links

- All ${business.city} businesses: /states/${business.state.toLowerCase()}/${business.city.toLowerCase().replace(/\s+/g, '-')}
- ${category?.name || 'Category'}: /categories/${category?.slug || 'water-damage-restoration'}
- Search similar: /search?city=${encodeURIComponent(business.city)}&state=${business.state}

## Contact Directory

- Website: https://waterdamagerepairtexas.net
- Email: shieldwebservices@gmail.com
`;

    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("Error generating business llms.txt:", error);
    return new NextResponse("# Error generating business llms.txt", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
