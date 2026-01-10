/**
 * SEO Processing Utilities
 * 
 * Handles:
 * - SEO title validation
 * - Meta description validation
 * - Heading structure validation
 * - Keyword density checking
 * - Schema markup generation
 */

import { slugify } from "./markdown";
import { getSiteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();

export interface SEOValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number; // 0-100
}

export interface SEOData {
  title: string;
  seoTitle: string;
  metaDescription: string;
  slug: string;
  canonicalUrl: string;
  keywords: string[];
  primaryKeyword: string;
}

/**
 * Validate SEO title
 */
export function validateSEOTitle(title: string): { valid: boolean; message: string } {
  if (!title) {
    return { valid: false, message: "SEO title is required" };
  }
  
  if (title.length > 60) {
    return { valid: false, message: `SEO title too long (${title.length}/60 chars)` };
  }
  
  if (title.length < 30) {
    return { valid: false, message: `SEO title too short (${title.length}/30 min chars)` };
  }
  
  return { valid: true, message: "SEO title is valid" };
}

/**
 * Validate meta description
 */
export function validateMetaDescription(description: string): { valid: boolean; message: string } {
  if (!description) {
    return { valid: false, message: "Meta description is required" };
  }
  
  if (description.length > 160) {
    return { valid: false, message: `Meta description too long (${description.length}/160 chars)` };
  }
  
  if (description.length < 70) {
    return { valid: false, message: `Meta description too short (${description.length}/70 min chars)` };
  }
  
  return { valid: true, message: "Meta description is valid" };
}

/**
 * Calculate keyword density
 */
