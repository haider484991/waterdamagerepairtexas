/**
 * Gemini AI Client
 * 
 * Provides a robust wrapper around Google's Gemini API for:
 * - Text generation (blog content, topics, outlines, FAQs)
 * - Image generation (OG images, cover images)
 * 
 * Features:
 * - Exponential backoff retry logic
 * - Rate limiting
 * - Token usage tracking
 */

// Model constants
export const GEMINI_TEXT_MODEL = "models/gemini-3-flash-preview";
export const GEMINI_IMAGE_MODEL = "models/gemini-3-pro-image-preview";

// Types
export interface GeminiConfig {
  apiKey: string;
  textModel?: string;
  imageModel?: string;
  temperature?: number;
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  requestsPerMinute?: number;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
}

export interface GenerationResult<T> {
  data: T;
  tokenUsage: TokenUsage;
}

export interface IntentAnalysis {
  searchIntent: "informational" | "transactional" | "navigational" | "commercial";
  targetAudience: string;
  suggestedAngle: string;
  keyPoints: string[];
  relatedQueries: string[];
}

export interface TopicIdea {
  title: string;
  angle: string;
  targetKeywords: string[];
  estimatedDifficulty: number; // 1-10
  relevanceScore: number; // 0-100
}

export interface ArticleOutline {
  title: string;
  introduction: string;
  sections: Array<{
    heading: string;
    subheadings?: string[];
    keyPoints: string[];
  }>;
  conclusion: string;
  suggestedFAQs: string[];
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface ArticleSettings {
  tone: "conversational" | "professional" | "friendly" | "authoritative";
  targetWordCount: { min: number; max: number };
  brandVoice?: string;
  includeExamples?: boolean;
  includeTips?: boolean;
  internalMentions?: Array<{ title: string; type: "post" | "business" }>;
}

// Rate limiter class
class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per ms

  constructor(requestsPerMinute: number) {
    this.maxTokens = requestsPerMinute;
    this.tokens = requestsPerMinute;
    this.lastRefill = Date.now();
    this.refillRate = requestsPerMinute / 60000; // per millisecond
  }

  async acquire(): Promise<void> {
    this.refill();
    
    if (this.tokens < 1) {
      const waitTime = (1 - this.tokens) / this.refillRate;
      await this.sleep(waitTime);
      this.refill();
    }
    
    this.tokens -= 1;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main Gemini Client
export class GeminiClient {
  private readonly apiKey: string;
  private readonly textModel: string;
  private readonly imageModel: string;
  private readonly temperature: number;
  private readonly maxRetries: number;
  private readonly baseDelay: number;
  private readonly maxDelay: number;
  private readonly rateLimiter: RateLimiter;

  constructor(config: GeminiConfig) {
    this.apiKey = config.apiKey;
    this.textModel = config.textModel || GEMINI_TEXT_MODEL;
    this.imageModel = config.imageModel || GEMINI_IMAGE_MODEL;
    this.temperature = config.temperature ?? 0.7;
    this.maxRetries = config.maxRetries ?? 3;
    this.baseDelay = config.baseDelay ?? 1000;
    this.maxDelay = config.maxDelay ?? 30000;
    this.rateLimiter = new RateLimiter(config.requestsPerMinute ?? 15);
  }

  /**
   * Make a request to the Gemini API with retry logic
   */
  private async makeRequest<T>(
    model: string,
    prompt: string,
    systemInstruction?: string,
    temperature?: number,
    maxTokens: number = 8192
  ): Promise<GenerationResult<T>> {
    let lastError: Error | null = null;
    const finalTemperature = temperature ?? this.temperature;
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        await this.rateLimiter.acquire();
        
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${this.apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [{ text: prompt }],
                },
              ],
              systemInstruction: systemInstruction ? {
                parts: [{ text: systemInstruction }],
              } : undefined,
              generationConfig: {
                temperature: finalTemperature,
                maxOutputTokens: maxTokens,
                responseMimeType: "application/json",
              },
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          // Check for rate limit errors
          if (response.status === 429) {
            const retryAfter = parseInt(response.headers.get("Retry-After") || "60", 10);
            await this.sleep(retryAfter * 1000);
            continue;
          }
          
          throw new Error(
            `Gemini API error: ${response.status} - ${JSON.stringify(errorData)}`
          );
        }

        const data = await response.json();
        
        // Extract the text response
        const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textContent) {
          throw new Error("No text content in Gemini response");
        }

