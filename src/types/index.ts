import type { Business, Category, Review, User } from "@/lib/db/schema";

export interface BusinessWithCategory extends Business {
  category: Category | null;
}

export interface BusinessWithDetails extends Business {
  category: Category | null;
  reviews: ReviewWithUser[];
  reviewStats: ReviewStats;
}

export interface ReviewWithUser extends Review {
  user: Pick<User, "id" | "name" | "avatar">;
}

export interface ReviewStats {
  average: number;
  total: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface CategoryWithCount extends Category {
  businessCount: number;
}

export interface SearchFilters {
  category?: string;
  neighborhood?: string;
  rating?: number;
  priceLevel?: number;
  openNow?: boolean;
  sortBy?: "relevance" | "rating" | "reviews" | "distance" | "name";
  sortOrder?: "asc" | "desc";
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Neighborhood {
  name: string;
  slug: string;
  description?: string;
}

export const NEIGHBORHOODS: Neighborhood[] = [
  { name: "Legacy West", slug: "legacy-west", description: "Upscale mixed-use development with dining and shopping" },
  { name: "West Plano", slug: "west-plano", description: "Affluent area with major retail and residential communities" },
  { name: "East Plano", slug: "east-plano", description: "Diverse community with family-friendly amenities" },
  { name: "Downtown Plano", slug: "downtown-plano", description: "Historic arts district with unique shops and restaurants" },
  { name: "North Plano", slug: "north-plano", description: "Growing area near Frisco border" },
  { name: "South Plano", slug: "south-plano", description: "Established neighborhoods near Richardson" },
];

export interface CategorySection {
  name: string;
  categories: Category[];
}

export const CATEGORY_SECTIONS = [
  "Food & Dining",
  "Shopping & Retail",
  "Health & Wellness",
  "Professional Services",
  "Home & Auto",
  "Education & Family",
  "Entertainment & Leisure",
  "Business & Community",
  "Travel & Hospitality",
  "Technology & Innovation",
] as const;

export type CategorySectionType = typeof CATEGORY_SECTIONS[number];

