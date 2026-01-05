/**
 * Blog Settings API
 * 
 * GET /api/blog/settings - Get all settings (admin only)
 * PUT /api/blog/settings - Update settings (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { db, blogSettings } from "@/lib/db";
import { eq } from "drizzle-orm";
import { verifyAdmin } from "@/lib/auth/utils";

// Default settings
const DEFAULT_SETTINGS: Record<string, { value: any; description: string }> = {
  generation_config: {
    value: {
      autopublish: false,
      tone: "conversational",
      targetWordCount: { min: 1500, max: 2500 },
      brandVoice: "We're pickleball enthusiasts helping you find the best places to play. Our content is friendly, informative, and focused on helping players of all skill levels enjoy the sport.",
      includeExamples: true,
      includeTips: true,
      maxInternalLinks: 5,
      faqCount: { min: 3, max: 6 },
    },
    description: "Configuration for the content generation pipeline",
  },
  schedule_config: {
    value: {
      enabled: false,
      frequency: "daily",
      postsPerRun: 1,
      timezone: "America/New_York",
      preferredHours: [9, 10, 11, 14, 15, 16],
    },
    description: "Configuration for automatic content scheduling",
  },
  ai_config: {
    value: {
      textModel: "models/gemini-3-flash-preview",
      imageModel: "models/gemini-3-pro-image-preview",
      temperature: 0.7,
    },
    description: "AI model configuration",
  },
  localization_config: {
    value: {
      defaultLanguage: "en",
      defaultLocale: "en-US",
    },
    description: "Language and locale settings",
  },
  seo_config: {
    value: {
      defaultOgImage: "/pickleball-logo.png",
      siteName: "PickleballCourts.io",
      authorName: "PickleballCourts.io Team",
      enableFAQSchema: true,
      enableArticleSchema: true,
      enableBreadcrumbSchema: true,
    },
    description: "SEO-related configuration",
  },
};

export async function GET(request: NextRequest) {
  try {
    // Auth check
    await verifyAdmin();

    // Get all settings from database
    const settings = await db.select().from(blogSettings);

    // Merge with defaults
    const mergedSettings: Record<string, any> = {};
    
    for (const [key, defaultSetting] of Object.entries(DEFAULT_SETTINGS)) {
      const dbSetting = settings.find(s => s.key === key);
      mergedSettings[key] = dbSetting?.value ?? defaultSetting.value;
    }

    // Flatten for frontend
    const flatSettings = {
      autopublish: mergedSettings.generation_config.autopublish,
      writingStyle: mergedSettings.generation_config.tone,
      brandVoice: mergedSettings.generation_config.brandVoice,
      targetWordCountMin: mergedSettings.generation_config.targetWordCount.min,
      targetWordCountMax: mergedSettings.generation_config.targetWordCount.max,
      internalLinksMin: mergedSettings.generation_config.maxInternalLinks - 2, // Approximate
      internalLinksMax: mergedSettings.generation_config.maxInternalLinks,
      faqCountMin: mergedSettings.generation_config.faqCount?.min ?? 3,
      faqCountMax: mergedSettings.generation_config.faqCount?.max ?? 6,
      scheduleFrequency: mergedSettings.schedule_config.frequency,
      geminiModel: mergedSettings.ai_config.textModel.replace("models/", ""),
      geminiTemperature: mergedSettings.ai_config.temperature,
      defaultLanguage: mergedSettings.localization_config.defaultLanguage,
      defaultLocale: mergedSettings.localization_config.defaultLocale,
    };

    return NextResponse.json({ settings: flatSettings });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Auth check
    await verifyAdmin();

    const body = await request.json();
    
    // Check if it's the flat object from frontend
    if (body.geminiModel !== undefined) {
      // Map flat object to grouped settings
      const groupedUpdates = {
        generation_config: {
          autopublish: body.autopublish,
          tone: body.writingStyle,
          brandVoice: body.brandVoice,
          targetWordCount: { min: body.targetWordCountMin, max: body.targetWordCountMax },
          maxInternalLinks: body.internalLinksMax,
          faqCount: { min: body.faqCountMin, max: body.faqCountMax },
          includeExamples: true,
          includeTips: true,
        },
        schedule_config: {
          frequency: body.scheduleFrequency,
          enabled: body.scheduleFrequency !== "manual",
        },
        ai_config: {
          textModel: body.geminiModel.startsWith("models/") ? body.geminiModel : `models/${body.geminiModel}`,
          imageModel: "models/gemini-3-pro-image-preview",
          temperature: body.geminiTemperature,
        },
        localization_config: {
          defaultLanguage: body.defaultLanguage,
          defaultLocale: body.defaultLocale,
        }
      };

      // Save each group
      for (const [key, value] of Object.entries(groupedUpdates)) {
        const [existing] = await db
          .select()
          .from(blogSettings)
          .where(eq(blogSettings.key, key))
          .limit(1);

        if (existing) {
          await db
            .update(blogSettings)
            .set({ value, updatedAt: new Date() })
            .where(eq(blogSettings.key, key));
        } else {
          await db
            .insert(blogSettings)
            .values({ key, value, description: DEFAULT_SETTINGS[key]?.description || "" });
        }
      }

      return NextResponse.json({ success: true });
    }

    // Original single key update support
    const { key, value, description } = body;
    if (!key || value === undefined) {
      return NextResponse.json(
        { error: "Key and value are required" },
        { status: 400 }
      );
    }

    // ... (rest of the original single key update logic if needed, but the above handles the frontend)
    const [existing] = await db
      .select()
      .from(blogSettings)
      .where(eq(blogSettings.key, key))
      .limit(1);

    if (existing) {
      await db
        .update(blogSettings)
        .set({ value, description: description ?? existing.description, updatedAt: new Date() })
        .where(eq(blogSettings.key, key));
    } else {
      await db
        .insert(blogSettings)
        .values({ key, value, description: description ?? DEFAULT_SETTINGS[key]?.description ?? null });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
