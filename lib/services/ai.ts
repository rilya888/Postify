import { prisma } from "@/lib/db/prisma";
import { Platform } from "@/lib/constants/platforms";
import { GenerationOptions, GenerationResult, BulkGenerationResult } from "@/types/ai";
import { generateContentWithGracefulDegradation } from "@/lib/ai/openai-client";
import {
  getPlatformSystemPrompt,
  getPlatformUserTemplate,
  getPlatformUserTemplateFromPack,
  formatPrompt,
} from "@/lib/ai/prompt-templates";
import { getSeriesContext } from "@/lib/ai/series-context";
import {
  getOrCreateContentPack,
  formatContentPackForPrompt,
  type ContentPackData,
} from "@/lib/services/content-pack";
import {
  checkProjectQuota } from "../services/quota";
import { Logger } from "@/lib/utils/logger";
import { getProjectById } from "../services/projects";
import { logProjectChange } from "../services/project-history";
import { validatePlatformContent, sanitizeContent } from "@/lib/utils/content-validation";
import { PerformanceMonitor } from "@/lib/utils/performance";
import { getActiveBrandVoice } from "../services/brand-voice";
import {
  buildGenerationCacheKey,
  generateCacheKey,
  CACHE_TTL,
} from "@/lib/services/cache";
import { getModelConfig, LONG_TEXT_THRESHOLD_CHARS, GENERATION_CONCURRENCY } from "@/lib/constants/ai-models";
import type { Plan } from "@/lib/constants/plans";

/**
 * Run async tasks with limited concurrency.
 */
async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  let index = 0;
  async function worker(): Promise<void> {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i]);
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

/**
 * Serialize brand voice for {brandVoice} placeholder. Empty string if null.
 */
function serializeBrandVoiceForPrompt(brandVoice: { tone: string; style: string; personality: string; sentenceStructure: string; vocabulary: string[]; avoidVocabulary: string[]; examples: string[] } | null): string {
  if (!brandVoice) return "";
  return `
BRAND VOICE:
- Tone: ${brandVoice.tone}
- Style: ${brandVoice.style}
- Personality: ${brandVoice.personality}
- Sentence Structure: ${brandVoice.sentenceStructure}
- Preferred Vocabulary: ${(brandVoice.vocabulary || []).join(", ")}
- Vocabulary to Avoid: ${(brandVoice.avoidVocabulary || []).join(", ")}
- Example Content: ${(brandVoice.examples || []).slice(0, 2).join(" | ")}

Follow these brand voice characteristics while adapting for the platform.
`;
}

/**
 * Generate content for multiple platforms.
 * Uses short system prompt + user message (task + sourceContent + brandVoice). Deterministic cache key, no Date.now().
 */
export type GenerationSlot = { platform: Platform; seriesIndex: number };

