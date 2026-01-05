/**
 * Blog Content Generation Pipeline
 * 
 * Orchestrates the full article generation process:
 * 1. Pick keyword
 * 2. Generate/select topic
 * 3. Generate outline
 * 4. Generate article
 * 5. Run SEO processor
 * 6. Insert internal links
 * 7. Run quality gates
 * 8. Save as draft
 */

import { db, blogKeywords, blogTopics, blogPosts, blogPostKeywords, blogJobRuns, blogInternalLinks, blogSettings } from "@/lib/db";
import { eq, asc, desc, and, isNull, sql } from "drizzle-orm";
import { createGeminiClient, type ArticleSettings, type TopicIdea, type ArticleOutline, type FAQ } from "@/lib/gemini";
import { processMarkdown, slugify } from "./markdown";
import { validateSEO, generateCanonicalUrl, generateSlug, optimizeSEOTitle, optimizeMetaDescription, type SEOData } from "./seo-processor";
import { findRelatedPosts, findPostsByKeywordOverlap, findRelatedBusinesses, insertInternalLinks, generateRelatedPostsSection } from "./internal-linker";
import { runQualityChecks, meetsPublishingRequirements, generateQualityReport, type QualityCheckResult } from "./quality-gates";
import { uploadBlogImage } from "@/lib/supabase";
import type { BlogKeyword, BlogTopic, NewBlogPost, NewBlogJobRun, BlogPost } from "@/lib/db/schema";

export interface GenerationConfig {
  autopublish: boolean;
  tone: "conversational" | "professional" | "friendly" | "authoritative";
  targetWordCount: { min: number; max: number };
  brandVoice?: string;
  includeExamples: boolean;
  includeTips: boolean;
  maxInternalLinks: number;
}

export interface GenerationResult {
  success: boolean;
  postId?: string;
  post?: BlogPost;
  jobRunId: string;
  errors: string[];
  warnings: string[];
  qualityReport?: string;
  tokenUsage?: {
    total: number;
    byStep: Record<string, number>;
  };
}

const DEFAULT_CONFIG: GenerationConfig = {
  autopublish: false,
  tone: "conversational",
  targetWordCount: { min: 1500, max: 2500 },
  includeExamples: true,
  includeTips: true,
  maxInternalLinks: 5,
};

/**
 * Get generation settings from database
 */
export async function getGenerationConfig(): Promise<GenerationConfig> {
  try {
    const settings = await db
      .select()
      .from(blogSettings)
      .where(eq(blogSettings.key, "generation_config"))
      .limit(1);

    if (settings.length > 0 && settings[0].value) {
      return { ...DEFAULT_CONFIG, ...(settings[0].value as Partial<GenerationConfig>) };
    }
  } catch (error) {
    console.error("Error loading generation config:", error);
  }

  return DEFAULT_CONFIG;
}

/**
 * Get AI settings from database
 */
export async function getAIConfig(): Promise<{ textModel: string; imageModel: string; temperature: number }> {
  try {
    const settings = await db
      .select()
      .from(blogSettings)
      .where(eq(blogSettings.key, "ai_config"))
      .limit(1);

    if (settings.length > 0 && settings[0].value) {
      const val = settings[0].value as any;
      return {
        textModel: val.textModel || "models/gemini-3-flash-preview",
        imageModel: val.imageModel || "models/gemini-3-pro-image-preview",
        temperature: val.temperature ?? 0.7,
      };
    }
  } catch (error) {
    console.error("Error loading AI config:", error);
  }

  return {
    textModel: "models/gemini-3-flash-preview",
    imageModel: "models/gemini-3-pro-image-preview",
    temperature: 0.7,
  };
}

/**
 * Pick the next keyword to use based on priority and last used date
 */
export async function pickNextKeyword(): Promise<BlogKeyword | null> {
  try {
    const keywords = await db
      .select()
      .from(blogKeywords)
      .where(eq(blogKeywords.status, "pending"))
      .orderBy(desc(blogKeywords.priority), asc(blogKeywords.lastUsedAt))
      .limit(1);

    return keywords[0] || null;
  } catch (error) {
    console.error("Error picking next keyword:", error);
    return null;
  }
}

/**
 * Get or generate a topic for a keyword
 */
