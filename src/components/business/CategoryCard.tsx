"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Utensils,
  ShoppingBasket,
  Shirt,
  Sofa,
  Smartphone,
  Stethoscope,
  Dumbbell,
  Sparkles,
  Scale,
  Home,
  Hammer,
  Car,
  GraduationCap,
  Baby,
  PawPrint,
  Palette,
  Trees,
  Wine,
  Megaphone,
  Heart,
  Building2,
  Bed,
  Bus,
  Monitor,
  Building,
  LucideIcon,
} from "lucide-react";
import type { Category } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

const iconMap: Record<string, LucideIcon> = {
  Utensils,
  ShoppingBasket,
  Shirt,
  Sofa,
  Smartphone,
  Stethoscope,
  Dumbbell,
  Sparkles,
  Scale,
  Home,
  Hammer,
  Car,
  GraduationCap,
  Baby,
  PawPrint,
  Palette,
  Trees,
  Wine,
  Megaphone,
  Heart,
  Building2,
  Bed,
  Bus,
  Monitor,
  Building,
};

interface CategoryCardProps {
  category: Category & { businessCount?: number };
  variant?: "default" | "compact" | "large";
}

export function CategoryCard({ category, variant = "default" }: CategoryCardProps) {
  const Icon = iconMap[category.icon || "Building"] || Building;

  if (variant === "compact") {
    return (
      <Link href={`/categories/${category.slug}`}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-foreground text-sm line-clamp-1">
              {category.name}
            </h3>
            {category.businessCount !== undefined && (
              <p className="text-xs text-muted-foreground">
                {category.businessCount} businesses
              </p>
            )}
          </div>
        </motion.div>
      </Link>
    );
  }

  if (variant === "large") {
    return (
      <Link href={`/categories/${category.slug}`}>
        <motion.div
          whileHover={{ y: -4 }}
          className="group relative p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/5 -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <Icon className="w-7 h-7 text-primary" />
            </div>
            
            <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
              {category.name}
            </h3>
            
            {category.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {category.description}
              </p>
            )}
            
            {category.businessCount !== undefined && (
              <p className="text-sm font-medium text-primary">
                {category.businessCount} businesses
              </p>
            )}
          </div>
        </motion.div>
      </Link>
    );
  }

  // Default variant
  return (
    <Link href={`/categories/${category.slug}`}>
      <motion.div
        whileHover={{ y: -2, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="group flex flex-col items-center p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all"
      >
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 group-hover:scale-110 transition-all">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-sm font-medium text-foreground text-center line-clamp-2 group-hover:text-primary transition-colors">
          {category.name}
        </h3>
        {category.businessCount !== undefined && (
          <p className="text-xs text-muted-foreground mt-1">
            {category.businessCount}
          </p>
        )}
      </motion.div>
    </Link>
  );
}