export async function generateForPlatforms(
  projectId: string,
  userId: string,
  sourceContent: string,
  platforms: Platform[],
  options?: GenerationOptions,
  brandVoiceId?: string,
  requestId?: string,
  plan: Plan = "free",
  postsPerPlatform: number = 1,
  slotsOverride?: GenerationSlot[]
): Promise<BulkGenerationResult> {
  const operationId = `generateForPlatforms_${projectId}_${requestId ?? "no-req"}`;
  const genConfig = getModelConfig(plan).generate;
  const model = options?.model ?? genConfig.defaultModel;

  PerformanceMonitor.startMeasurement(operationId, {
    userId,
    projectId,
    platforms: platforms.length,
    postsPerPlatform,
    model,
  });

  try {
    const quota = await checkProjectQuota(userId);
    if (!quota.canCreate) {
      throw new Error(`Quota exceeded: ${quota.current}/${quota.limit}`);
    }

    const project = await getProjectById(projectId, userId);
    if (!project) {
      throw new Error("Project not found or access denied");
    }
    const slots: GenerationSlot[] =
      slotsOverride ??
      platforms.flatMap((p) =>
        Array.from({ length: postsPerPlatform }, (_, i) => ({ platform: p, seriesIndex: i + 1 }))
      );
    slots.sort((a, b) => a.seriesIndex - b.seriesIndex || a.platform.localeCompare(b.platform));

    let brandVoice: { id: string; updatedAt: Date; tone: string; style: string; personality: string; sentenceStructure: string; vocabulary: string[]; avoidVocabulary: string[]; examples: string[] } | null = null;
    if (brandVoiceId) {
      brandVoice = await prisma.brandVoice.findUnique({
        where: { id: brandVoiceId, userId },
      });
    } else {
      brandVoice = await getActiveBrandVoice(userId);
    }

    Logger.info("Starting content generation", {
      requestId,
      userId,
      projectId,
      platforms: platforms.length,
      sourceLength: sourceContent.length,
      brandVoiceId: brandVoice?.id,
    });

    const results: GenerationResult[] = [];
    const brandVoiceStr = serializeBrandVoiceForPrompt(brandVoice);
    const optionsHash = generateCacheKey(JSON.stringify(options ?? {}));

    const forcePack = sourceContent.length >= LONG_TEXT_THRESHOLD_CHARS;
    let pack: ContentPackData | null = null;
    try {
      pack = await getOrCreateContentPack(projectId, userId, sourceContent, {
        brandVoiceId: brandVoice?.id ?? undefined,
        brandVoiceUpdatedAt: brandVoice?.updatedAt ? brandVoice.updatedAt.toISOString() : undefined,
        plan,
      });
    } catch (packError) {
      if (forcePack) {
        Logger.error("Content Pack required for long text but build failed", packError as Error, {
          requestId,
          projectId,
          sourceLength: sourceContent.length,
        });
        throw new Error(
          "Source content is too long. Content Pack build failed. Please shorten the text or try again."
        );
      }
      Logger.info("Content Pack build failed, falling back to sourceContent", {
        requestId,
        projectId,
        error: packError instanceof Error ? packError.message : String(packError),
      });
    }

    const usePack = pack !== null;
    const formattedPack = usePack && pack ? formatContentPackForPrompt(pack) : "";
    const inputHashForCache = usePack ? generateCacheKey(formattedPack) : generateCacheKey(sourceContent);

    async function generateOneSlot(slot: GenerationSlot): Promise<GenerationResult> {
      const { platform, seriesIndex } = slot;
      const seriesTotalForPlatform = slots.filter((s) => s.platform === platform).length;
      const platformOperationId = `${operationId}_slot_${platform}_${seriesIndex}`;
      PerformanceMonitor.startMeasurement(platformOperationId, {
        userId,
        projectId,
        platform,
        seriesIndex,
      });

      let previousPostsSummary = "";
      if (seriesIndex > 1) {
        const previousOutputs = await prisma.output.findMany({
          where: { projectId, platform, seriesIndex: { lt: seriesIndex } },
          orderBy: { seriesIndex: "asc" },
          select: { content: true, seriesIndex: true },
        });
        previousPostsSummary = previousOutputs
          .map((o) => `Post ${o.seriesIndex}: ${o.content.slice(0, 220).trim()}${o.content.length > 220 ? "..." : ""}`)
          .join("\n\n");
      }

      const systemPrompt = getPlatformSystemPrompt(platform);
      const userTemplate = usePack
        ? getPlatformUserTemplateFromPack(platform)
        : getPlatformUserTemplate(platform);
      let userMessage = usePack
        ? formatPrompt(userTemplate, { contentPack: formattedPack, brandVoice: brandVoiceStr })
        : formatPrompt(userTemplate, { sourceContent, brandVoice: brandVoiceStr });
      if (seriesTotalForPlatform > 1) {
        const seriesContext = getSeriesContext(seriesIndex, seriesTotalForPlatform);
        userMessage = seriesContext + "\n\n" + userMessage;
      }
      if (previousPostsSummary) {
        userMessage =
          "PREVIOUS POSTS IN THIS SERIES:\n" +
          previousPostsSummary +
          "\n\nYour post should build on these without repeating them.\n\n" +
          userMessage;
      }

      const cacheKey = buildGenerationCacheKey({
        userId,
        projectId,
        step: usePack ? "generate_from_pack" : "generate",
        model,
        platform,
        inputHash: inputHashForCache,
        optionsHash,
        brandVoiceId: brandVoice?.id ?? null,
        brandVoiceUpdatedAt: brandVoice?.updatedAt ? brandVoice.updatedAt.toISOString() : null,
        seriesIndex,
        seriesTotal: seriesTotalForPlatform,
      });

      const temperature = options?.temperature ?? genConfig.temperatureByPlatform[platform];
      const maxTokens = options?.maxTokens ?? genConfig.maxTokensByPlatform[platform];

      try {
        const startMs = Date.now();
        const generationResult = await generateContentWithGracefulDegradation(
          userMessage,
          systemPrompt,
          { ...options, model, temperature, maxTokens },
          3,
          cacheKey,
          CACHE_TTL.OUTPUTS_SECONDS
        );
        const latencyMs = Date.now() - startMs;

        const sanitizedContent = sanitizeContent(generationResult.content);
        const validation = validatePlatformContent(sanitizedContent, platform);

        const metadata = {
          model,
          temperature,
          maxTokens,
          timestamp: new Date().toISOString(),
          success: true,
          validationMessages: validation.messages,
          source: generationResult.source,
          brandVoiceId: brandVoice?.id,
          latencyMs,
          tokensUsed: null as number | null,
          costEstimate: null as number | null,
          seed: null as number | null,
        };

        const output = await prisma.output.upsert({
          where: {
            projectId_platform_seriesIndex: { projectId, platform, seriesIndex },
          },
          update: {
            content: sanitizedContent,
            isEdited: false,
            generationMetadata: metadata as object,
          },
          create: {
            projectId,
            platform,
            seriesIndex,
            content: sanitizedContent,
            generationMetadata: metadata as object,
          },
        });

        const result: GenerationResult = {
          platform,
          seriesIndex,
          outputId: output.id,
          content: generationResult.content,
          success: true,
          metadata: {
            model,
            temperature,
            maxTokens,
            timestamp: new Date(),
            success: true,
            source: generationResult.source,
            brandVoiceId: brandVoice?.id,
          },
        };
        results.push(result);
        return result;
      } catch (error) {
        Logger.error("Error generating content for platform slot", error as Error, {
          userId,
          projectId,
          platform,
          seriesIndex,
        });

        const errorMetadata = {
          model,
          temperature,
          maxTokens,
          timestamp: new Date().toISOString(),
          success: false,
          errorMessage: error instanceof Error ? error.message : String(error),
          brandVoiceId: brandVoice?.id,
        };

        await prisma.output.upsert({
          where: {
            projectId_platform_seriesIndex: { projectId, platform, seriesIndex },
          },
          update: {
            content: "",
            generationMetadata: errorMetadata as object,
          },
          create: {
            projectId,
            platform,
            seriesIndex,
            content: "",
            generationMetadata: errorMetadata as object,
          },
        });

        const result: GenerationResult = {
          platform,
          seriesIndex,
          content: "",
          success: false,
          metadata: {
            model,
            temperature,
            maxTokens,
            timestamp: new Date(),
            success: false,
            errorMessage: error instanceof Error ? error.message : String(error),
            brandVoiceId: brandVoice?.id,
          },
          error: error instanceof Error ? error.message : String(error),
        };
        results.push(result);
        return result;
      } finally {
        PerformanceMonitor.endMeasurement(platformOperationId);
      }
    }

    // Process slots by seriesIndex so post 2/3 have previous posts in DB
    const maxSeriesIndex = slots.length > 0 ? Math.max(...slots.map((s) => s.seriesIndex)) : 0;
    for (let idx = 1; idx <= maxSeriesIndex; idx++) {
      const group = slots.filter((s) => s.seriesIndex === idx);
      await runWithConcurrency(group, GENERATION_CONCURRENCY, generateOneSlot);
    }

    // Separate successful and failed results
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    await logProjectChange(projectId, userId, "generate", {
      platforms,
      slots: slots.length,
      successful: successful.length,
      failed: failed.length,
      brandVoiceId: brandVoice?.id,
    });

    Logger.info("Content generation completed", {
      requestId,
      userId,
      projectId,
      successful: successful.length,
      failed: failed.length,
      totalSlots: slots.length,
      brandVoiceId: brandVoice?.id,
    });

    return {
      successful,
      failed,
      totalRequested: slots.length,
    };
  } finally {
    // End overall performance monitoring
    PerformanceMonitor.endMeasurement(operationId);
  }
}

