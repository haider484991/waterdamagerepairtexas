import type { Metadata } from "next";
import { ReactNode } from "react";
import { db, categories, businesses } from "@/lib/db";
import { eq, desc, sql } from "drizzle-orm";
import { generateCategoryMetadata } from "@/lib/seo";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://pickleballcourts.io";

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ slug: string }>;
};

async function getCategorySeoData(slug: string) {
  const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
  if (!category) return null;

  const [stats] = await db
    .select({
      count: sql<number>`count(*)`,
      avgRating: sql<number>`COALESCE(AVG(${businesses.ratingAvg}), 0)`,
      totalReviews: sql<number>`COALESCE(SUM(${businesses.reviewCount}), 0)`,
    })
    .from(businesses)
    .where(eq(businesses.categoryId, category.id));

  const topBusinesses = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      slug: businesses.slug,
      address: businesses.address,
      city: businesses.city,
      state: businesses.state,
      rating: businesses.ratingAvg,
      reviews: businesses.reviewCount,
    })
    .from(businesses)
    .where(eq(businesses.categoryId, category.id))
    .orderBy(desc(businesses.ratingAvg))
    .limit(10);

  return {
    category,
    stats: {
      count: Number(stats?.count || 0),
      avgRating: Number(stats?.avgRating || 0),
      totalReviews: Number(stats?.totalReviews || 0),
    },
    topBusinesses,
  };
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCategorySeoData(slug);

  if (!data) {
    return {
      title: "Category Not Found | US Pickleball Directory",
      description: "The category you are looking for could not be found.",
    };
  }

  const { category, stats } = data;
  const dynamicMetadata = generateCategoryMetadata(
    category,
    stats.count,
    {
      avgRating: stats.avgRating,
      totalReviews: stats.totalReviews,
    }
  );

  const title = dynamicMetadata.title as string;
  const description = dynamicMetadata.description as string;
  const canonical = `${SITE_URL}/categories/${category.slug}`;

  return {
    ...dynamicMetadata,
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      ...(dynamicMetadata.openGraph || {}),
      url: canonical,
      title,
      description,
    },
    twitter: {
      title,
      description,
    },
  };
}

export default async function CategoryLayout({ children, params }: LayoutProps) {
  const { slug } = await params;
  const data = await getCategorySeoData(slug);

  // Fallback to rendering children even if category not found (client handles error UI)
  const itemListSchema =
    data && data.topBusinesses.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `${data.category.name} Directory`,
          itemListOrder: "Descending",
          numberOfItems: data.topBusinesses.length,
          itemListElement: data.topBusinesses.map((b, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: `${SITE_URL}/business/${b.slug}`,
            name: b.name,
            address: `${b.address}, ${b.city}, ${b.state}`,
            aggregateRating: b.rating
              ? {
                  "@type": "AggregateRating",
                  ratingValue: Number(b.rating),
                  reviewCount: b.reviews || 0,
                }
              : undefined,
          })),
        }
      : null;

  const breadcrumbSchema = data
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Categories",
            item: `${SITE_URL}/categories`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: `${data.category.name} Directory`,
            item: `${SITE_URL}/categories/${data.category.slug}`,
          },
        ],
      }
    : null;

  return (
    <>
      {itemListSchema && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
      )}
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}
      {children}
    </>
  );
}

