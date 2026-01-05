/**
 * Blog System Library
 * 
 * Central export for all blog-related functionality
 */

// Main generator
export {
  runGenerationPipeline,
  getGenerationConfig,
  getAIConfig,
  pickNextKeyword,
  getOrGenerateTopic,
  generateArticleContent,
  type GenerationConfig,
  type GenerationResult,
} from "./generator";

// Markdown processing
export {
  markdownToHtml,
  slugify,
  extractTOC,
  calculateReadingTime,
  countWords,
  sanitizeHtml,
  generateExcerpt,
  processMarkdown,
  type TOCItem,
} from "./markdown";

// SEO processing
export {
  validateSEOTitle,
  validateMetaDescription,
  calculateKeywordDensity,
  validateHeadingStructure,
  validateSEO,
  generateArticleSchema,
  generateFAQSchema,
  generateBreadcrumbSchema,
  generateBlogPostSchema,
  generateCanonicalUrl,
  generateSlug,
  optimizeSEOTitle,
  optimizeMetaDescription,
  type SEOValidationResult,
  type SEOData,
} from "./seo-processor";

// Internal linking
export {
  findRelatedPosts,
  findPostsByKeywordOverlap,
  findRelatedBusinesses,
  insertInternalLinks,
  generateRelatedPostsSection,
  checkInternalLinkCount,
  type LinkSuggestion,
  type InsertedLink,
} from "./internal-linker";

// Quality gates
export {
  runQualityChecks,
  detectSpamPatterns,
  detectPlaceholders,
  checkForDuplicates,
  calculateReadability,
  meetsPublishingRequirements,
  generateQualityReport,
  type QualityCheckResult,
  type QualityRequirements,
} from "./quality-gates";
