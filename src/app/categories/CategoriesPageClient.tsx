"use client";

import { motion } from "framer-motion";
import Link from "next/link";
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
  ChevronRight,
  LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Category } from "@/lib/db/schema";

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

interface CategoriesPageClientProps {
  categories: Category[];
}

// Group categories by section
function groupBySection(categories: Category[]) {
  const groups: Record<string, Category[]> = {};
  
  categories.forEach((cat) => {
    const section = cat.section || "Other";
    if (!groups[section]) {
      groups[section] = [];
    }
    groups[section].push(cat);
  });
  
  return groups;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function CategoriesPageClient({ categories }: CategoriesPageClientProps) {
  const groupedCategories = groupBySection(categories);
  const sections = Object.keys(groupedCategories);

  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Browse All Categories
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore {categories.length} pickleball categories covering everything the United States has to offer, from
            dining and shopping to professional services and entertainment.
          </p>
        </motion.div>

        {/* Category Sections */}
        <div className="space-y-12">
          {sections.map((section, sectionIndex) => (
            <motion.section
              key={section}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: sectionIndex * 0.1 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <Badge variant="secondary" className="text-sm font-medium">
                  {section}
                </Badge>
                <div className="flex-1 h-px bg-border/50" />
              </div>

              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {groupedCategories[section].map((category) => {
                  const Icon = iconMap[category.icon || "Building"] || Building;
                  return (
                    <motion.div key={category.slug} variants={itemVariants}>
                      <Link href={`/categories/${category.slug}`}>
                        <motion.div
                          whileHover={{ y: -2 }}
                          className="group flex items-start gap-4 p-5 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all"
                        >
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                            <Icon className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                {category.name}
                              </h3>
                              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                            </div>
                            {category.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                {category.description}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            </motion.section>
          ))}
        </div>
      </div>
    </div>
  );
}