/**
 * Regenerate content for a specific platform slot (single post or series post).
 */
export async function regenerateForPlatform(
  projectId: string,
  userId: string,
  sourceContent: string,
  platform: Platform,
  options?: GenerationOptions,
  brandVoiceId?: string,
  plan: Plan = "free",
  seriesIndex: number = 1
): Promise<GenerationResult> {
  const genConfig = getModelConfig(plan).generate;
  const model = options?.model ?? genConfig.defaultModel;
  const temperature = options?.temperature ?? genConfig.temperatureByPlatform[platform];
  const maxTokens = options?.maxTokens ?? genConfig.maxTokensByPlatform[platform];
  const operationId = `regenerateForPlatform_${projectId}_${platform}_${seriesIndex}`;

  PerformanceMonitor.startMeasurement(operationId, {
    userId,
    projectId,
    platform,
    seriesIndex,
    model,
  });

  try {
    const quota = await checkProjectQuota(userId);
    if (!quota.canCreate) {
      throw new Error(`Quota exceeded: ${quota.current}/${quota.limit}`);
    }

    const project = await getProjectById(projectId, userId);
    if (!project) {
      throw new Error("Project not found or access denied");
    }
    const proj = project as { postsPerPlatformByPlatform?: Record<string, number> | null; postsPerPlatform?: number | null };
    const seriesTotal =
      (proj.postsPerPlatformByPlatform && typeof proj.postsPerPlatformByPlatform === "object" && platform in proj.postsPerPlatformByPlatform
        ? proj.postsPerPlatformByPlatform[platform]
        : null) ?? proj.postsPerPlatform ?? 1;

    let brandVoice: { id: string; updatedAt: Date; tone: string; style: string; personality: string; sentenceStructure: string; vocabulary: string[]; avoidVocabulary: string[]; examples: string[] } | null = null;
    if (brandVoiceId) {
      brandVoice = await prisma.brandVoice.findUnique({
        where: { id: brandVoiceId, userId },
      });
    } else {
      brandVoice = await getActiveBrandVoice(userId);
    }

    try {
      const existingOutput = await prisma.output.findUnique({
        where: { projectId_platform_seriesIndex: { projectId, platform, seriesIndex } },
      });
      if (existingOutput && existingOutput.content.trim()) {
        await prisma.outputVersion.create({
          data: {
            outputId: existingOutput.id,
            content: existingOutput.content,
            generationMetadata: existingOutput.generationMetadata as object | undefined,
          },
        });
      }

      let previousPostsSummary = "";
      if (seriesIndex > 1) {
        const previousOutputs = await prisma.output.findMany({
          where: { projectId, platform, seriesIndex: { lt: seriesIndex } },
          orderBy: { seriesIndex: "asc" },
          select: { content: true, seriesIndex: true },
        });
        previousPostsSummary = previousOutputs
          .map((o) => `Post ${o.seriesIndex}: ${o.content.slice(0, 220).trim()}${o.content.length > 220 ? "..." : ""}`)
          .join("\n\n");
      }

      const systemPrompt = getPlatformSystemPrompt(platform);
      const userTemplate = getPlatformUserTemplate(platform);
      let userMessage = formatPrompt(userTemplate, {
        sourceContent,
        brandVoice: serializeBrandVoiceForPrompt(brandVoice),
      });
      if (seriesTotal > 1) {
        const seriesContext = getSeriesContext(seriesIndex, seriesTotal);
        userMessage = seriesContext + "\n\n" + userMessage;
      }
      if (previousPostsSummary) {
        userMessage =
          "PREVIOUS POSTS IN THIS SERIES:\n" +
          previousPostsSummary +
          "\n\nYour post should build on these without repeating them.\n\n" +
          userMessage;
      }

      const cacheKey = buildGenerationCacheKey({
        userId,
        projectId,
        step: "regenerate",
        model,
        platform,
        inputHash: generateCacheKey(sourceContent),
        optionsHash: generateCacheKey(JSON.stringify(options ?? {})),
        brandVoiceId: brandVoice?.id ?? null,
        brandVoiceUpdatedAt: brandVoice?.updatedAt ? brandVoice.updatedAt.toISOString() : null,
        seriesIndex,
        seriesTotal,
      });

      const startMs = Date.now();
      const generationResult = await generateContentWithGracefulDegradation(
        userMessage,
        systemPrompt,
        { ...options, model, temperature, maxTokens },
        3,
        cacheKey,
        CACHE_TTL.OUTPUTS_SECONDS
      );
      const latencyMs = Date.now() - startMs;

      const metadata = {
        model,
        temperature,
        maxTokens,
        timestamp: new Date().toISOString(),
        success: true,
        source: generationResult.source,
        brandVoiceId: brandVoice?.id,
        latencyMs,
        tokensUsed: null as number | null,
        costEstimate: null as number | null,
        seed: null as number | null,
      };

      const output = await prisma.output.upsert({
        where: {
          projectId_platform_seriesIndex: { projectId, platform, seriesIndex },
        },
        update: {
          content: generationResult.content,
          isEdited: false,
          generationMetadata: metadata as object,
        },
        create: {
          projectId,
          platform,
          seriesIndex,
          content: generationResult.content,
          generationMetadata: metadata as object,
        },
      });

      const result: GenerationResult = {
        platform,
        seriesIndex,
        outputId: output.id,
        content: generationResult.content,
        success: true,
        metadata: {
          model,
          temperature,
          maxTokens,
          timestamp: new Date(),
          success: true,
          source: generationResult.source,
          brandVoiceId: brandVoice?.id,
          latencyMs,
        },
      };

      Logger.info("Content regenerated successfully", {
        userId,
        projectId,
        platform,
        seriesIndex,
        brandVoiceId: brandVoice?.id,
      });

      return result;
    } catch (error) {
      Logger.error("Error regenerating content for platform", error as Error, {
        userId,
        projectId,
        platform,
        seriesIndex,
      });

      const result: GenerationResult = {
        platform,
        seriesIndex,
        content: "",
        success: false,
        metadata: {
          model,
          temperature,
          maxTokens,
          timestamp: new Date(),
          success: false,
          errorMessage: error instanceof Error ? error.message : String(error),
          brandVoiceId: brandVoice?.id,
        },
        error: error instanceof Error ? error.message : String(error),
      };

      return result;
    }
  } finally {
    PerformanceMonitor.endMeasurement(operationId);
  }
}

