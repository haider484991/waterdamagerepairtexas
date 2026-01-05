/**
 * Quality Gates
 * 
 * Validates content before publishing:
 * - Minimum word count
 * - Duplicate detection
 * - Spam pattern detection
 * - Required metadata
 * - Content quality checks
 */

import { db, blogPosts } from "@/lib/db";
import { eq, or, sql } from "drizzle-orm";
import { countWords, extractTOC } from "./markdown";
import { validateSEO, calculateKeywordDensity, type SEOData } from "./seo-processor";

export interface QualityCheckResult {
  passed: boolean;
  score: number; // 0-100
  errors: string[];
  warnings: string[];
  metrics: {
    wordCount: number;
    headingCount: number;
    keywordDensity: number;
    faqCount: number;
    readabilityScore: number;
  };
}

export interface QualityRequirements {
  minWordCount: number;
  maxWordCount: number;
  minHeadings: number;
  minFAQs: number;
  maxKeywordDensity: number;
  minKeywordDensity: number;
}

const DEFAULT_REQUIREMENTS: QualityRequirements = {
  minWordCount: 1200,
  maxWordCount: 3500,
  minHeadings: 3,
  minFAQs: 3,
  maxKeywordDensity: 2.5,
  minKeywordDensity: 0.5,
};

/**
 * Run all quality checks
 */
export async function runQualityChecks(
  content: string,
  seoData: SEOData,
  faqs: Array<{ question: string; answer: string }>,
  requirements: Partial<QualityRequirements> = {}
): Promise<QualityCheckResult> {
  const reqs = { ...DEFAULT_REQUIREMENTS, ...requirements };
  const errors: string[] = [];
  const warnings: string[] = [];
  let score = 100;

  // Word count check
  const wordCount = countWords(content);
  if (wordCount < reqs.minWordCount) {
    errors.push(`Content too short: ${wordCount} words (min: ${reqs.minWordCount})`);
    score -= 20;
  } else if (wordCount > reqs.maxWordCount) {
    warnings.push(`Content may be too long: ${wordCount} words (max: ${reqs.maxWordCount})`);
    score -= 5;
  }

  // Heading structure check
  const toc = extractTOC(content);
  const headingCount = toc.length;
  if (headingCount < reqs.minHeadings) {
    errors.push(`Not enough headings: ${headingCount} (min: ${reqs.minHeadings})`);
    score -= 15;
  }

  // FAQ count check
  const faqCount = faqs.length;
  if (faqCount < reqs.minFAQs) {
    errors.push(`Not enough FAQs: ${faqCount} (min: ${reqs.minFAQs})`);
    score -= 10;
  } else if (faqCount > 8) {
    warnings.push(`Too many FAQs: ${faqCount}. Consider reducing to 5-6.`);
  }

  // Keyword density check
  const keywordDensity = calculateKeywordDensity(content, seoData.primaryKeyword);
  if (keywordDensity > reqs.maxKeywordDensity) {
    errors.push(`Keyword stuffing detected: ${keywordDensity.toFixed(2)}% (max: ${reqs.maxKeywordDensity}%)`);
    score -= 25;
  } else if (keywordDensity < reqs.minKeywordDensity) {
    warnings.push(`Low keyword density: ${keywordDensity.toFixed(2)}% (min: ${reqs.minKeywordDensity}%)`);
    score -= 5;
  }

  // SEO validation
  const seoResult = validateSEO(content, seoData);
  errors.push(...seoResult.errors);
  warnings.push(...seoResult.warnings);
  score = Math.min(score, seoResult.score);

  // Spam pattern detection
  const spamCheck = detectSpamPatterns(content);
  if (!spamCheck.passed) {
    errors.push(...spamCheck.issues);
    score -= spamCheck.issues.length * 10;
  }

  // Placeholder detection
  const placeholderCheck = detectPlaceholders(content);
  if (!placeholderCheck.passed) {
    errors.push(...placeholderCheck.issues);
    score -= placeholderCheck.issues.length * 15;
  }

  // Duplicate check
  const duplicateCheck = await checkForDuplicates(seoData.title, seoData.slug);
  if (!duplicateCheck.passed) {
    errors.push(...duplicateCheck.issues);
    score -= 30;
  }

  // Readability (simplified Flesch-like score)
  const readabilityScore = calculateReadability(content);
  if (readabilityScore < 40) {
    warnings.push(`Content may be difficult to read (score: ${readabilityScore})`);
    score -= 5;
  }

  return {
    passed: errors.length === 0,
    score: Math.max(0, score),
    errors,
    warnings,
    metrics: {
      wordCount,
      headingCount,
      keywordDensity,
      faqCount,
      readabilityScore,
    },
  };
}

