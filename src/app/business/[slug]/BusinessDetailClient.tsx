"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Phone,
  Globe,
  Clock,
  ChevronRight,
  ChevronLeft,
  Heart,
  Share2,
  Navigation,
  Star,
  CheckCircle2,
  MessageSquare,
  ThumbsUp,
  ExternalLink,
  Copy,
  Facebook,
  Twitter,
  Building2,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating, PriceLevel, BusinessCard, DynamicBusinessContent } from "@/components/business";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

interface Business {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string;
  city: string;
  state: string;
  zip: string | null;
  phone: string | null;
  website: string | null;
  email: string | null;
  lat: string | null;
  lng: string | null;
  neighborhood: string | null;
  hours: Record<string, string> | null;
  photos: string[];
  priceLevel: number | null;
  ratingAvg: string | null;
  reviewCount: number | null;
  isVerified: boolean | null;
  isFeatured: boolean | null;
  googlePlaceId: string | null;
  isOpenNow?: boolean;
  category: {
    name: string;
    slug: string;
    section: string | null;
  } | null;
}

interface Review {
  id: string;
  rating: number;
  title: string | null;
  content: string | null;
  photos: string[];
  helpfulCount: number;
  createdAt: string;
  relativeTime?: string;
  source?: "local" | "google";
  user: {
    id: string;
    name: string;
    avatar: string | null;
    profileUrl?: string | null;
  };
}

interface SimilarBusiness {
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
  category: { name: string; slug: string } | null;
}

interface BusinessDetailClientProps {
  business: Business;
  reviews: Review[];
  similarBusinesses: SimilarBusiness[];
  reviewsSource: "local" | "google" | "both" | "none";
  totalReviewsOnGoogle: number;
}