/**
 * Generate multiple variations of content for a single platform
 */
export async function generateContentVariations(
  projectId: string,
  userId: string,
  sourceContent: string,
  platform: Platform,
  variationCount: number = 3,
  options?: GenerationOptions,
  brandVoiceId?: string,
  plan: Plan = "free"
): Promise<GenerationResult[]> {
  const genConfig = getModelConfig(plan).generate;
  const model = options?.model ?? genConfig.defaultModel;
  const baseTemperature = options?.temperature ?? genConfig.temperatureByPlatform[platform];
  const maxTokens = options?.maxTokens ?? genConfig.maxTokensByPlatform[platform];
  const operationId = `generateVariations_${projectId}_${platform}`;

  PerformanceMonitor.startMeasurement(operationId, {
    userId,
    projectId,
    platform,
    variationCount,
    model,
  });

  try {
    const quota = await checkProjectQuota(userId);
    if (!quota.canCreate) {
      throw new Error(`Quota exceeded: ${quota.current}/${quota.limit}`);
    }

    const project = await getProjectById(projectId, userId);
    if (!project) {
      throw new Error("Project not found or access denied");
    }

    let brandVoice: { id: string; updatedAt: Date; tone: string; style: string; personality: string; sentenceStructure: string; vocabulary: string[]; avoidVocabulary: string[]; examples: string[] } | null = null;
    if (brandVoiceId) {
      brandVoice = await prisma.brandVoice.findUnique({
        where: { id: brandVoiceId, userId },
      });
    } else {
      brandVoice = await getActiveBrandVoice(userId);
    }

    const variationStyles = [
      { name: "Professional", description: "Formal and authoritative tone" },
      { name: "Casual", description: "Friendly and conversational tone" },
      { name: "Creative", description: "Playful and imaginative tone" },
      { name: "Direct", description: "Straightforward and to-the-point tone" },
      { name: "Storytelling", description: "Narrative-driven approach" },
    ];

    const results: GenerationResult[] = [];
    const systemPrompt = getPlatformSystemPrompt(platform);
    const userTemplate = getPlatformUserTemplate(platform);
    const baseUserMessage = formatPrompt(userTemplate, {
      sourceContent,
      brandVoice: serializeBrandVoiceForPrompt(brandVoice),
    });
    const optionsHash = generateCacheKey(JSON.stringify(options ?? {}));

    for (let i = 0; i < Math.min(variationCount, variationStyles.length); i++) {
      const style = variationStyles[i];
      const variationOperationId = `${operationId}_variation_${i}`;

      PerformanceMonitor.startMeasurement(variationOperationId, {
        userId,
        projectId,
        platform,
        style: style.name,
      });

      try {
        const variationInstruction = `\n\nIMPORTANT: Generate this content in a ${style.name.toLowerCase()} style. ${style.description}.`;
        const userMessage = baseUserMessage + variationInstruction;

        const cacheKey = buildGenerationCacheKey({
          userId,
          projectId,
          step: `variation_${i}_${style.name}`,
          model,
          platform,
          inputHash: generateCacheKey(userMessage),
          optionsHash,
          brandVoiceId: brandVoice?.id ?? null,
          brandVoiceUpdatedAt: brandVoice?.updatedAt ? brandVoice.updatedAt.toISOString() : null,
        });

        const variationTemp = baseTemperature + (i * 0.1);
        const generationResult = await generateContentWithGracefulDegradation(
          userMessage,
          systemPrompt,
          {
            ...options,
            model,
            temperature: variationTemp,
            maxTokens,
          },
          3,
          cacheKey,
          CACHE_TTL.OUTPUTS_SECONDS
        );

        // Sanitize content
        const sanitizedContent = sanitizeContent(generationResult.content);

        // Validate content for the specific platform
        const validation = validatePlatformContent(sanitizedContent, platform);

        const metadata = {
          model,
          temperature: variationTemp,
          maxTokens,
          timestamp: new Date().toISOString(),
          success: true,
          validationMessages: validation.messages,
          source: generationResult.source,
          brandVoiceId: brandVoice?.id,
          variationStyle: style.name,
          variationIndex: i,
        };

        // Create a unique output record for this variation
        await prisma.output.create({
          data: {
            projectId,
            platform,
            content: sanitizedContent,
            isEdited: false,
            generationMetadata: metadata as object,
          },
        });

        const result: GenerationResult = {
          platform,
          content: generationResult.content,
          success: true,
          metadata: {
            model,
            temperature: variationTemp,
            maxTokens,
            timestamp: new Date(),
            success: true,
            source: generationResult.source,
            brandVoiceId: brandVoice?.id,
            variationStyle: style.name,
            variationIndex: i,
          },
        };

        results.push(result);
      } catch (error) {
        Logger.error(`Error generating variation ${i} for platform`, error as Error, {
          userId,
          projectId,
          platform,
          variationIndex: i,
        });

        const variationTemp = baseTemperature + (i * 0.1);
        const result: GenerationResult = {
          platform,
          content: "",
          success: false,
          metadata: {
            model,
            temperature: variationTemp,
            maxTokens,
            timestamp: new Date(),
            success: false,
            errorMessage: error instanceof Error ? error.message : String(error),
            brandVoiceId: brandVoice?.id, // Track which brand voice was used
            variationStyle: style.name, // Track the style of this variation
            variationIndex: i, // Track the index of this variation
          },
          error: error instanceof Error ? error.message : String(error),
        };

        results.push(result);
      } finally {
        // End performance monitoring for this variation
        PerformanceMonitor.endMeasurement(variationOperationId);
      }
    }

    Logger.info("Content variations generated successfully", {
      userId,
      projectId,
      platform,
      variationCount: results.length,
    });

    return results;
  } finally {
    // End overall performance monitoring
    PerformanceMonitor.endMeasurement(operationId);
  }
}