export async function getOrGenerateTopic(
  keyword: BlogKeyword
): Promise<{ topic: BlogTopic | null; generated: boolean; tokenUsage: number }> {
  try {
    // First, check for existing approved topics
    const existingTopics = await db
      .select()
      .from(blogTopics)
      .where(
        and(
          eq(blogTopics.keywordId, keyword.id),
          eq(blogTopics.status, "approved")
        )
      )
      .orderBy(desc(blogTopics.score))
      .limit(1);

    if (existingTopics.length > 0) {
      return { topic: existingTopics[0], generated: false, tokenUsage: 0 };
    }

    // Generate new topics
    const aiConfig = await getAIConfig();
    const gemini = createGeminiClient(aiConfig);
    
    // Get existing titles to avoid duplicates
    const existingPosts = await db
      .select({ title: blogPosts.title })
      .from(blogPosts)
      .limit(50);
    const existingTitles = existingPosts.map(p => p.title);

    const result = await gemini.generateTopics(keyword.keyword, 5, existingTitles);
    
    // Save topics to database
    const savedTopics: BlogTopic[] = [];
    for (const topicIdea of result.data) {
      const [saved] = await db
        .insert(blogTopics)
        .values({
          keywordId: keyword.id,
          title: topicIdea.title,
          angle: topicIdea.angle,
          score: topicIdea.relevanceScore,
          status: "pending",
          outline: null,
        })
        .returning();
      savedTopics.push(saved);
    }

    // Return the highest-scoring topic
    const bestTopic = savedTopics.sort((a, b) => (b.score || 0) - (a.score || 0))[0];
    
    return { 
      topic: bestTopic || null, 
      generated: true, 
      tokenUsage: result.tokenUsage.totalTokens 
    };
  } catch (error) {
    console.error("Error getting/generating topic:", error);
    return { topic: null, generated: false, tokenUsage: 0 };
  }
}

/**
 * Generate full article content
 */
export async function generateArticleContent(
  topic: BlogTopic,
  keyword: BlogKeyword,
  config: GenerationConfig
): Promise<{
  content: string;
  outline: ArticleOutline;
  faqs: FAQ[];
  tokenUsage: { outline: number; article: number; faq: number; seo: number };
} | null> {
  try {
    const aiConfig = await getAIConfig();
    const gemini = createGeminiClient(aiConfig);
    const tokenUsage = { outline: 0, article: 0, faq: 0, seo: 0 };

    // Settings for article generation
    const articleSettings: ArticleSettings = {
      tone: config.tone,
      targetWordCount: config.targetWordCount,
      brandVoice: config.brandVoice,
      includeExamples: config.includeExamples,
      includeTips: config.includeTips,
    };

    // 1. Generate outline
    const topicIdea: TopicIdea = {
      title: topic.title,
      angle: topic.angle || "",
      targetKeywords: [keyword.keyword],
      estimatedDifficulty: 5,
      relevanceScore: topic.score || 50,
    };

    const outlineResult = await gemini.generateOutline(topicIdea, articleSettings);
    tokenUsage.outline = outlineResult.tokenUsage.totalTokens;

    // Save outline to topic
    await db
      .update(blogTopics)
      .set({ 
        outline: { sections: outlineResult.data.sections.map(s => ({
          heading: s.heading,
          subheadings: s.subheadings,
          keyPoints: s.keyPoints,
        })) },
        updatedAt: new Date(),
      })
      .where(eq(blogTopics.id, topic.id));

    // 1.5 Find internal link suggestions BEFORE generating full article
    // This allows the AI to naturally mention these entities
    const relatedPosts = await findPostsByKeywordOverlap(topic.title);
    const relatedBusinesses = await findRelatedBusinesses(topic.title, 3);
    const allSuggestions = [...relatedPosts, ...relatedBusinesses];
    
    articleSettings.internalMentions = allSuggestions.map(s => ({
      title: s.targetTitle,
      type: s.type
    }));

    // 2. Generate full article
    const articleResult = await gemini.generateArticle(
      outlineResult.data,
      articleSettings,
      keyword.keyword
    );
    tokenUsage.article = articleResult.tokenUsage.totalTokens;

    // 3. Generate FAQs
    const faqResult = await gemini.generateFAQ(articleResult.data, keyword.keyword, 5);
    tokenUsage.faq = faqResult.tokenUsage.totalTokens;

    // 4. Polish for SEO
    const seoResult = await gemini.polishForSEO(
      articleResult.data,
      keyword.keyword,
      [] // Secondary keywords would come from keyword associations
    );
    tokenUsage.seo = seoResult.tokenUsage.totalTokens;

    return {
      content: seoResult.data.content || articleResult.data,
      outline: outlineResult.data,
      faqs: faqResult.data,
      tokenUsage,
    };
  } catch (error) {
    console.error("Error generating article content:", error);
    return null;
  }
}