        // Parse JSON response
        let parsedContent: T;
        try {
          parsedContent = JSON.parse(textContent);
        } catch {
          // If JSON parsing fails, return as-is (for plain text responses)
          parsedContent = textContent as T;
        }

        // Extract token usage
        const usageMetadata = data.usageMetadata || {};
        const tokenUsage: TokenUsage = {
          promptTokens: usageMetadata.promptTokenCount || 0,
          completionTokens: usageMetadata.candidatesTokenCount || 0,
          totalTokens: usageMetadata.totalTokenCount || 0,
          model,
        };

        return { data: parsedContent, tokenUsage };
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain errors
        if (
          error instanceof Error &&
          (error.message.includes("400") || error.message.includes("401"))
        ) {
          throw error;
        }
        
        // Exponential backoff
        const delay = Math.min(
          this.baseDelay * Math.pow(2, attempt),
          this.maxDelay
        );
        await this.sleep(delay);
      }
    }

    throw lastError || new Error("Max retries exceeded");
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Analyze search intent for a keyword
   */
  async analyzeIntent(keyword: string): Promise<GenerationResult<IntentAnalysis>> {
    const prompt = `Analyze the search intent for the keyword: "${keyword}"

Consider this is for a water damage restoration website serving Texas (WaterDamageRepairTexas.net).

Return a JSON object with:
{
  "searchIntent": "informational" | "transactional" | "navigational" | "commercial",
  "targetAudience": "description of who searches this",
  "suggestedAngle": "unique angle to approach this topic",
  "keyPoints": ["array of 3-5 key points to cover"],
  "relatedQueries": ["array of 3-5 related search queries"]
}`;

    const systemInstruction = `You are an SEO expert specializing in water damage restoration content. Analyze keywords to understand user intent and suggest content strategies. Always respond with valid JSON.`;

    return this.makeRequest<IntentAnalysis>(
      this.textModel,
      prompt,
      systemInstruction,
      0.5
    );
  }

  /**
   * Generate topic ideas from a keyword
   */
  async generateTopics(
    keyword: string,
    count: number = 10,
    existingTitles: string[] = []
  ): Promise<GenerationResult<TopicIdea[]>> {
    const existingContext = existingTitles.length > 0
      ? `\n\nAvoid these existing titles:\n${existingTitles.slice(0, 20).join("\n")}`
      : "";

    const prompt = `Generate ${count} unique blog post topic ideas for the keyword: "${keyword}"

This is for WaterDamageRepairTexas.net, a directory and resource site for Texas property owners dealing with water damage.
${existingContext}

Return a JSON array of objects:
[
  {
    "title": "Compelling, SEO-friendly title (50-60 chars)",
    "angle": "Unique perspective or approach",
    "targetKeywords": ["primary keyword", "secondary keywords"],
    "estimatedDifficulty": 1-10 (1=easy to rank, 10=very competitive),
    "relevanceScore": 0-100 (relevance to water damage restoration audience)
  }
]

Focus on:
- Long-tail variations
- Question-based titles
- How-to guides
- Comparison posts
- Local/regional angles
- Beginner to advanced topics`;

    const systemInstruction = `You are a content strategist for a water damage restoration website. Generate unique, SEO-optimized topic ideas that would rank well and provide value to readers. Always respond with valid JSON array.`;

    return this.makeRequest<TopicIdea[]>(
      this.textModel,
      prompt,
      systemInstruction,
      0.8
    );
  }

  /**
   * Generate an article outline
   */
  async generateOutline(
    topic: TopicIdea,
    settings: ArticleSettings
  ): Promise<GenerationResult<ArticleOutline>> {
    const prompt = `Create a detailed blog post outline for:

Title: "${topic.title}"
Angle: ${topic.angle}
Target Keywords: ${topic.targetKeywords.join(", ")}
Target Word Count: ${settings.targetWordCount.min}-${settings.targetWordCount.max} words
Tone: ${settings.tone}
${settings.brandVoice ? `Brand Voice: ${settings.brandVoice}` : ""}

Return a JSON object:
{
  "title": "Final optimized title",
  "introduction": "2-3 sentence intro outline with hook",
  "sections": [
    {
      "heading": "H2 heading",
      "subheadings": ["H3 subheadings if needed"],
      "keyPoints": ["3-5 bullet points to cover in this section"]
    }
  ],
  "conclusion": "Key takeaways and CTA outline",
  "suggestedFAQs": ["5-6 FAQ questions for the topic"]
}

Create 4-7 main sections that thoroughly cover the topic.
Include practical tips, examples, and actionable advice.`;

    const systemInstruction = `You are an expert water damage restoration content writer. Create comprehensive outlines that result in helpful, well-structured articles. Always respond with valid JSON.`;

    return this.makeRequest<ArticleOutline>(
      this.textModel,
      prompt,
      systemInstruction,
      0.6
    );
  }

  /**
   * Generate a full article from an outline
   */
  async generateArticle(
    outline: ArticleOutline,
    settings: ArticleSettings,
    primaryKeyword: string
  ): Promise<GenerationResult<string>> {
    const mentionsPrompt = settings.internalMentions && settings.internalMentions.length > 0
      ? `\n\nNaturally mention these related topics or businesses in the content to help readers find more information:\n${settings.internalMentions.map(m => `- ${m.title} (${m.type})`).join("\n")}`
      : "";

    const prompt = `Write a complete blog article based on this outline:

${JSON.stringify(outline, null, 2)}

Requirements:
- Target word count: ${settings.targetWordCount.min}-${settings.targetWordCount.max} words
- Tone: ${settings.tone}
- Primary keyword: "${primaryKeyword}" (use naturally, 0.5-2% density)
${settings.brandVoice ? `- Brand voice: ${settings.brandVoice}` : ""}
${settings.includeExamples ? "- Include real-world examples" : ""}
${settings.includeTips ? "- Include actionable tips and pro tips" : ""}${mentionsPrompt}

Format the article in Markdown:
- Use ## for H2 headings, ### for H3
- Use bullet points and numbered lists where appropriate
- Include a brief intro paragraph before the first heading
- Add transition sentences between sections
- End with a clear conclusion

Write naturally for humans, not search engines. Be helpful and informative.
Do NOT include the title in the output (it will be added separately).
Do NOT include any JSON wrapping - just return the Markdown content.`;

    const systemInstruction = `You are a professional water damage restoration content writer for WaterDamageRepairTexas.net. Write engaging, helpful articles that provide real value to readers. Your content should be well-researched, accurate, and actionable. Avoid fluff, keyword stuffing, and generic advice. Return only the Markdown article content.`;

    const result = await this.makeRequest<string>(
      this.textModel,
      prompt,
      systemInstruction,
      0.7,
      16384 // Larger token limit for articles
    );

    // Clean up the response if it's wrapped in JSON
    let content = result.data;
    if (typeof content === "object") {
      content = JSON.stringify(content);
    }
    
    // Remove any JSON wrapper if present
    content = content.replace(/^["']|["']$/g, "").replace(/\\n/g, "\n");

    return { data: content, tokenUsage: result.tokenUsage };
  }

  /**
   * Generate FAQs for an article
   */
  async generateFAQ(
    articleContent: string,
    primaryKeyword: string,
    count: number = 5
  ): Promise<GenerationResult<FAQ[]>> {
    const prompt = `Based on this article about "${primaryKeyword}", generate ${count} FAQ questions and answers.

Article excerpt (first 2000 chars):
${articleContent.substring(0, 2000)}...

Return a JSON array:
[
  {
    "question": "Natural question a reader might ask",
    "answer": "Concise, helpful answer (2-4 sentences)"
  }
]

Requirements:
- Questions should be what real people would search for
- Answers should be helpful and accurate
- Include a mix of basic and advanced questions
- Answers should be standalone (not reference the article)`;

    const systemInstruction = `You are creating FAQ content for a water damage restoration website. Generate questions that real people search for, with helpful, accurate answers. Always respond with valid JSON array.`;

    return this.makeRequest<FAQ[]>(
      this.textModel,
      prompt,
      systemInstruction,
      0.5
    );
  }

  /**
   * Polish article for SEO
   */
  async polishForSEO(
    content: string,
    primaryKeyword: string,
    secondaryKeywords: string[]
  ): Promise<GenerationResult<{ content: string; seoTitle: string; metaDescription: string; excerpt: string }>> {
    const prompt = `Review and polish this article for SEO optimization.

Primary keyword: "${primaryKeyword}"
Secondary keywords: ${secondaryKeywords.join(", ")}

Article:
${content.substring(0, 8000)}${content.length > 8000 ? "..." : ""}

Return a JSON object:
{
  "content": "The polished article content in Markdown (return full content even if truncated above)",
  "seoTitle": "SEO-optimized title (max 60 chars, include primary keyword)",
  "metaDescription": "Compelling meta description (max 155 chars, include primary keyword)",
  "excerpt": "2-3 sentence excerpt for blog listing (max 200 chars)"
}

Ensure:
- Primary keyword appears in first 100 words
- Headings include keywords naturally
- Keyword density is 0.5-2%
- No keyword stuffing
- Content flows naturally`;

    const systemInstruction = `You are an SEO specialist. Polish content for search optimization while maintaining readability and helpfulness. Never sacrifice quality for keyword inclusion. Always respond with valid JSON.`;

    return this.makeRequest<{ content: string; seoTitle: string; metaDescription: string; excerpt: string }>(
      this.textModel,
      prompt,
      systemInstruction,
      0.4,
      16384
    );
  }

  /**
   * Generate an OG image prompt (for use with image generation)
   */
  async generateImagePrompt(
    title: string,
    topic: string
  ): Promise<GenerationResult<string>> {
    const prompt = `Create a prompt for generating an OG image for a blog post.

Title: "${title}"
Topic: ${topic}

Return a JSON object:
{
  "imagePrompt": "Detailed image generation prompt (50-100 words)"
}

The prompt should describe:
- A clean, professional blog header image
- Water damage restoration imagery (flooded homes, restoration equipment, professionals at work)
- Modern, vibrant style suitable for social sharing
- No text in the image (title will be overlaid separately)
- Landscape orientation (1200x630)`;

    const systemInstruction = `You are an image prompt engineer. Create prompts that generate clean, professional blog images suitable for social media sharing. Always respond with valid JSON.`;

    const result = await this.makeRequest<{ imagePrompt: string }>(
      this.textModel,
      prompt,
      systemInstruction,
      0.7
    );

    return { data: result.data.imagePrompt, tokenUsage: result.tokenUsage };
  }

  /**
   * Generate an OG image for social sharing
   * Returns base64 data URL or file path
   */
  async generateOGImage(
    title: string,
    excerpt: string
  ): Promise<GenerationResult<string>> {
    // First, generate an image prompt
    const promptResult = await this.generateImagePrompt(title, excerpt);
    const imagePrompt = promptResult.data;

    // Now generate the actual image using Imagen 3
    const fullPrompt = `${imagePrompt}

Style: Modern, clean, professional blog header image for social media sharing.
Aspect ratio: 1200x630 (landscape)
Colors: Use blue/cyan theme (#0ea5e9, #22d3ee) with professional water damage restoration imagery.
No text overlay - image only.`;

    try {
      await this.rateLimiter.acquire();

      // Check if it's an Imagen model or Gemini Image model
      const isImagen = this.imageModel.includes("imagen");
      // gemini-3 models usually use generateContent
      const endpoint = isImagen ? "predict" : "generateContent";

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${this.imageModel}:${endpoint}?key=${this.apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(isImagen ? {
            instances: [
              { prompt: fullPrompt }
            ],
            parameters: {
              sampleCount: 1,
              aspectRatio: "16:9"
            }
          } : {
            contents: [
              {
                parts: [{ text: fullPrompt }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Gemini image generation error: ${response.status} - ${JSON.stringify(errorData)}`
        );
      }

      const data = await response.json();
      
      // Extract the image data
      let base64Data = "";
      
      if (isImagen) {
        // Imagen 3 response format
        base64Data = data.predictions?.[0]?.bytesBase64Encoded || data.predictions?.[0]?.inlineData?.data || "";
      } else {
        // Standard Gemini model response format
        const part = data.candidates?.[0]?.content?.parts?.[0];
        if (part?.inlineData?.data) {
          base64Data = part.inlineData.data;
        } else if (typeof part?.text === "string" && part.text.length > 100) {
          base64Data = part.text.trim();
        }
      }

      if (!base64Data) {
        console.error("Gemini image response format:", JSON.stringify(data, null, 2));
        throw new Error("No image data found in Gemini response");
      }

      const dataUrl = `data:image/png;base64,${base64Data}`;

      return {
        data: dataUrl,
        tokenUsage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          model: this.imageModel,
        },
      };
    } catch (error) {
      // Fallback to placeholder if generation fails
      console.error("OG image generation failed:", error);
      return {
        data: `/water-damage-logo.png`, // Fallback to default image
        tokenUsage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          model: this.imageModel,
        },
      };
    }
  }

  /**
   * Generate a cover image for a blog post
   */
  async generateCoverImage(
    topic: string,
    style: string = "modern"
  ): Promise<GenerationResult<string>> {
    const prompt = `Generate a professional blog cover image for a water damage restoration article.
Topic: ${topic}
Style: ${style}, vibrant, engaging, action-oriented. No text overlay.`;

    try {
      await this.rateLimiter.acquire();

      const isImagen = this.imageModel.includes("imagen");
      const endpoint = isImagen ? "predict" : "generateContent";

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${this.imageModel}:${endpoint}?key=${this.apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(isImagen ? {
            instances: [
              { prompt: prompt }
            ],
            parameters: {
              sampleCount: 1,
              aspectRatio: "16:9"
            }
          } : {
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.8,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Gemini cover image generation error: ${response.status} - ${JSON.stringify(errorData)}`
        );
      }

      const data = await response.json();
      
      // Extract the image data
      let base64Data = "";
      if (isImagen) {
        base64Data = data.predictions?.[0]?.bytesBase64Encoded || data.predictions?.[0]?.inlineData?.data || "";
      } else {
        const part = data.candidates?.[0]?.content?.parts?.[0];
        if (part?.inlineData?.data) {
          base64Data = part.inlineData.data;
        } else if (typeof part?.text === "string" && part.text.length > 100) {
          base64Data = part.text.trim();
        }
      }

      if (!base64Data) {
        throw new Error("No image data found in Gemini response");
      }

      const dataUrl = `data:image/png;base64,${base64Data}`;

      return {
        data: dataUrl,
        tokenUsage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          model: this.imageModel,
        },
      };
    } catch (error) {
      console.error("Cover image generation failed:", error);
      return {
        data: `/water-damage-logo.png`, // Fallback
        tokenUsage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          model: this.imageModel,
        },
      };
    }
  }

  /**
   * Check content quality
   */
  async checkContentQuality(
    content: string,
    primaryKeyword: string
  ): Promise<GenerationResult<{
    score: number;
    issues: string[];
    suggestions: string[];
    keywordDensity: number;
    readabilityScore: number;
  }>> {
    const prompt = `Analyze this blog article for quality and SEO.

Primary keyword: "${primaryKeyword}"

Article:
${content.substring(0, 6000)}${content.length > 6000 ? "..." : ""}

Return a JSON object:
{
  "score": 0-100 (overall quality score),
  "issues": ["List of problems found"],
  "suggestions": ["List of improvement suggestions"],
  "keywordDensity": 0.0-10.0 (percentage),
  "readabilityScore": 0-100 (Flesch-like score)
}

Check for:
- Keyword stuffing (>3% density)
- Thin content (<500 words)
- Missing headings structure
- Generic/placeholder text
- Spammy patterns
- Factual accuracy for water damage restoration content`;

    const systemInstruction = `You are a content quality analyst. Evaluate articles for SEO quality, readability, and helpfulness. Be thorough but fair. Always respond with valid JSON.`;

    return this.makeRequest<{
      score: number;
      issues: string[];
      suggestions: string[];
      keywordDensity: number;
      readabilityScore: number;
    }>(
      this.textModel,
      prompt,
      systemInstruction,
      0.3
    );
  }
}

// Factory function to create a client instance
export function createGeminiClient(config?: Partial<GeminiConfig>): GeminiClient {
  const apiKey = config?.apiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is required");
  }
  
  return new GeminiClient({
    apiKey,
    textModel: config?.textModel,
    imageModel: config?.imageModel,
    temperature: config?.temperature,
    maxRetries: config?.maxRetries ?? 3,
    baseDelay: config?.baseDelay ?? 1000,
    requestsPerMinute: config?.requestsPerMinute ?? 15,
  });
}

// Default export
export default GeminiClient;
