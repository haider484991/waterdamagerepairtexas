"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export function useFavorites() {
  const { data: session } = useSession();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user's favorites
  useEffect(() => {
    async function fetchFavorites() {
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/favorites");
        if (response.ok) {
          const data = await response.json();
          const favoriteIds = new Set(
            data.map((f: { business: { id: string } }) => f.business.id)
          );
          setFavorites(favoriteIds as Set<string>);
        }
      } catch (error) {
        console.error("Error fetching favorites:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFavorites();
  }, [session]);

  const toggleFavorite = useCallback(
    async (businessId: string) => {
      if (!session?.user) {
        toast.error("Please sign in to save favorites");
        return;
      }

      const isFavorited = favorites.has(businessId);

      // Optimistic update
      setFavorites((prev) => {
        const newSet = new Set(prev);
        if (isFavorited) {
          newSet.delete(businessId);
        } else {
          newSet.add(businessId);
        }
        return newSet;
      });

      try {
        if (isFavorited) {
          await fetch(`/api/favorites?businessId=${businessId}`, {
            method: "DELETE",
          });
          toast.success("Removed from favorites");
        } else {
          await fetch("/api/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ businessId }),
          });
          toast.success("Added to favorites");
        }
      } catch (error) {
        // Revert on error
        setFavorites((prev) => {
          const newSet = new Set(prev);
          if (isFavorited) {
            newSet.add(businessId);
          } else {
            newSet.delete(businessId);
          }
          return newSet;
        });
        toast.error("Failed to update favorites");
      }
    },
    [session, favorites]
  );

  const isFavorited = useCallback(
    (businessId: string) => favorites.has(businessId),
    [favorites]
  );

  return {
    favorites,
    isLoading,
    toggleFavorite,
    isFavorited,
  };
}