export function BusinessDetailClient({
  business,
  reviews: initialReviews,
  similarBusinesses,
  reviewsSource: initialReviewsSource,
  totalReviewsOnGoogle,
}: BusinessDetailClientProps) {
  const { data: session } = useSession();
  const slug = business.slug;

  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [isFavorited, setIsFavorited] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  
  // Reviews state
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsTotal, setReviewsTotal] = useState(initialReviews.length);
  const [reviewsTotalPages, setReviewsTotalPages] = useState(1);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsSource, setReviewsSource] = useState(initialReviewsSource);
  const [googleReviewsTotal] = useState(totalReviewsOnGoogle);
  const [ratingDistribution, setRatingDistribution] = useState<Record<number, number>>(() => {
    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    initialReviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) {
        dist[r.rating]++;
      }
    });
    return dist;
  });

  const handleFavorite = async () => {
    if (!session?.user) {
      toast.error("Please sign in to save favorites");
      return;
    }
    setIsFavorited(!isFavorited);
    toast.success(isFavorited ? "Removed from favorites" : "Added to favorites");
  };

  const handleHelpful = async (reviewId: string) => {
    try {
      const response = await fetch("/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, action: "increment" }),
      });

      if (response.ok) {
        setReviews((prev) =>
          prev.map((r) =>
            r.id === reviewId ? { ...r, helpfulCount: r.helpfulCount + 1 } : r
          )
        );
        toast.success("Marked as helpful");
      }
    } catch (error) {
      console.error("Error marking helpful:", error);
    }
  };

  const handleShare = async (platform?: string) => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `Check out ${business.name} on WaterDamageRepairTexas.net`;

    if (platform === "copy") {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } else if (platform === "facebook") {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
    } else if (platform === "twitter") {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
    }
  };

  const getDirections = () => {
    if (business.lat && business.lng) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${business.lat},${business.lng}`,
        "_blank"
      );
    } else if (business.address) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
          `${business.address}, ${business.city}, ${business.state}`
        )}`,
        "_blank"
      );
    }
  };

  // Get proper image URL
  const getImageUrl = (photo: string, width = 800) => {
    if (!photo) return null;
    if (photo.startsWith("http")) {
      if (photo.includes("maps.googleapis.com")) {
        const match = photo.match(/photo_reference=([^&]+)/);
        if (match) {
          return `/api/images?ref=${match[1]}&maxwidth=${width}`;
        }
      }
      return photo;
    }
    return `/api/images?ref=${photo}&maxwidth=${width}`;
  };

  const rating = Number(business.ratingAvg) || 0;
  const totalDistribution = Object.values(ratingDistribution).reduce((a, b) => a + b, 0);
  
  // Calculate if open (simple check)
  const now = new Date();
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const currentDay = dayNames[now.getDay()];
  const todayHours = business.hours?.[currentDay];
  const isOpen = business.isOpenNow ?? (todayHours && todayHours.toLowerCase() !== "closed");

  return (
    <div className="min-h-screen pb-8">
      {/* Breadcrumb */}
      <div className="border-b border-border/50 bg-card/30">
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
          <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm overflow-x-auto whitespace-nowrap scrollbar-hide">
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              Home
            </Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            <Link href="/categories" className="text-muted-foreground hover:text-foreground">
              Categories
            </Link>
            {business.category && (
              <>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                <Link
                  href={`/categories/${business.category.slug}`}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {business.category.name}
                </Link>
              </>
            )}
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-foreground font-medium">{business.name}</span>
          </nav>
        </div>
      </div>

      {/* Photo Gallery */}
      <div className="bg-card/30">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {/* Main Photo */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative aspect-[4/3] rounded-lg sm:rounded-xl overflow-hidden bg-secondary cursor-pointer group"
              onClick={() => setLightboxOpen(true)}
            >
              {business.photos && business.photos.length > 0 ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getImageUrl(business.photos[selectedPhoto]) || "https://placehold.co/800x600/1a1a1a/666666?text=No+Image"}
                    alt={business.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://placehold.co/800x600/1a1a1a/666666?text=No+Image";
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity font-medium text-sm sm:text-base">
                      View Gallery
                    </span>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <Building2 className="w-12 h-12 sm:w-16 sm:h-16" />
                </div>
              )}
            </motion.div>

            {/* Thumbnail Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => {
                    setSelectedPhoto(index);
                    if (business.photos && business.photos[index]) {
                      setLightboxOpen(true);
                    }
                  }}
                  className={cn(
                    "relative aspect-[4/3] rounded-md sm:rounded-lg overflow-hidden bg-secondary group",
                    selectedPhoto === index && "ring-2 ring-primary"
                  )}
                >
                  {business.photos && business.photos[index] ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getImageUrl(business.photos[index], 400) || "https://placehold.co/400x300/1a1a1a/666666?text=No+Image"}
                        alt={`${business.name} photo ${index + 1}`}
                        className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://placehold.co/400x300/1a1a1a/666666?text=No+Image";
                        }}
                      />
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs sm:text-sm">
                      <Building2 className="w-6 h-6 sm:w-8 sm:h-8" />
                    </div>
                  )}
                  {index === 3 && business.photos && business.photos.length > 4 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white font-medium text-xs sm:text-sm px-2 text-center">
                        +{business.photos.length - 4} more
                      </span>
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && business.photos && business.photos.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              className="absolute top-2 right-2 sm:top-4 sm:right-4 p-2 sm:p-3 text-white hover:bg-white/10 rounded-full z-10"
              onClick={() => setLightboxOpen(false)}
              aria-label="Close gallery"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            
            <button
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 text-white hover:bg-white/10 rounded-full z-10"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPhoto((prev) => 
                  prev === 0 ? business.photos!.length - 1 : prev - 1
                );
              }}
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>

            <div className="max-w-full sm:max-w-4xl max-h-[85vh] sm:max-h-[80vh] relative px-12 sm:px-16" onClick={(e) => e.stopPropagation()}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getImageUrl(business.photos[selectedPhoto], 1200) || "https://placehold.co/1200x800/1a1a1a/666666?text=No+Image"}
                alt={business.name}
                className="object-contain max-h-[85vh] sm:max-h-[80vh] max-w-full w-full h-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://placehold.co/1200x800/1a1a1a/666666?text=No+Image";
                }}
              />
              <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 text-white text-xs sm:text-sm bg-black/50 px-3 py-1 rounded-full">
                {selectedPhoto + 1} / {business.photos.length}
              </div>
            </div>

            <button
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 text-white hover:bg-white/10 rounded-full z-10"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPhoto((prev) => 
                  prev === business.photos!.length - 1 ? 0 : prev + 1
                );
              }}
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-2 flex-wrap">
                    {business.category && (
                      <Badge variant="secondary" className="text-xs sm:text-sm">{business.category.name}</Badge>
                    )}
                    {business.isVerified && (
                      <Badge className="bg-green-500/20 text-green-500 border-green-500/30 text-xs sm:text-sm">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                    {business.isFeatured && (
                      <Badge className="bg-primary/20 text-primary border-primary/30 text-xs sm:text-sm">
                        Featured
                      </Badge>
                    )}
                  </div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 break-words">{business.name}</h1>
                  <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                    <StarRating rating={rating} showValue reviewCount={business.reviewCount || 0} />
                    <PriceLevel level={business.priceLevel || 0} />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-start sm:justify-end">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleFavorite}
                    className={cn(
                      "h-9 w-9 sm:h-10 sm:w-10",
                      isFavorited && "border-red-500 text-red-500 hover:text-red-500"
                    )}
                  >
                    <Heart className={cn("w-4 h-4 sm:w-5 sm:h-5", isFavorited && "fill-red-500")} />
                  </Button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
                        <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Share {business.name}</DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-3 gap-3 sm:gap-4 py-4">
                        <Button
                          variant="outline"
                          className="flex flex-col gap-2 h-auto py-3 sm:py-4"
                          onClick={() => handleShare("copy")}
                        >
                          <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span className="text-xs">Copy Link</span>
                        </Button>
                        <Button
                          variant="outline"
                          className="flex flex-col gap-2 h-auto py-3 sm:py-4"
                          onClick={() => handleShare("facebook")}
                        >
                          <Facebook className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span className="text-xs">Facebook</span>
                        </Button>
                        <Button
                          variant="outline"
                          className="flex flex-col gap-2 h-auto py-3 sm:py-4"
                          onClick={() => handleShare("twitter")}
                        >
                          <Twitter className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span className="text-xs">Twitter</span>
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {business.description && (
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{business.description}</p>
              )}
            </motion.div>

            {/* Tabs */}
            <Tabs defaultValue="reviews" className="w-full">
              <TabsList className="w-full justify-start h-auto flex-wrap gap-2 sm:gap-3">
                <TabsTrigger value="reviews" className="gap-1.5 sm:gap-2 text-sm sm:text-base px-3 sm:px-4 py-2">
                  <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Reviews</span>
                  <span className="xs:hidden">Reviews</span>
                  <span className="ml-1">({reviewsTotal || business.reviewCount || 0})</span>
                </TabsTrigger>
                <TabsTrigger value="about" className="text-sm sm:text-base px-3 sm:px-4 py-2">About</TabsTrigger>
              </TabsList>

              <TabsContent value="reviews" className="mt-4 sm:mt-6">
                {/* Rating Summary */}
                <div className="glass-card rounded-lg sm:rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
                  <div className="flex flex-col sm:flex-row sm:flex-wrap items-center sm:items-start gap-4 sm:gap-6">
                    <div className="text-center w-full sm:w-auto">
                      <div className="text-4xl sm:text-5xl font-bold text-foreground mb-1 sm:mb-2">
                        {rating.toFixed(1)}
                      </div>
                      <StarRating rating={rating} size="lg" />
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2 px-2">
                        {reviewsSource === "google" 
                          ? `${googleReviewsTotal || business.reviewCount || 0} reviews on Google`
                          : `${reviewsTotal || business.reviewCount || 0} reviews`
                        }
                      </p>
                    </div>
                    <Separator orientation="vertical" className="hidden sm:block h-20 sm:h-24" />
                    <Separator className="sm:hidden w-full" />
                    <div className="flex-1 space-y-1.5 sm:space-y-2 w-full sm:w-auto min-w-[240px]">
                      {[5, 4, 3, 2, 1].map((stars) => {
                        const count = ratingDistribution[stars] || 0;
                        const percentage = totalDistribution > 0 
                          ? Math.round((count / totalDistribution) * 100) 
                          : 0;
                        return (
                          <div key={stars} className="flex items-center gap-2 sm:gap-3">
                            <span className="text-xs sm:text-sm w-4 sm:w-3">{stars}</span>
                            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary fill-primary shrink-0" />
                            <div className="flex-1 h-1.5 sm:h-2 bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-xs sm:text-sm text-muted-foreground w-14 sm:w-12 text-right shrink-0">
                              {count} ({percentage}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Source indicator for Google reviews */}
                {reviewsSource === "google" && reviews.length > 0 && (
                  <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center gap-2">
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span className="text-sm">
                      Showing {reviews.length} of {googleReviewsTotal} reviews from Google
                    </span>
                  </div>
                )}

                {/* Write Review Button */}
                <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                  <Button asChild className="w-full sm:w-auto">
                    <Link href={`/business/${slug}/review`}>
                      <Star className="w-4 h-4 mr-2" />
                      Write a Review
                    </Link>
                  </Button>
                  {business.googlePlaceId && (
                    <Button variant="outline" asChild className="w-full sm:w-auto">
                      <a 
                        href={`https://search.google.com/local/writereview?placeid=${business.googlePlaceId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span className="hidden sm:inline">Review on Google</span>
                        <span className="sm:hidden">Google Review</span>
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </a>
                    </Button>
                  )}
                </div>

                {/* Reviews List */}
                {reviewsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-32 rounded-xl" />
                    ))}
                  </div>
                ) : reviews.length > 0 ? (
                  <>
                    <div className="space-y-6">
                      {reviews.map((review, index) => (
                        <motion.div
                          key={review.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="glass-card rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5"
                        >
                          <div className="flex items-start gap-3 sm:gap-4">
                            <Avatar className="w-8 h-8 sm:w-10 sm:h-10 shrink-0">
                              <AvatarImage src={review.user.avatar || undefined} />
                              <AvatarFallback className="text-xs sm:text-sm">{review.user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 mb-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {review.user.profileUrl ? (
                                    <a 
                                      href={review.user.profileUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="font-medium text-sm sm:text-base hover:text-primary transition-colors break-words"
                                    >
                                      {review.user.name}
                                    </a>
                                  ) : (
                                    <h4 className="font-medium text-sm sm:text-base break-words">{review.user.name}</h4>
                                  )}
                                  {review.source === "google" && (
                                    <Badge variant="outline" className="text-xs py-0 shrink-0">Google</Badge>
                                  )}
                                </div>
                                <span className="text-xs sm:text-sm text-muted-foreground shrink-0">
                                  {review.relativeTime || new Date(review.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <StarRating rating={review.rating} size="sm" />
                              {review.title && <h5 className="font-medium mt-1.5 sm:mt-2 text-sm sm:text-base break-words">{review.title}</h5>}
                              {review.content && (
                                <p className="text-muted-foreground mt-1.5 sm:mt-2 whitespace-pre-wrap text-sm sm:text-base break-words">{review.content}</p>
                              )}
                              {review.source !== "google" && (
                                <div className="flex items-center gap-4 mt-3 sm:mt-4 flex-wrap">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="gap-1.5 sm:gap-2 text-xs sm:text-sm h-7 sm:h-8"
                                    onClick={() => handleHelpful(review.id)}
                                  >
                                    <ThumbsUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    Helpful ({review.helpfulCount})
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* View more on Google */}
                    {reviewsSource === "google" && business.googlePlaceId && googleReviewsTotal > 5 && (
                      <div className="text-center mt-6">
                        <Button variant="outline" asChild>
                          <a 
                            href={`https://www.google.com/maps/place/?q=place_id:${business.googlePlaceId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View all {googleReviewsTotal} reviews on Google
                            <ExternalLink className="w-4 h-4 ml-2" />
                          </a>
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 glass-card rounded-xl">
                    <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No reviews yet</h3>
                    <p className="text-muted-foreground mb-4">Be the first to review this business!</p>
                    <div className="flex flex-wrap justify-center gap-3">
                      <Button asChild>
                        <Link href={`/business/${slug}/review`}>
                          <Star className="w-4 h-4 mr-2" />
                          Write the First Review
                        </Link>
                      </Button>
                      {business.googlePlaceId && (
                        <Button variant="outline" asChild>
                          <a 
                            href={`https://www.google.com/maps/place/?q=place_id:${business.googlePlaceId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View on Google Maps
                            <ExternalLink className="w-4 h-4 ml-2" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="about" className="mt-6">
                {/* Dynamic Content - Tips, Amenities, Best Times */}
                <DynamicBusinessContent business={business} />
                
                {/* Additional Info Card */}
                <div className="glass-card rounded-xl p-6 mt-6">
                  <h3 className="font-semibold mb-4">Additional Information</h3>
                  <div className="space-y-4">
                    {business.category && (
                      <div>
                        <h4 className="font-medium mb-2">Category</h4>
                        <Badge variant="secondary">{business.category.name}</Badge>
                      </div>
                    )}
                    {business.neighborhood && (
                      <div>
                        <h4 className="font-medium mb-2">Neighborhood</h4>
                        <p className="text-muted-foreground">{business.neighborhood}</p>
                      </div>
                    )}
                    <div>
                      <h4 className="font-medium mb-2">Price Range</h4>
                      <PriceLevel level={business.priceLevel || 0} />
                    </div>
                    {business.googlePlaceId && (
                      <div>
                        <h4 className="font-medium mb-2">View on Google</h4>
                        <Button variant="outline" size="sm" asChild>
                          <a 
                            href={`https://www.google.com/maps/place/?q=place_id:${business.googlePlaceId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Open in Google Maps
                            <ExternalLink className="w-4 h-4 ml-2" />
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Similar Businesses */}
            {similarBusinesses.length > 0 && (
              <div>
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Similar Businesses</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {similarBusinesses.map((b) => (
                    <BusinessCard key={b.id} business={b as any} variant="compact" />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Contact Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 lg:sticky lg:top-24"
            >
              <div className="space-y-4">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className={cn("font-medium", isOpen ? "text-green-500" : "text-red-500")}>
                    {isOpen ? "Open" : "Closed"}
                  </span>
                  {todayHours && (
                    <Badge variant="outline" className="text-xs">
                      {todayHours}
                    </Badge>
                  )}
                </div>

                <Separator />

                {/* Address */}
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-medium break-words">{business.address}</p>
                    <p className="text-sm text-muted-foreground break-words">
                      {business.city}, {business.state} {business.zip}
                    </p>
                  </div>
                </div>

                {/* Phone */}
                {business.phone && (
                  <a
                    href={`tel:${business.phone}`}
                    className="flex items-center gap-3 text-foreground hover:text-primary transition-colors"
                  >
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <span>{business.phone}</span>
                  </a>
                )}

                {/* Website */}
                {business.website && (
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-foreground hover:text-primary transition-colors max-w-full"
                  >
                    <Globe className="w-5 h-5 text-muted-foreground" />
                    <span className="truncate">
                      {business.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                    </span>
                    <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                  </a>
                )}

                <Separator />

                {/* Hours */}
                {business.hours && Object.keys(business.hours).length > 0 && (
                  <>
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">Hours</span>
                      </div>
                      <div className="space-y-1.5 text-sm">
                        {Object.entries(business.hours).map(([day, hours]) => (
                          <div 
                            key={day} 
                            className={cn(
                              "flex justify-between",
                              day === currentDay && "text-primary font-medium"
                            )}
                          >
                            <span className="capitalize">{day}</span>
                            <span>{hours}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Actions */}
                <div className="space-y-2 sm:space-y-3">
                  <Button onClick={getDirections} className="w-full gap-2 text-sm sm:text-base h-9 sm:h-10">
                    <Navigation className="w-4 h-4" />
                    Get Directions
                  </Button>
                  {business.website && (
                    <Button variant="outline" asChild className="w-full gap-2 text-sm sm:text-base h-9 sm:h-10">
                      <a href={business.website} target="_blank" rel="noopener noreferrer">
                        <Globe className="w-4 h-4" />
                        Visit Website
                      </a>
                    </Button>
                  )}
                  {business.phone && (
                    <Button variant="outline" asChild className="w-full gap-2 text-sm sm:text-base h-9 sm:h-10">
                      <a href={`tel:${business.phone}`}>
                        <Phone className="w-4 h-4" />
                        Call Now
                      </a>
                    </Button>
                  )}
                </div>

                {/* Claim Business */}
                <div className="pt-4 border-t border-border/50">
                  <p className="text-xs text-muted-foreground mb-2">Is this your business?</p>
                  <Button variant="ghost" size="sm" asChild className="w-full">
                    <Link href={`/dashboard/claim?business=${business.id}`}>Claim this listing</Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
