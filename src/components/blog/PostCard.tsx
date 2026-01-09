/**
 * Blog Post Card Component
 * 
 * Displays a blog post preview card for listing pages
 */

import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PostCardProps {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  publishedAt: Date | null;
  readingTime: number | null;
  wordCount: number | null;
  tags?: string[];
}

export function PostCard({
  slug,
  title,
  excerpt,
  coverImageUrl,
  coverImageAlt,
  publishedAt,
  readingTime,
  wordCount,
  tags,
}: PostCardProps) {
  return (
    <Link
      href={`/blog/${slug}`}
      className="group block bg-card rounded-xl border border-border hover:border-blue-500/50 transition-all duration-300 overflow-hidden"
    >
      {/* Cover Image */}
      {coverImageUrl && (
        <div className="relative w-full aspect-video overflow-hidden bg-muted">
          <Image
            src={coverImageUrl}
            alt={coverImageAlt || title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Title */}
        <h2 className="text-xl font-bold mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
          {title}
        </h2>

        {/* Excerpt */}
        {excerpt && (
          <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
            {excerpt}
          </p>
        )}

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          {publishedAt && (
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(publishedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          )}
          {readingTime && (
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {readingTime} min read
            </span>
          )}
          {wordCount && (
            <span>{wordCount.toLocaleString()} words</span>
          )}
        </div>

        {/* Read More */}
        <div className="mt-4 flex items-center gap-2 text-blue-600 font-medium text-sm group-hover:gap-3 transition-all">
          Read more
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  );
}