/**
 * Detect spam patterns in content
 */
export function detectSpamPatterns(content: string): {
  passed: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  const contentLower = content.toLowerCase();

  // Spam phrases
  const spamPhrases = [
    "rank #1",
    "guaranteed results",
    "act now",
    "limited time offer",
    "click here to",
    "buy now",
    "order today",
    "free money",
    "get rich quick",
    "make money fast",
    "100% guaranteed",
    "no risk",
    "call now",
    "special promotion",
    "exclusive deal",
  ];

  for (const phrase of spamPhrases) {
    if (contentLower.includes(phrase)) {
      issues.push(`Spam phrase detected: "${phrase}"`);
    }
  }

  // Excessive exclamation marks
  const exclamationCount = (content.match(/!/g) || []).length;
  if (exclamationCount > 5) {
    issues.push(`Too many exclamation marks: ${exclamationCount}`);
  }

  // ALL CAPS words (more than 3 consecutive caps words)
  const capsPattern = /\b[A-Z]{2,}\b(\s+[A-Z]{2,}\b){2,}/g;
  if (capsPattern.test(content)) {
    issues.push("Excessive use of ALL CAPS detected");
  }

  // Repetitive words (same word more than 5 times in a paragraph)
  const paragraphs = content.split(/\n\n+/);
  for (const para of paragraphs) {
    const words = para.toLowerCase().split(/\s+/);
    const wordCounts = new Map<string, number>();
    
    for (const word of words) {
      if (word.length > 3) {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    }
    
    for (const [word, count] of wordCounts) {
      if (count > 5 && words.length > 20) {
        issues.push(`Word "${word}" repeated ${count} times in one paragraph`);
        break; // Only report once per paragraph
      }
    }
  }

  return {
    passed: issues.length === 0,
    issues,
  };
}

/**
 * Detect placeholder text
 */
export function detectPlaceholders(content: string): {
  passed: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  const contentLower = content.toLowerCase();

  // Common placeholder patterns
  const placeholders = [
    "lorem ipsum",
    "[insert",
    "[add",
    "[todo",
    "[placeholder",
    "xxx",
    "tbd",
    "coming soon",
    "[your",
    "[example",
    "sample text",
    "placeholder text",
    "[fill in",
    "[replace",
    "edit this",
  ];

  for (const placeholder of placeholders) {
    if (contentLower.includes(placeholder)) {
      issues.push(`Placeholder text detected: "${placeholder}"`);
    }
  }

  // Incomplete sentences (ending with ...)
  const incompletePattern = /[a-z]\.\.\.\s*$/gm;
  const matches = content.match(incompletePattern);
  if (matches && matches.length > 2) {
    issues.push(`Multiple incomplete sentences detected (ending with ...)`);
  }

  return {
    passed: issues.length === 0,
    issues,
  };
}

/**
 * Check for duplicate title or slug
 */
export async function checkForDuplicates(
  title: string,
  slug: string,
  excludePostId?: string
): Promise<{
  passed: boolean;
  issues: string[];
}> {
  const issues: string[] = [];

  try {
    // Check for duplicate slug
    const existingSlug = await db
      .select({ id: blogPosts.id })
      .from(blogPosts)
      .where(
        excludePostId
          ? sql`${blogPosts.slug} = ${slug} AND ${blogPosts.id} != ${excludePostId}`
          : eq(blogPosts.slug, slug)
      )
      .limit(1);

    if (existingSlug.length > 0) {
      issues.push(`Duplicate slug exists: "${slug}"`);
    }

    // Check for very similar titles (basic check)
    const existingTitle = await db
      .select({ id: blogPosts.id, title: blogPosts.title })
      .from(blogPosts)
      .where(
        excludePostId
          ? sql`LOWER(${blogPosts.title}) = LOWER(${title}) AND ${blogPosts.id} != ${excludePostId}`
          : sql`LOWER(${blogPosts.title}) = LOWER(${title})`
      )
      .limit(1);

    if (existingTitle.length > 0) {
      issues.push(`Duplicate title exists: "${title}"`);
    }
  } catch (error) {
    console.error("Error checking for duplicates:", error);
    // Don't fail on DB errors, just warn
  }

  return {
    passed: issues.length === 0,
    issues,
  };
}

/**
 * Calculate simplified readability score (0-100)
 * Higher score = easier to read
 */
export function calculateReadability(content: string): number {
  // Remove markdown syntax
  const text = content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]+`/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#*_~`>-]/g, "")
    .replace(/\n+/g, " ");

  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  
  if (sentences.length === 0 || words.length === 0) {
    return 50; // Default for empty content
  }

  // Average words per sentence
  const avgWordsPerSentence = words.length / sentences.length;
  
  // Average syllables per word (simplified estimation)
  const syllables = words.reduce((sum, word) => sum + estimateSyllables(word), 0);
  const avgSyllablesPerWord = syllables / words.length;

  // Simplified Flesch Reading Ease formula
  // Score = 206.835 - (1.015 × ASL) - (84.6 × ASW)
  // Where ASL = Average Sentence Length, ASW = Average Syllables per Word
  const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
  
  // Normalize to 0-100
  return Math.max(0, Math.min(100, score));
}