/**
 * Create a job run record
 */
async function createJobRun(
  type: NewBlogJobRun["type"],
  keywordId?: string,
  topicId?: string
): Promise<string> {
  const [jobRun] = await db
    .insert(blogJobRuns)
    .values({
      type,
      status: "running",
      keywordId: keywordId || null,
      topicId: topicId || null,
      startedAt: new Date(),
      logs: [{ timestamp: new Date().toISOString(), level: "info", message: "Job started" }],
    })
    .returning();

  console.log(`\n🚀 [Blog Job ${jobRun.id.substring(0, 8)}] Started: ${type}`);
  return jobRun.id;
}

/**
 * Update job run with completion status
 */
async function completeJobRun(
  jobRunId: string,
  status: "completed" | "failed",
  postId?: string,
  error?: string,
  tokenUsage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number; model?: string }
): Promise<void> {
  const finishedAt = new Date();
  
  const [existing] = await db
    .select()
    .from(blogJobRuns)
    .where(eq(blogJobRuns.id, jobRunId))
    .limit(1);

  const startedAt = existing?.startedAt || finishedAt;
  const durationMs = finishedAt.getTime() - new Date(startedAt).getTime();

  const logs = existing?.logs || [];
  logs.push({ 
    timestamp: finishedAt.toISOString(), 
    level: status === "failed" ? "error" : "info", 
    message: status === "failed" ? `Job failed: ${error}` : "Job completed" 
  });

  // Log to terminal
  const durationSec = (durationMs / 1000).toFixed(1);
  if (status === "completed") {
    console.log(`✅ [Blog Job ${jobRunId.substring(0, 8)}] Completed in ${durationSec}s\n`);
  } else {
    console.error(`❌ [Blog Job ${jobRunId.substring(0, 8)}] FAILED in ${durationSec}s: ${error}\n`);
  }

  await db
    .update(blogJobRuns)
    .set({
      status,
      postId: postId || null,
      finishedAt,
      durationMs,
      logs,
      error: error || null,
      tokenUsage: tokenUsage || null,
    })
    .where(eq(blogJobRuns.id, jobRunId));
}

/**
 * Add log entry to job run
 */
async function addJobLog(
  jobRunId: string,
  level: "info" | "warn" | "error",
  message: string
): Promise<void> {
  // Output to terminal in real-time
  const timestamp = new Date().toLocaleTimeString();
  const prefix = level === "error" ? "❌" : level === "warn" ? "⚠️" : "ℹ️";
  console.log(`[${timestamp}] ${prefix} [Blog Job ${jobRunId.substring(0, 8)}] ${message}`);

  const [existing] = await db
    .select()
    .from(blogJobRuns)
    .where(eq(blogJobRuns.id, jobRunId))
    .limit(1);

  const logs = existing?.logs || [];
  logs.push({ timestamp: new Date().toISOString(), level, message });

  await db
    .update(blogJobRuns)
    .set({ logs })
    .where(eq(blogJobRuns.id, jobRunId));
}

/**
 * Run the full generation pipeline
 */
