import { Suspense } from "react";
import { getCategories } from "@/lib/local-data";
import { CategoriesPageClient } from "./CategoriesPageClient";
import { Skeleton } from "@/components/ui/skeleton";

export default async function CategoriesPage() {
  const allCategories = getCategories();

  return (
    <Suspense fallback={<CategoriesPageSkeleton />}>
      <CategoriesPageClient categories={allCategories} />
    </Suspense>
  );
}

function CategoriesPageSkeleton() {
  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Skeleton className="h-10 w-64 mx-auto mb-4" />
          <Skeleton className="h-5 w-96 mx-auto" />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