/**
 * Estimate syllable count in a word
 */
function estimateSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length <= 3) return 1;
  
  // Count vowel groups
  const vowels = word.match(/[aeiouy]+/g);
  let count = vowels ? vowels.length : 1;
  
  // Adjust for silent e
  if (word.endsWith("e") && count > 1) {
    count--;
  }
  
  // Adjust for common patterns
  if (word.endsWith("le") && word.length > 2 && !/[aeiouy]/.test(word.charAt(word.length - 3))) {
    count++;
  }
  
  return Math.max(1, count);
}

/**
 * Check if content meets minimum requirements for publishing
 */
export function meetsPublishingRequirements(result: QualityCheckResult): boolean {
  // Must pass with no critical errors
  if (!result.passed) return false;
  
  // Must have minimum score
  if (result.score < 60) return false;
  
  // Must have minimum word count
  if (result.metrics.wordCount < 800) return false;
  
  // Must have some headings
  if (result.metrics.headingCount < 2) return false;
  
  return true;
}

/**
 * Generate quality report
 */
export function generateQualityReport(result: QualityCheckResult): string {
  const lines: string[] = [];
  
  lines.push(`# Content Quality Report`);
  lines.push(``);
  lines.push(`**Overall Score:** ${result.score}/100 ${result.passed ? "✅" : "❌"}`);
  lines.push(``);
  
  lines.push(`## Metrics`);
  lines.push(`- Word Count: ${result.metrics.wordCount}`);
  lines.push(`- Heading Count: ${result.metrics.headingCount}`);
  lines.push(`- Keyword Density: ${result.metrics.keywordDensity.toFixed(2)}%`);
  lines.push(`- FAQ Count: ${result.metrics.faqCount}`);
  lines.push(`- Readability Score: ${result.metrics.readabilityScore}`);
  lines.push(``);
  
  if (result.errors.length > 0) {
    lines.push(`## Errors (Must Fix)`);
    for (const error of result.errors) {
      lines.push(`- ❌ ${error}`);
    }
    lines.push(``);
  }
  
  if (result.warnings.length > 0) {
    lines.push(`## Warnings (Consider Fixing)`);
    for (const warning of result.warnings) {
      lines.push(`- ⚠️ ${warning}`);
    }
    lines.push(``);
  }
  
  if (result.errors.length === 0 && result.warnings.length === 0) {
    lines.push(`## Status`);
    lines.push(`✅ Content passes all quality checks!`);
  }
  
  return lines.join("\n");
}