export async function runGenerationPipeline(
  keywordId?: string,
  topicId?: string,
  configOverrides?: Partial<GenerationConfig>,
  onJobId?: (jobId: string) => void
): Promise<GenerationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const tokenUsageByStep: Record<string, number> = {};
  let totalTokens = 0;

  // Create job run
  const jobRunId = await createJobRun("full_pipeline", keywordId, topicId);
  
  // Call callback with jobId if provided
  if (onJobId) {
    onJobId(jobRunId);
  }

  try {
    // Load config
    const baseConfig = await getGenerationConfig();
    const config = { ...baseConfig, ...configOverrides };

    // Step 1: Get keyword
    await addJobLog(jobRunId, "info", "Selecting keyword...");
    let keyword: BlogKeyword | null = null;

    if (keywordId) {
      const [kw] = await db
        .select()
        .from(blogKeywords)
        .where(eq(blogKeywords.id, keywordId))
        .limit(1);
      keyword = kw || null;
    } else {
      keyword = await pickNextKeyword();
    }

    if (!keyword) {
      throw new Error("No keyword available for content generation");
    }

    await addJobLog(jobRunId, "info", `Selected keyword: "${keyword.keyword}"`);

    // Update job run with keyword
    await db
      .update(blogJobRuns)
      .set({ keywordId: keyword.id })
      .where(eq(blogJobRuns.id, jobRunId));

    // Step 2: Get or generate topic
    await addJobLog(jobRunId, "info", "Getting/generating topic...");
    let topic: BlogTopic | null = null;

    if (topicId) {
      const [t] = await db
        .select()
        .from(blogTopics)
        .where(eq(blogTopics.id, topicId))
        .limit(1);
      topic = t || null;
    } else {
      const topicResult = await getOrGenerateTopic(keyword);
      topic = topicResult.topic;
      tokenUsageByStep.topicGeneration = topicResult.tokenUsage;
      totalTokens += topicResult.tokenUsage;
    }

    if (!topic) {
      throw new Error("Failed to get or generate topic");
    }

    await addJobLog(jobRunId, "info", `Topic: "${topic.title}"`);

    // Update job run with topic
    await db
      .update(blogJobRuns)
      .set({ topicId: topic.id })
      .where(eq(blogJobRuns.id, jobRunId));

    // Step 3: Generate article content
    await addJobLog(jobRunId, "info", "Generating article content...");
    const contentResult = await generateArticleContent(topic, keyword, config);

    if (!contentResult) {
      throw new Error("Failed to generate article content");
    }

    tokenUsageByStep.outline = contentResult.tokenUsage.outline;
    tokenUsageByStep.article = contentResult.tokenUsage.article;
    tokenUsageByStep.faq = contentResult.tokenUsage.faq;
    tokenUsageByStep.seo = contentResult.tokenUsage.seo;
    totalTokens += Object.values(contentResult.tokenUsage).reduce((a, b) => a + b, 0);

    await addJobLog(jobRunId, "info", "Article content generated");

    // Step 4: Process markdown
    await addJobLog(jobRunId, "info", "Processing markdown...");
    const processed = processMarkdown(contentResult.content);

    // Step 5: Insert internal links
    await addJobLog(jobRunId, "info", "Inserting internal links (Posts & Businesses)...");
    
    // Find suggestions based on the generated content
    // We do this again because the AI might have mentioned things we didn't predict
    const relatedPosts = await findPostsByKeywordOverlap(contentResult.content);
    const relatedBusinesses = await findRelatedBusinesses(contentResult.content, 5);
    
    const allSuggestions = [...relatedPosts, ...relatedBusinesses];
    
    const { content: contentWithLinks, insertedLinks } = insertInternalLinks(
      contentResult.content,
      allSuggestions,
      config.maxInternalLinks || 7
    );

    // Add related posts section
    let finalContent = contentWithLinks;
    if (relatedPosts.length > 0) {
      finalContent += generateRelatedPostsSection(relatedPosts, 4);
    }

    await addJobLog(jobRunId, "info", `Inserted ${insertedLinks.length} links (${insertedLinks.filter(l => l.type === 'post').length} posts, ${insertedLinks.filter(l => l.type === 'business').length} businesses)`);

    // Step 6: Generate SEO data
    await addJobLog(jobRunId, "info", "Generating SEO metadata...");
    
    // Get existing slugs
    const existingSlugs = await db
      .select({ slug: blogPosts.slug })
      .from(blogPosts);
    const slugList = existingSlugs.map(s => s.slug);

    const slug = generateSlug(topic.title, slugList);
    const seoTitle = optimizeSEOTitle(topic.title, keyword.keyword);
    const metaDescription = optimizeMetaDescription(processed.excerpt, keyword.keyword);
    const canonicalUrl = generateCanonicalUrl(slug);

    // Step 6.5: Generate Images
    await addJobLog(jobRunId, "info", "Generating images using AI...");
    const aiConfig = await getAIConfig();
    const gemini = createGeminiClient(aiConfig);
    
    let coverImageUrl = null;
    let ogImageUrl = null;

    try {
      const coverResult = await gemini.generateCoverImage(topic.title);
      const coverBase64 = coverResult.data;
      coverImageUrl = await uploadBlogImage(coverBase64, `${slug}-cover.png`);
      
      const ogResult = await gemini.generateOGImage(topic.title, processed.excerpt);
      const ogBase64 = ogResult.data;
      ogImageUrl = await uploadBlogImage(ogBase64, `${slug}-og.png`);
      
      if (coverImageUrl && ogImageUrl) {
        await addJobLog(jobRunId, "info", "Images generated and uploaded to Supabase successfully");
        
        // Update job run
        await db
          .update(blogJobRuns)
          .set({ imageGenerated: true })
          .where(eq(blogJobRuns.id, jobRunId));
      } else {
        await addJobLog(jobRunId, "error", "Image generation succeeded but Supabase upload failed. Check RLS policies.");
      }
    } catch (imageError) {
      console.error("Image generation failed:", imageError);
      await addJobLog(jobRunId, "warn", "Image generation failed - continuing without images");
    }

    const seoData: SEOData = {
      title: topic.title,
      seoTitle,
      metaDescription,
      slug,
      canonicalUrl,
      keywords: [keyword.keyword],
      primaryKeyword: keyword.keyword,
    };

    // Step 7: Run quality checks
    await addJobLog(jobRunId, "info", "Running quality checks...");
    const qualityResult = await runQualityChecks(finalContent, seoData, contentResult.faqs);
    const qualityReport = generateQualityReport(qualityResult);

    errors.push(...qualityResult.errors);
    warnings.push(...qualityResult.warnings);

    if (!meetsPublishingRequirements(qualityResult)) {
      await addJobLog(jobRunId, "warn", `Quality score: ${qualityResult.score}/100 - Below threshold`);
    } else {
      await addJobLog(jobRunId, "info", `Quality score: ${qualityResult.score}/100`);
    }

    // Step 8: Save post
    await addJobLog(jobRunId, "info", "Saving post...");

    // Re-process final content for HTML
    const finalProcessed = processMarkdown(finalContent);

    const postData: NewBlogPost = {
      topicId: topic.id,
      title: topic.title,
      slug,
      excerpt: finalProcessed.excerpt,
      contentMd: finalContent,
      contentHtml: finalProcessed.html,
      seoTitle,
        metaDescription,
        canonicalUrl,
        coverImageUrl,
        ogImageUrl,
        faqJson: contentResult.faqs,
        tocJson: finalProcessed.toc,
      readingTime: finalProcessed.readingTime,
      wordCount: finalProcessed.wordCount,
      status: config.autopublish && meetsPublishingRequirements(qualityResult) ? "published" : "draft",
      publishedAt: config.autopublish && meetsPublishingRequirements(qualityResult) ? new Date() : null,
    };

    const [savedPost] = await db
      .insert(blogPosts)
      .values(postData)
      .returning();

    // Save post-keyword relationship
    await db
      .insert(blogPostKeywords)
      .values({
        postId: savedPost.id,
        keywordId: keyword.id,
        isPrimary: true,
      });

    // Save internal links
    for (const link of insertedLinks) {
      await db
        .insert(blogInternalLinks)
        .values({
            sourcePostId: savedPost.id,
            targetPostId: link.type === 'post' ? link.targetId : null,
            targetBusinessId: link.type === 'business' ? link.targetId : null,
            anchorText: link.anchorText,
            inserted: true,
            position: link.position,
          });
    }

    // Update keyword status
    await db
      .update(blogKeywords)
      .set({
        status: "used",
        lastUsedAt: new Date(),
        usageCount: sql`${blogKeywords.usageCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(blogKeywords.id, keyword.id));

    // Update topic status
    await db
      .update(blogTopics)
      .set({
        status: "used",
        updatedAt: new Date(),
      })
      .where(eq(blogTopics.id, topic.id));

    // Complete job run
    await completeJobRun(jobRunId, "completed", savedPost.id, undefined, {
      totalTokens,
      model: "gemini-3-flash-preview",
    });

    await addJobLog(jobRunId, "info", `Post saved: ${savedPost.slug}`);

    return {
      success: true,
      postId: savedPost.id,
      post: savedPost,
      jobRunId,
      errors,
      warnings,
      qualityReport,
      tokenUsage: {
        total: totalTokens,
        byStep: tokenUsageByStep,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    errors.push(errorMessage);

    await completeJobRun(jobRunId, "failed", undefined, errorMessage);

    return {
      success: false,
      jobRunId,
      errors,
      warnings,
      tokenUsage: {
        total: totalTokens,
        byStep: tokenUsageByStep,
      },
    };
  }
}

/**
 * Export all blog library functions
 */
export * from "./markdown";
export * from "./seo-processor";
export * from "./internal-linker";
export * from "./quality-gates";
