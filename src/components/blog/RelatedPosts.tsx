/**
 * Related Posts Component
 * 
 * Displays related blog posts based on keywords/tags
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface RelatedPost {
  slug: string;
  title: string;
  excerpt?: string | null;
}

interface RelatedPostsProps {
  posts: RelatedPost[];
  className?: string;
}

export function RelatedPosts({ posts, className = "" }: RelatedPostsProps) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <section className={`mt-16 pt-8 border-t border-border ${className}`}>
      <h2 className="text-2xl font-bold mb-8">Related Articles</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="p-6 bg-card rounded-xl border border-border hover:border-amber-500/50 transition-colors group"
          >
            <h3 className="font-medium group-hover:text-amber-600 transition-colors line-clamp-2 mb-2">
              {post.title}
            </h3>
            {post.excerpt && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {post.excerpt}
              </p>
            )}
            <div className="mt-4 flex items-center gap-2 text-amber-600 text-sm font-medium group-hover:gap-3 transition-all">
              Read article
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
