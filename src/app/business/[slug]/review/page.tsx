"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Star, Loader2, ArrowLeft, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

interface Business {
  id: string;
  name: string;
  slug: string;
  category: { name: string; slug: string } | null;
}

export default function WriteReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const slug = params.slug as string;

  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    async function fetchBusiness() {
      try {
        const response = await fetch(`/api/businesses/${slug}`);
        const data = await response.json();
        if (data.business) {
          setBusiness(data.business);
        }
      } catch (error) {
        console.error("Error fetching business:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchBusiness();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user) {
      toast.error("Please sign in to write a review");
      router.push(`/login?callbackUrl=/business/${slug}/review`);
      return;
    }

    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    if (!content.trim()) {
      toast.error("Please write your review");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessSlug: slug,
          rating,
          title: title.trim() || null,
          content: content.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      toast.success("Review submitted successfully!");
      router.push(`/business/${slug}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Business not found</h2>
          <Button asChild>
            <Link href="/search">Search Businesses</Link>
          </Button>
        </div>
      </div>
    );
  }

  const ratingLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  return (
    <div className="min-h-screen py-8">
      {/* Breadcrumb */}
      <div className="border-b border-border/50 bg-card/30 mb-8">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              Home
            </Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <Link href={`/business/${slug}`} className="text-muted-foreground hover:text-foreground">
              {business.name}
            </Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground font-medium">Write Review</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-2xl">
        <Button variant="ghost" className="mb-6" asChild>
          <Link href={`/business/${slug}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to {business.name}
          </Link>
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-6 md:p-8"
        >
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Write a Review</h1>
          <p className="text-muted-foreground mb-8">
            Share your experience at <span className="text-foreground font-medium">{business.name}</span>
          </p>

          {!session?.user && (
            <div className="mb-8 p-4 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm text-foreground mb-3">
                You need to be signed in to write a review.
              </p>
              <Button asChild size="sm">
                <Link href={`/login?callbackUrl=/business/${slug}/review`}>Sign In</Link>
              </Button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating */}
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Your Rating <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={cn(
                          "w-8 h-8 transition-colors",
                          (hoveredRating || rating) >= star
                            ? "text-primary fill-primary"
                            : "text-muted-foreground"
                        )}
                      />
                    </button>
                  ))}
                </div>
                {(hoveredRating || rating) > 0 && (
                  <span className="text-sm font-medium text-primary ml-2">
                    {ratingLabels[hoveredRating || rating]}
                  </span>
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title" className="text-base font-semibold mb-2 block">
                Review Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Sum up your experience in a few words"
                maxLength={100}
                disabled={!session?.user}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {title.length}/100 characters
              </p>
            </div>

            {/* Content */}
            <div>
              <Label htmlFor="content" className="text-base font-semibold mb-2 block">
                Your Review <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Tell others about your experience. What did you like or dislike? Would you recommend this business?"
                rows={6}
                maxLength={2000}
                disabled={!session?.user}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {content.length}/2000 characters (minimum 10)
              </p>
            </div>

            {/* Guidelines */}
            <div className="p-4 rounded-lg bg-secondary/50 text-sm">
              <h3 className="font-semibold mb-2">Review Guidelines</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Be honest and specific about your experience</li>
                <li>Avoid personal attacks or inappropriate language</li>
                <li>Don&apos;t include promotional content or links</li>
                <li>Your review will be visible to everyone</li>
              </ul>
            </div>

            {/* Submit */}
            <div className="flex items-center gap-4">
              <Button
                type="submit"
                disabled={isSubmitting || !session?.user || rating === 0 || content.length < 10}
                className="flex-1 md:flex-none md:min-w-[200px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Review"
                )}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/business/${slug}`}>Cancel</Link>
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

