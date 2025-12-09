"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Heart,
  Loader2,
  Search,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { BusinessCard } from "@/components/business";
import { toast } from "sonner";

interface Business {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string;
  city: string;
  state: string;
  neighborhood: string | null;
  priceLevel: number | null;
  ratingAvg: string | null;
  reviewCount: number | null;
  photos: string[];
  googlePlaceId?: string | null;
  category: { name: string; slug: string } | null;
  favoritedAt: string;
}

export default function FavoritesPage() {
  const { data: session, status } = useSession();
  const [favorites, setFavorites] = useState<Business[]>([]);
  const [filteredFavorites, setFilteredFavorites] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchFavorites() {
      try {
        const response = await fetch("/api/user/favorites");
        const data = await response.json();
        setFavorites(data.favorites || []);
        setFilteredFavorites(data.favorites || []);
      } catch (error) {
        console.error("Error fetching favorites:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (session?.user) {
      fetchFavorites();
    }
  }, [session]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = favorites.filter(
        (f) =>
          f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.category?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFavorites(filtered);
    } else {
      setFilteredFavorites(favorites);
    }
  }, [searchQuery, favorites]);

  const handleRemoveFavorite = async (businessId: string) => {
    try {
      const response = await fetch("/api/user/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });

      if (response.ok) {
        setFavorites((prev) => prev.filter((f) => f.id !== businessId));
        toast.success("Removed from favorites");
      }
    } catch (error) {
      toast.error("Failed to remove favorite");
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    redirect("/login?callbackUrl=/dashboard/favorites");
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                <Heart className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">My Favorites</h1>
                <p className="text-muted-foreground">
                  {favorites.length} saved businesses
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search favorites..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </motion.div>

        {/* Favorites Grid */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="rounded-xl overflow-hidden">
                <Skeleton className="h-44 w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredFavorites.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredFavorites.map((business, index) => (
              <motion.div
                key={business.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative group"
              >
                <BusinessCard
                  business={business as any}
                  isFavorited
                  onFavoriteClick={() => handleRemoveFavorite(business.id)}
                />
                <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="destructive"
                    size="icon"
                    className="w-8 h-8"
                    onClick={() => handleRemoveFavorite(business.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="glass-card rounded-xl p-12 text-center">
            <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery ? "No matches found" : "No favorites yet"}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {searchQuery
                ? "Try a different search term"
                : "Save businesses you love to easily find them later. Click the heart icon on any business to add it to your favorites."}
            </p>
            {!searchQuery && (
              <Button asChild>
                <Link href="/search">Discover Businesses</Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

