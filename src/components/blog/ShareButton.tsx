"use client";

/**
 * Share Button Component
 * 
 * Client component for sharing blog posts
 */

import { Share2 } from "lucide-react";

interface ShareButtonProps {
  title: string;
  url: string;
}

export function ShareButton({ title, url }: ShareButtonProps) {
  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title, url });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <button
      className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
      onClick={handleShare}
      aria-label="Share this article"
    >
      <Share2 className="w-5 h-5" />
    </button>
  );
}
