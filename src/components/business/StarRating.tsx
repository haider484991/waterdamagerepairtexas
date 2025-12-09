"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  reviewCount?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

const sizeClasses = {
  sm: "w-3.5 h-3.5",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

export function StarRating({
  rating,
  maxRating = 5,
  size = "md",
  showValue = false,
  reviewCount,
  interactive = false,
  onRatingChange,
}: StarRatingProps) {
  const stars = Array.from({ length: maxRating }, (_, i) => i + 1);

  const handleClick = (value: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(value);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {stars.map((star) => {
          const filled = star <= Math.floor(rating);
          const partial = !filled && star === Math.ceil(rating);
          const fillPercentage = partial ? (rating % 1) * 100 : 0;

          return (
            <button
              key={star}
              type="button"
              onClick={() => handleClick(star)}
              disabled={!interactive}
              className={cn(
                "relative",
                interactive && "cursor-pointer hover:scale-110 transition-transform",
                !interactive && "cursor-default"
              )}
            >
              {/* Background (empty) star */}
              <Star
                className={cn(sizeClasses[size], "star-empty")}
                strokeWidth={1.5}
              />
              {/* Filled star overlay */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: filled ? "100%" : `${fillPercentage}%` }}
              >
                <Star
                  className={cn(sizeClasses[size], "star-filled fill-current")}
                  strokeWidth={1.5}
                />
              </div>
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className="text-sm font-medium text-foreground ml-1">
          {rating.toFixed(1)}
        </span>
      )}
      {reviewCount !== undefined && (
        <span className="text-sm text-muted-foreground">
          ({reviewCount.toLocaleString()})
        </span>
      )}
    </div>
  );
}

