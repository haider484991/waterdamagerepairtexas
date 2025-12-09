"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Clock, Heart, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarRating } from "./StarRating";
import { PriceLevel } from "./PriceLevel";
import type { Business, Category } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { getImageUrl } from "@/lib/hybrid-data";

interface BusinessCardProps {
  business: Business & { 
    category?: Category | null;
    isOpenNow?: boolean;
    dataSource?: "hybrid" | "database" | "google";
    googlePlaceId?: string | null;
  };
  variant?: "default" | "compact" | "featured";
  onFavoriteClick?: (businessId: string) => void;
  isFavorited?: boolean;
}

// Get the best link for the business (prefer slug, fallback to googlePlaceId)
function getBusinessLink(business: BusinessCardProps["business"]): string {
  // If it's a real slug (not a temp one), use it
  if (business.slug && !business.slug.startsWith("temp-") && !business.slug.startsWith("ChIJ")) {
    return `/business/${business.slug}`;
  }
  // Otherwise use googlePlaceId
  if (business.googlePlaceId) {
    return `/business/${business.googlePlaceId}`;
  }
  // Fallback to slug anyway
  return `/business/${business.slug}`;
}

// Check if the image is from our proxy API (uses query string)
function isProxyImage(src: string): boolean {
  return src.startsWith("/api/images?");
}

export function BusinessCard({
  business,
  variant = "default",
  onFavoriteClick,
  isFavorited = false,
}: BusinessCardProps) {
  const mainImage = getImageUrl(business.photos?.[0]);

  // Use live isOpenNow from hybrid data, or check manually
  const isOpen = business.isOpenNow ?? checkIfOpen(business.hours);

  const businessLink = getBusinessLink(business);

  if (variant === "compact") {
    return (
      <Link href={businessLink}>
        <motion.div
          whileHover={{ y: -2 }}
          className="flex gap-4 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
        >
          <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-secondary">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mainImage}
              alt={business.name}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://placehold.co/400x300/f5f5f4/a3a3a3?text=No+Image";
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground line-clamp-1">
              {business.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <StarRating
                rating={Number(business.ratingAvg) || 0}
                size="sm"
                showValue
              />
            </div>
            <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
              {business.neighborhood || business.city}
            </p>
          </div>
        </motion.div>
      </Link>
    );
  }

  if (variant === "featured") {
    return (
      <Link href={businessLink}>
        <motion.div
          whileHover={{ y: -4 }}
          className="group relative rounded-2xl overflow-hidden bg-card border border-border/50 business-card"
        >
          <div className="relative h-56 bg-secondary">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mainImage}
              alt={business.name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://placehold.co/800x600/f5f5f4/a3a3a3?text=No+Image";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            {/* Featured badge */}
            <div className="absolute top-4 left-4">
              <Badge className="bg-primary text-primary-foreground">
                Featured
              </Badge>
            </div>

            {/* Favorite button */}
            {onFavoriteClick && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm"
                onClick={(e) => {
                  e.preventDefault();
                  onFavoriteClick(business.id);
                }}
              >
                <Heart
                  className={cn(
                    "w-5 h-5",
                    isFavorited ? "fill-red-500 text-red-500" : "text-white"
                  )}
                />
              </Button>
            )}

            {/* Content overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <h3 className="text-xl font-bold text-white mb-2">
                {business.name}
              </h3>
              <div className="flex items-center gap-3">
                <StarRating
                  rating={Number(business.ratingAvg) || 0}
                  size="sm"
                  showValue
                  reviewCount={business.reviewCount || 0}
                />
                {business.priceLevel && (
                  <PriceLevel level={business.priceLevel} size="sm" />
                )}
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="flex items-start gap-2 text-sm text-muted-foreground mb-3">
              <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="line-clamp-1">{business.address}</span>
            </div>
            
            {business.category && (
              <Badge variant="secondary" className="mb-3">
                {business.category.name}
              </Badge>
            )}

            {business.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {business.description}
              </p>
            )}

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span
                  className={cn(
                    "text-sm font-medium",
                    isOpen ? "text-green-600" : "text-red-600"
                  )}
                >
                  {isOpen ? "Open Now" : "Closed"}
                </span>
              </div>
              <span className="text-sm text-primary font-medium group-hover:underline">
                View Details
              </span>
            </div>
          </div>
        </motion.div>
      </Link>
    );
  }

  // Default variant
  return (
    <Link href={businessLink}>
      <motion.div
        whileHover={{ y: -4 }}
        className="group rounded-xl overflow-hidden bg-card border border-border/50 hover:border-primary/30 business-card"
      >
        <div className="relative h-44 bg-secondary">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mainImage}
            alt={business.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://placehold.co/400x300/f5f5f4/a3a3a3?text=No+Image";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Favorite button */}
          {onFavoriteClick && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm"
              onClick={(e) => {
                e.preventDefault();
                onFavoriteClick(business.id);
              }}
            >
              <Heart
                className={cn(
                  "w-4 h-4",
                  isFavorited ? "fill-red-500 text-red-500" : "text-white"
                )}
              />
            </Button>
          )}

          {/* Status badge */}
          <div className="absolute bottom-3 left-3">
            <Badge
              variant="secondary"
              className={cn(
                "text-xs",
                isOpen
                  ? "bg-green-500/90 text-white border-green-600"
                  : "bg-red-500/90 text-white border-red-600"
              )}
            >
              {isOpen ? "Open" : "Closed"}
            </Badge>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {business.name}
            </h3>
            {business.priceLevel && (
              <PriceLevel level={business.priceLevel} size="sm" />
            )}
          </div>

          <div className="flex items-center gap-2 mb-2">
            <StarRating
              rating={Number(business.ratingAvg) || 0}
              size="sm"
              showValue
              reviewCount={business.reviewCount || 0}
            />
          </div>

          {business.category && (
            <Badge variant="outline" className="text-xs mb-2">
              {business.category.name}
            </Badge>
          )}

          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="line-clamp-1">
              {business.neighborhood || business.city}
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

function checkIfOpen(hours?: Record<string, string> | null): boolean {
  if (!hours) return false;
  
  const now = new Date();
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const currentDay = days[now.getDay()];
  const todayHours = hours[currentDay];
  
  if (!todayHours || todayHours.toLowerCase() === "closed") return false;
  
  // Simple check - would need more robust parsing for production
  return true;
}

