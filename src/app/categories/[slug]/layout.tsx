import type { Metadata } from "next";
import { ReactNode } from "react";
import { notFound } from "next/navigation";
import {
  getCategoryBySlug,
  getBusinessesByCategory,
} from "@/lib/local-data";
import { generateCategoryMetadata } from "@/lib/seo";
import { generateServiceSchema } from "@/lib/seo/schema-markup";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://waterdamagerepairusa.com";

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ slug: string }>;
};

function getCategorySeoData(slug: string) {
  const category = getCategoryBySlug(slug);
  if (!category) return null;

  const bizList = getBusinessesByCategory(slug, { sort: "rating", limit: 10 });

  let totalRating = 0;
  let totalReviews = 0;
  for (const b of bizList) {
    totalRating += parseFloat(b.ratingAvg);
    totalReviews += b.reviewCount;
  }

  // Get total count (not just top 10)
  const allBiz = getBusinessesByCategory(slug);

  return {
    category,
    stats: {
      count: allBiz.length,
      avgRating: allBiz.length > 0 ? totalRating / Math.min(allBiz.length, bizList.length) : 0,
      totalReviews,
    },
    topBusinesses: bizList.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      address: b.address,
      city: b.city,
      state: b.state,
      rating: b.ratingAvg,
      reviews: b.reviewCount,
    })),
  };
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { slug } = await params;
  const data = getCategorySeoData(slug);

  if (!data) {
    return {
      title: "Category Not Found | Water Damage Repair USA",
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
    other: {
      "llms-txt": `/api/llms/category/${category.slug}`,
    },
  };
}

export default async function CategoryLayout({ children, params }: LayoutProps) {
  const { slug } = await params;
  const data = getCategorySeoData(slug);

  if (!data) {
    notFound();
  }

  const itemListSchema =
    data.topBusinesses.length > 0
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

  const breadcrumbSchema = {
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
  };

  const serviceSchema = generateServiceSchema(data.category, data.stats.count);

  return (
    <>
      {itemListSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
      )}
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}
      {serviceSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
        />
      )}
      {children}
    </>
  );
}
