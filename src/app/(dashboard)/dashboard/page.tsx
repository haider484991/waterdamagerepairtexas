"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Heart,
  Star,
  Building2,
  Settings,
  ChevronRight,
  MessageSquare,
  Loader2,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { BusinessCard, StarRating } from "@/components/business";

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
}

interface Review {
  id: string;
  rating: number;
  title: string | null;
  content: string;
  photos: string[];
  helpfulCount: number | null;
  createdAt: string;
  business: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface Stats {
  favorites: number;
  reviews: number;
  claims: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [favorites, setFavorites] = useState<Business[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!session?.user) return;

      try {
        // Fetch all data in parallel
        const [statsRes, favoritesRes, reviewsRes] = await Promise.all([
          fetch("/api/user/stats"),
          fetch("/api/user/favorites"),
          fetch("/api/user/reviews?limit=5"),
        ]);

        const [statsData, favoritesData, reviewsData] = await Promise.all([
          statsRes.json(),
          favoritesRes.json(),
          reviewsRes.json(),
        ]);

        setStats(statsData);
        setFavorites(favoritesData.favorites || []);
        setReviews(reviewsData.reviews || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (session?.user) {
      fetchData();
    }
  }, [session]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const quickStats = [
    { label: "Favorites", value: stats?.favorites || 0, icon: Heart, href: "#favorites" },
    { label: "Reviews", value: stats?.reviews || 0, icon: Star, href: "#reviews" },
    { label: "Claimed", value: stats?.claims || 0, icon: Building2, href: "#claimed" },
  ];

  // Check if user is admin
  const isAdmin = session.user?.email === "admin@plano.directory" || 
                  session.user?.email?.endsWith("@admin.com");

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8"
        >
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={session.user?.image || undefined} />
              <AvatarFallback className="text-xl bg-primary/20 text-primary">
                {session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">
                  Welcome back, {session.user?.name?.split(" ")[0] || "User"}!
                </h1>
                {isAdmin && (
                  <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">
                    <Shield className="w-3 h-3 mr-1" />
                    Admin
                  </Badge>
                )}
              </div>
              <Link
                href="/contact"
                className="text-muted-foreground hover:text-primary hover:underline"
              >
                Contact Us
              </Link>
            </div>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Button variant="outline" asChild>
                <Link href="/admin">
                  <Shield className="w-4 h-4 mr-2" />
                  Admin Panel
                </Link>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href="/dashboard/settings">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          {quickStats.map((stat) => (
            <Link key={stat.label} href={stat.href}>
              <motion.div
                whileHover={{ y: -2 }}
                className="glass-card rounded-xl p-5 text-center hover:border-primary/30 transition-colors"
              >
                <stat.icon className="w-8 h-8 text-primary mx-auto mb-2" />
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mx-auto mb-1" />
                ) : (
                  <div className="text-2xl font-bold">{stat.value}</div>
                )}
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            </Link>
          ))}
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="favorites" className="space-y-6">
          <TabsList>
            <TabsTrigger value="favorites" className="gap-2" id="favorites">
              <Heart className="w-4 h-4" />
              Favorites
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-2" id="reviews">
              <Star className="w-4 h-4" />
              My Reviews
            </TabsTrigger>
            <TabsTrigger value="claimed" className="gap-2" id="claimed">
              <Building2 className="w-4 h-4" />
              My Businesses
            </TabsTrigger>
          </TabsList>

          <TabsContent value="favorites">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Saved Businesses</h2>
              </div>

              {isLoading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-xl overflow-hidden">
                      <Skeleton className="h-44 w-full" />
                      <div className="p-4 space-y-3">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : favorites.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favorites.map((business) => (
                    <BusinessCard
                      key={business.id}
                      business={business as any}
                      isFavorited
                    />
                  ))}
                </div>
              ) : (
                <div className="glass-card rounded-xl p-8 text-center">
                  <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No favorites yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Save businesses you love to easily find them later
                  </p>
                  <Button asChild>
                    <Link href="/search">Discover Businesses</Link>
                  </Button>
                </div>
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="reviews">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Your Reviews</h2>
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="glass-card rounded-xl p-5">
                      <Skeleton className="h-5 w-1/3 mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  ))}
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-card rounded-xl p-5"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          {review.business && (
                            <Link
                              href={`/business/${review.business.slug}`}
                              className="font-medium hover:text-primary transition-colors"
                            >
                              {review.business.name}
                            </Link>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <StarRating rating={review.rating} size="sm" />
                            <span className="text-sm text-muted-foreground">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Badge variant="secondary">
                          <MessageSquare className="w-3 h-3 mr-1" />
                          Review
                        </Badge>
                      </div>
                      {review.title && (
                        <h4 className="font-medium mb-1">{review.title}</h4>
                      )}
                      <p className="text-muted-foreground text-sm line-clamp-2">
                        {review.content}
                      </p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="glass-card rounded-xl p-8 text-center">
                  <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No reviews yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Share your experiences with the Plano community
                  </p>
                  <Button asChild>
                    <Link href="/search">Find a Business to Review</Link>
                  </Button>
                </div>
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="claimed">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card rounded-xl p-8 text-center"
            >
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No claimed businesses</h3>
              <p className="text-muted-foreground mb-4">
                Own a business in Plano? Claim your listing to manage it.
              </p>
              <Button asChild>
                <Link href="/dashboard/claim">Claim a Business</Link>
              </Button>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