export function calculateKeywordDensity(content: string, keyword: string): number {
  if (!content || !keyword) return 0;
  
  const words = content.toLowerCase().split(/\s+/);
  const keywordLower = keyword.toLowerCase();
  const keywordWords = keywordLower.split(/\s+/);
  
  if (keywordWords.length === 1) {
    // Single word keyword
    const occurrences = words.filter(w => w.includes(keywordLower)).length;
    return (occurrences / words.length) * 100;
  }
  
  // Multi-word keyword (phrase)
  const contentLower = content.toLowerCase();
  const regex = new RegExp(keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  const matches = contentLower.match(regex) || [];
  
  return (matches.length * keywordWords.length / words.length) * 100;
}

/**
 * Validate heading structure
 */
export function validateHeadingStructure(markdown: string): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  // Check for H1 in content (should not be in body, title is H1)
  const h1Matches = markdown.match(/^#\s+/gm);
  if (h1Matches && h1Matches.length > 0) {
    issues.push("H1 found in content - article title serves as H1");
  }
  
  // Check heading hierarchy
  const headings = markdown.match(/^(#{2,6})\s+/gm) || [];
  let lastLevel = 1;
  
  for (const heading of headings) {
    const level = heading.trim().replace(/\s+$/, "").length;
    if (level > lastLevel + 1) {
      issues.push(`Heading level skipped: H${lastLevel} to H${level}`);
    }
    lastLevel = level;
  }
  
  // Check for missing H2s
  const h2Count = (markdown.match(/^##\s+/gm) || []).length;
  if (h2Count < 2) {
    issues.push("Article should have at least 2 H2 headings for structure");
  }
  
  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Full SEO validation
 */
export function validateSEO(
  content: string,
  seoData: SEOData
): SEOValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let score = 100;
  
  // Title validation
  const titleResult = validateSEOTitle(seoData.seoTitle);
  if (!titleResult.valid) {
    errors.push(titleResult.message);
    score -= 15;
  }
  
  // Meta description validation
  const metaResult = validateMetaDescription(seoData.metaDescription);
  if (!metaResult.valid) {
    errors.push(metaResult.message);
    score -= 15;
  }
  
  // Keyword in title
  if (!seoData.seoTitle.toLowerCase().includes(seoData.primaryKeyword.toLowerCase())) {
    warnings.push("Primary keyword not found in SEO title");
    score -= 10;
  }
  
  // Keyword in meta description
  if (!seoData.metaDescription.toLowerCase().includes(seoData.primaryKeyword.toLowerCase())) {
    warnings.push("Primary keyword not found in meta description");
    score -= 5;
  }
  
  // Keyword density
  const density = calculateKeywordDensity(content, seoData.primaryKeyword);
  if (density < 0.5) {
    warnings.push(`Keyword density too low (${density.toFixed(2)}%)`);
    score -= 10;
  } else if (density > 2.5) {
    errors.push(`Keyword stuffing detected (${density.toFixed(2)}% density)`);
    score -= 20;
  }
  
  // Heading structure
  const headingResult = validateHeadingStructure(content);
  if (!headingResult.valid) {
    headingResult.issues.forEach(issue => warnings.push(issue));
    score -= headingResult.issues.length * 5;
  }
  
  // Slug validation
  if (!seoData.slug || seoData.slug.length < 3) {
    errors.push("Invalid slug");
    score -= 10;
  }
  
  // Keyword in first 100 words
  const first100Words = content.split(/\s+/).slice(0, 100).join(" ").toLowerCase();
  if (!first100Words.includes(seoData.primaryKeyword.toLowerCase())) {
    warnings.push("Primary keyword not found in first 100 words");
    score -= 5;
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    score: Math.max(0, score),
  };
}

/**
 * Generate Article JSON-LD schema
 */
export function generateArticleSchema(post: {
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: Date | string;
  updatedAt: Date | string;
  authorName?: string;
  coverImageUrl?: string;
  wordCount?: number;
}): object {
  const publishedDate = post.publishedAt instanceof Date 
    ? post.publishedAt.toISOString() 
    : post.publishedAt;
  const modifiedDate = post.updatedAt instanceof Date 
    ? post.updatedAt.toISOString() 
    : post.updatedAt;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${SITE_URL}/blog/${post.slug}#article`,
    headline: post.title,
    description: post.excerpt,
    url: `${SITE_URL}/blog/${post.slug}`,
    datePublished: publishedDate,
    dateModified: modifiedDate,
    author: {
      "@type": "Organization",
      name: post.authorName || "Water Damage Repair USA",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "Water Damage Repair USA",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/water-damage-logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${post.slug}`,
    },
    image: post.coverImageUrl || `${SITE_URL}/water-damage-logo.png`,
    wordCount: post.wordCount,
    inLanguage: "en-US",
    isAccessibleForFree: true,
  };
}

/**
 * Generate FAQPage JSON-LD schema
 */
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(faq => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate BreadcrumbList JSON-LD schema
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

/**
 * Generate complete blog post schema
 */
export function generateBlogPostSchema(post: {
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: Date | string;
  updatedAt: Date | string;
  authorName?: string;
  coverImageUrl?: string;
  wordCount?: number;
  faqs?: Array<{ question: string; answer: string }>;
}): object[] {
  const schemas: object[] = [];
  
  // Article schema
  schemas.push(generateArticleSchema(post));
  
  // FAQ schema (if FAQs exist)
  if (post.faqs && post.faqs.length > 0) {
    schemas.push(generateFAQSchema(post.faqs));
  }
  
  // Breadcrumb schema
  schemas.push(generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" },
    { name: post.title, url: `/blog/${post.slug}` },
  ]));
  
  return schemas;
}

/**
 * Generate canonical URL
 */
export function generateCanonicalUrl(slug: string): string {
  return `${SITE_URL}/blog/${slug}`;
}

/**
 * Generate slug from title
 */
export function generateSlug(title: string, existingSlugs: string[] = []): string {
  let baseSlug = slugify(title);
  let slug = baseSlug;
  let counter = 1;
  
  // Ensure unique slug
  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
}

/**
 * Optimize title for SEO
 */
export function optimizeSEOTitle(title: string, keyword: string): string {
  // If title already contains keyword, just ensure length
  if (title.toLowerCase().includes(keyword.toLowerCase())) {
    if (title.length <= 60) return title;
    // Truncate at word boundary
    const truncated = title.substring(0, 57);
    const lastSpace = truncated.lastIndexOf(" ");
    return truncated.substring(0, lastSpace) + "...";
  }
  
  // Try to prepend keyword if it makes sense
  const withKeyword = `${keyword}: ${title}`;
  if (withKeyword.length <= 60) {
    return withKeyword;
  }
  
  // Just return truncated title
  if (title.length <= 60) return title;
  const truncated = title.substring(0, 57);
  const lastSpace = truncated.lastIndexOf(" ");
  return truncated.substring(0, lastSpace) + "...";
}

/**
 * Optimize meta description for SEO
 */
export function optimizeMetaDescription(
  description: string,
  keyword: string
): string {
  // If already contains keyword and is correct length, return as-is
  if (
    description.toLowerCase().includes(keyword.toLowerCase()) &&
    description.length >= 70 &&
    description.length <= 160
  ) {
    return description;
  }
  
  // Try to add keyword at the beginning
  if (!description.toLowerCase().includes(keyword.toLowerCase())) {
    const withKeyword = `${keyword} - ${description}`;
    if (withKeyword.length <= 160) {
      description = withKeyword;
    }
  }
  
  // Ensure correct length
  if (description.length > 160) {
    const truncated = description.substring(0, 157);
    const lastSpace = truncated.lastIndexOf(" ");
    return truncated.substring(0, lastSpace) + "...";
  }
  
  return description;
}
