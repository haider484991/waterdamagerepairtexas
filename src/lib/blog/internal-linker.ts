/**
 * Internal Linking Utilities
 * 
 * Handles:
 * - Finding relevant posts for internal linking
 * - Inserting links naturally into content
 * - Tracking link insertions
 */

import { db, blogPosts, blogPostKeywords, blogKeywords, businesses, categories } from "@/lib/db";
import { eq, ne, and, sql, desc, or, like } from "drizzle-orm";
import { getSiteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();

export interface LinkSuggestion {
  targetId: string; // Changed from targetPostId to targetId
  targetSlug: string;
  targetTitle: string;
  anchorText: string;
  relevanceScore: number;
  matchedKeywords: string[];
  type: "post" | "business"; // Added type
}

export interface InsertedLink {
  targetId: string;
  targetSlug: string;
  anchorText: string;
  position: number;
  type: "post" | "business";
}

/**
 * Find relevant posts for internal linking based on shared keywords
 */
export async function findRelatedPosts(
  postId: string,
  postKeywordIds: string[],
  limit: number = 10
): Promise<LinkSuggestion[]> {
  if (postKeywordIds.length === 0) {
    return [];
  }

  try {
    // Find posts that share keywords with the current post
    const relatedPosts = await db
      .select({
        postId: blogPosts.id,
        slug: blogPosts.slug,
        title: blogPosts.title,
        keywordId: blogPostKeywords.keywordId,
        keyword: blogKeywords.keyword,
      })
      .from(blogPostKeywords)
      .innerJoin(blogPosts, eq(blogPostKeywords.postId, blogPosts.id))
      .innerJoin(blogKeywords, eq(blogPostKeywords.keywordId, blogKeywords.id))
      .where(
        and(
          ne(blogPosts.id, postId),
          eq(blogPosts.status, "published"),
          sql`${blogPostKeywords.keywordId} = ANY(${postKeywordIds})`
        )
      )
      .orderBy(desc(blogPosts.publishedAt))
      .limit(limit * 3); // Get more than needed for scoring

    // Group by post and calculate relevance
    const postMap = new Map<string, {
      slug: string;
      title: string;
      keywords: string[];
    }>();

    for (const row of relatedPosts) {
      if (!postMap.has(row.postId)) {
        postMap.set(row.postId, {
          slug: row.slug,
          title: row.title,
          keywords: [],
        });
      }
      postMap.get(row.postId)!.keywords.push(row.keyword);
    }

    // Convert to suggestions with scores
    const suggestions: LinkSuggestion[] = [];
    
    for (const [targetId, data] of postMap) {
      const relevanceScore = Math.min(100, data.keywords.length * 20);
      
      // Generate anchor text from the first matched keyword or title
      const anchorText = data.keywords[0] || data.title.split(" ").slice(0, 4).join(" ");
      
      suggestions.push({
        targetId,
        targetSlug: data.slug,
        targetTitle: data.title,
        anchorText,
        relevanceScore,
        matchedKeywords: data.keywords,
        type: "post",
      });
    }

    // Sort by relevance and limit
    return suggestions
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  } catch (error) {
    console.error("Error finding related posts:", error);
    return [];
  }
}

/**
 * Find posts by keyword overlap in content
 */
export async function findPostsByKeywordOverlap(
  content: string,
  excludePostId?: string,
  limit: number = 10
): Promise<LinkSuggestion[]> {
  try {
    // Get all published posts (or draft if we want to allow linking to newest)
    const posts = await db
      .select({
        id: blogPosts.id,
        slug: blogPosts.slug,
        title: blogPosts.title,
        excerpt: blogPosts.excerpt,
        status: blogPosts.status,
      })
      .from(blogPosts)
      .where(
        excludePostId
          ? and(ne(blogPosts.id, excludePostId), or(eq(blogPosts.status, "published"), eq(blogPosts.status, "draft")))
          : or(eq(blogPosts.status, "published"), eq(blogPosts.status, "draft"))
      )
      .orderBy(desc(blogPosts.createdAt))
      .limit(100);

    // Extract important words from current content
    const contentWords = extractImportantWords(content);
    
    // Score each post by word overlap
    const suggestions: LinkSuggestion[] = [];
    
    for (const post of posts) {
      const postWords = extractImportantWords(`${post.title} ${post.excerpt || ""}`);
      const overlap = contentWords.filter(w => postWords.includes(w));
      
      if (overlap.length > 0) {
        suggestions.push({
          targetId: post.id,
          targetSlug: post.slug,
          targetTitle: post.title,
          anchorText: overlap[0] || post.title.split(" ").slice(0, 3).join(" "),
          relevanceScore: Math.min(100, overlap.length * 15),
          matchedKeywords: overlap,
          type: "post",
        });
      }
    }

    return suggestions
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  } catch (error) {
    console.error("Error finding posts by keyword overlap:", error);
    return [];
  }
}

/**
 * Find related businesses for linking with better matching
 */
export async function findRelatedBusinesses(
  content: string,
  limit: number = 5
): Promise<LinkSuggestion[]> {
  try {
    const contentWords = extractImportantWords(content);
    
    // 1. Try to find businesses by city mentions in content
    const cities = await db.select({ city: businesses.city }).from(businesses).groupBy(businesses.city);
    const mentionedCities = cities
      .map(c => c.city)
      .filter(city => content.toLowerCase().includes(city.toLowerCase()));

    // 2. Build search conditions
    const conditions = [];
    
    // Add city matches (high priority)
    if (mentionedCities.length > 0) {
      conditions.push(sql`${businesses.city} IN ${mentionedCities}`);
    }

    // Add keyword matches in name
    const topWords = contentWords.slice(0, 5);
    for (const word of topWords) {
      conditions.push(like(businesses.name, `%${word}%`));
    }

    if (conditions.length === 0) return [];

    const relatedBusinesses = await db
      .select({
        id: businesses.id,
        name: businesses.name,
        slug: businesses.slug,
        city: businesses.city,
        state: businesses.state,
      })
      .from(businesses)
      .where(or(...conditions))
      .orderBy(desc(businesses.ratingAvg))
      .limit(50);

    const suggestions: LinkSuggestion[] = [];

    for (const biz of relatedBusinesses) {
      const bizNameLower = biz.name.toLowerCase();
      const contentLower = content.toLowerCase();
      
      // Check if business name or parts of it are in the content
      const nameInContent = contentLower.includes(bizNameLower);
      const shortName = biz.name.split(/[\s,]+/)[0].toLowerCase();
      const shortNameInContent = shortName.length > 3 && contentLower.includes(shortName);

      if (nameInContent || shortNameInContent) {
        suggestions.push({
          targetId: biz.id,
          targetSlug: biz.slug,
          targetTitle: biz.name,
          anchorText: biz.name,
          relevanceScore: nameInContent ? 90 : 70,
          matchedKeywords: [biz.city],
          type: "business",
        });
      }
    }

    return suggestions
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  } catch (error) {
    console.error("Error finding related businesses:", error);
    return [];
  }
}

/**
 * Extract important words from text (nouns, verbs, keywords)
 */
function extractImportantWords(text: string): string[] {
  // Common stop words to filter out
  const stopWords = new Set([
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "as", "is", "was", "are", "were", "been",
    "be", "have", "has", "had", "do", "does", "did", "will", "would",
    "could", "should", "may", "might", "must", "shall", "can", "need",
    "this", "that", "these", "those", "i", "you", "he", "she", "it",
    "we", "they", "what", "which", "who", "when", "where", "why", "how",
    "all", "each", "every", "both", "few", "more", "most", "other",
    "some", "such", "no", "nor", "not", "only", "own", "same", "so",
    "than", "too", "very", "just", "also", "now", "here", "there",
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));

  // Return unique words
  return [...new Set(words)];
}

/**
 * Insert internal links into markdown content
 */
export function insertInternalLinks(
  markdown: string,
  suggestions: LinkSuggestion[],
  maxLinks: number = 5
): { content: string; insertedLinks: InsertedLink[] } {
  const insertedLinks: InsertedLink[] = [];
  let content = markdown;
  let linksInserted = 0;

  // Sort suggestions by relevance
  const sortedSuggestions = [...suggestions].sort(
    (a, b) => b.relevanceScore - a.relevanceScore
  );

  for (const suggestion of sortedSuggestions) {
    if (linksInserted >= maxLinks) break;

    // Find a good position to insert the link
    const result = insertLink(content, suggestion);
    
    if (result.inserted) {
      content = result.content;
      insertedLinks.push({
        targetId: suggestion.targetId,
        targetSlug: suggestion.targetSlug,
        anchorText: result.anchorText,
        position: result.position,
        type: suggestion.type,
      });
      linksInserted++;
    }
  }

  return { content, insertedLinks };
}

/**
 * Insert a single link into content, avoiding headings
 */
function insertLink(
  content: string,
  suggestion: LinkSuggestion
): { inserted: boolean; content: string; anchorText: string; position: number } {
  const { anchorText, targetSlug, type } = suggestion;
  const linkUrl = type === "post" ? `/blog/${targetSlug}` : `/business/${targetSlug}`;
  
  // Check if link already exists
  if (content.includes(`(${linkUrl})`)) {
    return { inserted: false, content, anchorText: "", position: -1 };
  }

  // List of variations to try for matching
  const variations = [
    anchorText, // Exact match
    anchorText.toLowerCase(), // Lowercase
    anchorText.endsWith('s') ? anchorText.slice(0, -1) : anchorText + 's', // Singular/Plural simple guess
  ];

  // For businesses, also try parts of the name
  if (type === "business") {
    const parts = anchorText.split(/[\s,]+/);
    if (parts[0].length > 3) variations.push(parts[0]);
    if (parts.length > 1 && parts[1].length > 3) variations.push(parts[0] + " " + parts[1]);
  }

  // Filter unique variations and escape them
  const uniqueVariations = [...new Set(variations)].filter(v => v.length > 3);

  for (const variant of uniqueVariations) {
    const anchorRegex = new RegExp(`\\b(${escapeRegex(variant)})\\b`, "i");
    const match = anchorRegex.exec(content);

    if (match) {
      const index = match.index;
      const actualText = match[0];

      // Check context (not heading, not already linked)
      const lineStart = content.lastIndexOf("\n", index) + 1;
      const lineEnd = content.indexOf("\n", index);
      const line = content.substring(lineStart, lineEnd === -1 ? content.length : lineEnd);
      
      if (line.trim().startsWith("#")) continue;

      const before = content.substring(Math.max(0, index - 15), index);
      const after = content.substring(index + actualText.length, index + actualText.length + 15);
      
      if (before.includes("[") || after.startsWith("](") || after.startsWith("(")) {
        continue; // Likely already part of a link
      }

      const markdownLink = `[${actualText}](${linkUrl})`;
      const newContent = 
        content.substring(0, index) + 
        markdownLink + 
        content.substring(index + actualText.length);

      return {
        inserted: true,
        content: newContent,
        anchorText: actualText,
        position: index,
      };
    }
  }

  return { inserted: false, content, anchorText: "", position: -1 };
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Find best positions for link insertion (between paragraphs, not in headings)
 */
export function findLinkInsertionPoints(markdown: string): number[] {
  const positions: number[] = [];
  
  // Find positions after paragraphs (double newlines)
  const paragraphEnds = markdown.matchAll(/\n\n/g);
  for (const match of paragraphEnds) {
    if (match.index !== undefined) {
      positions.push(match.index);
    }
  }
  
  return positions;
}

/**
 * Generate "Related Posts" section
 */
export function generateRelatedPostsSection(
  suggestions: LinkSuggestion[],
  maxPosts: number = 4
): string {
  // Filter for only blog posts in this section
  const posts = suggestions.filter(s => s.type === "post").slice(0, maxPosts);
  
  if (posts.length === 0) return "";

  let section = "\n\n## Related Articles\n\n";
  
  for (const post of posts) {
    section += `- [${post.targetTitle}](/blog/${post.targetSlug})\n`;
  }
  
  return section;
}

/**
 * Check if content has enough internal links
 */
export function checkInternalLinkCount(content: string): {
  count: number;
  sufficient: boolean;
  message: string;
} {
  // Count markdown links to /blog/
  const linkRegex = /\[([^\]]+)\]\(\/blog\/[^)]+\)/g;
  const matches = content.match(linkRegex) || [];
  const count = matches.length;
  
  const minLinks = 3;
  const maxLinks = 7;
  
  if (count < minLinks) {
    return {
      count,
      sufficient: false,
      message: `Only ${count} internal links found. Recommend at least ${minLinks}.`,
    };
  }
  
  if (count > maxLinks) {
    return {
      count,
      sufficient: true,
      message: `${count} internal links found. Consider reducing to avoid over-optimization.`,
    };
  }
  
  return {
    count,
    sufficient: true,
    message: `${count} internal links found. Good amount!`,
  };
}
