import { prisma } from "@/lib/db/prisma";
import { Platform } from "@/lib/constants/platforms";
import { GenerationOptions, GenerationResult, BulkGenerationResult } from "@/types/ai";
import { generateContentWithGracefulDegradation } from "@/lib/ai/openai-client";
import { getPlatformPromptTemplate, formatPrompt } from "@/lib/ai/prompt-templates";
import { checkProjectQuota } from "../services/quota";
import { Logger } from "@/lib/utils/logger";
import { getProjectById } from "../services/projects";
import { logProjectChange } from "../services/project-history";
import { validatePlatformContent, sanitizeContent } from "@/lib/utils/content-validation";
import { PerformanceMonitor } from "@/lib/utils/performance";
import { getActiveBrandVoice } from "../services/brand-voice";

/**
 * Incorporate brand voice characteristics into the prompt
 */
function incorporateBrandVoiceIntoPrompt(prompt: string, brandVoice: any | null): string {
  if (!brandVoice) {
    return prompt;
  }

  // Create a brand voice instruction to prepend to the prompt
  const brandVoiceInstruction = `
BRAND VOICE INSTRUCTIONS:
- Tone: ${brandVoice.tone}
- Style: ${brandVoice.style}
- Personality: ${brandVoice.personality}
- Sentence Structure: ${brandVoice.sentenceStructure}
- Preferred Vocabulary: ${brandVoice.vocabulary.join(', ')}
- Vocabulary to Avoid: ${brandVoice.avoidVocabulary.join(', ')}
- Example Content: ${brandVoice.examples.slice(0, 2).join(' | ')}

IMPORTANT: Follow these brand voice characteristics precisely while adapting the content for the specific platform.
`;

  // Insert the brand voice instruction at the beginning of the prompt
  // Find the position after the initial system instructions but before the source content
  const sourceContentIndex = prompt.indexOf('{sourceContent}');
  if (sourceContentIndex !== -1) {
    return prompt.substring(0, sourceContentIndex) + brandVoiceInstruction + prompt.substring(sourceContentIndex);
  } else {
    // If {sourceContent} isn't found, append to the end
    return prompt + '\n\n' + brandVoiceInstruction;
  }
}

/**
 * Generate content for multiple platforms
 * Integrates with quota system and saves results to database
 */
export async function generateForPlatforms(
  projectId: string,
  userId: string,
  sourceContent: string,
  platforms: Platform[],
  options?: GenerationOptions,
  brandVoiceId?: string
): Promise<BulkGenerationResult> {
  const operationId = `generateForPlatforms_${projectId}_${Date.now()}`;

  // Start performance monitoring
  PerformanceMonitor.startMeasurement(operationId, {
    userId,
    projectId,
    platforms: platforms.length,
    model: options?.model || "gpt-4-turbo",
  });

  try {
    // Check user quota before generation
    const quota = await checkProjectQuota(userId);
    if (!quota.canCreate) {
      throw new Error(`Quota exceeded: ${quota.current}/${quota.limit}`);
    }

    // Validate project belongs to user
    const project = await getProjectById(projectId, userId);
    if (!project) {
      throw new Error("Project not found or access denied");
    }

    // Get active brand voice for the user (or specific brand voice if provided)
    let brandVoice = null;
    if (brandVoiceId) {
      brandVoice = await prisma.brandVoice.findUnique({
        where: { id: brandVoiceId, userId }
      });
    } else {
      brandVoice = await getActiveBrandVoice(userId);
    }

    // Log generation start
    Logger.info("Starting content generation", {
      userId,
      projectId,
      platforms,
      brandVoice: brandVoice?.id || null,
    });

    // Prepare results array
    const results: GenerationResult[] = [];

    // Generate content for each platform
    const generationPromises = platforms.map(async (platform) => {
      const platformOperationId = `${operationId}_platform_${platform}`;
      PerformanceMonitor.startMeasurement(platformOperationId, {
        userId,
        projectId,
        platform,
      });

      try {
        // Get the appropriate prompt for the platform
        const promptTemplate = getPlatformPromptTemplate(platform);
        let formattedPrompt = formatPrompt(promptTemplate, { sourceContent });

        // Incorporate brand voice into the prompt if available
        if (brandVoice) {
          formattedPrompt = incorporateBrandVoiceIntoPrompt(formattedPrompt, brandVoice);
        }

        // Generate content with graceful degradation
        const generationResult = await generateContentWithGracefulDegradation(
          sourceContent,
          formattedPrompt,
          {
            ...options,
            model: options?.model || "gpt-4-turbo",
          },
          3, // maxRetries
          `generate_${projectId}_${platform}_${Date.now()}` // cacheKey
        );

        // Sanitize content
        const sanitizedContent = sanitizeContent(generationResult.content);

        // Validate content for the specific platform
        const validation = validatePlatformContent(sanitizedContent, platform);

        const metadata = {
          model: options?.model || "gpt-4-turbo",
          temperature: options?.temperature || 0.7,
          maxTokens: options?.maxTokens || 2000,
          timestamp: new Date().toISOString(),
          success: true,
          validationMessages: validation.messages,
          source: generationResult.source, // Track if content came from API, cache, or template
          brandVoiceId: brandVoice?.id || null, // Track which brand voice was used
        };

        // Upsert to support re-generation and regenerate for same platform
        await prisma.output.upsert({
          where: {
            projectId_platform: { projectId, platform },
          },
          update: {
            content: sanitizedContent,
            isEdited: false,
            generationMetadata: metadata as object,
          },
          create: {
            projectId,
            platform,
            content: sanitizedContent,
            generationMetadata: metadata as object,
          },
        });

        const result: GenerationResult = {
          platform,
          content: generationResult.content,
          success: true,
          metadata: {
            model: options?.model || "gpt-4-turbo",
            temperature: options?.temperature || 0.7,
            maxTokens: options?.maxTokens || 2000,
            timestamp: new Date(),
            success: true,
            source: generationResult.source, // Track if content came from API, cache, or template
            brandVoiceId: brandVoice?.id || null, // Track which brand voice was used
          },
        };

        results.push(result);
        return result;
      } catch (error) {
        Logger.error("Error generating content for platform", error as Error, {
          userId,
          projectId,
          platform,
        });

        const errorMetadata = {
          model: options?.model || "gpt-4-turbo",
          temperature: options?.temperature || 0.7,
          maxTokens: options?.maxTokens || 2000,
          timestamp: new Date().toISOString(),
          success: false,
          errorMessage: error instanceof Error ? error.message : String(error),
          brandVoiceId: brandVoice?.id || null, // Track which brand voice was used
        };

        await prisma.output.upsert({
          where: {
            projectId_platform: { projectId, platform },
          },
          update: {
            content: "",
            generationMetadata: errorMetadata as object,
          },
          create: {
            projectId,
            platform,
            content: "",
            generationMetadata: errorMetadata as object,
          },
        });

        const result: GenerationResult = {
          platform,
          content: "",
          success: false,
          metadata: {
            model: options?.model || "gpt-4-turbo",
            temperature: options?.temperature || 0.7,
            maxTokens: options?.maxTokens || 2000,
            timestamp: new Date(),
            success: false,
            errorMessage: error instanceof Error ? error.message : String(error),
            brandVoiceId: brandVoice?.id || null, // Track which brand voice was used
          },
          error: error instanceof Error ? error.message : String(error),
        };

        results.push(result);
        return result;
      } finally {
        // End performance monitoring for this platform
        PerformanceMonitor.endMeasurement(platformOperationId);
      }
    });

    // Wait for all generations to complete
    await Promise.all(generationPromises);

    // Separate successful and failed results
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    await logProjectChange(projectId, userId, "generate", {
      platforms,
      successful: successful.length,
      failed: failed.length,
      brandVoiceId: brandVoice?.id || null,
    });

    // Log generation completion
    Logger.info("Content generation completed", {
      userId,
      projectId,
      successful: successful.length,
      failed: failed.length,
      brandVoice: brandVoice?.id || null,
    });

    return {
      successful,
      failed,
      totalRequested: platforms.length,
    };
  } finally {
    // End overall performance monitoring
    PerformanceMonitor.endMeasurement(operationId);
  }
}

/**
 * Regenerate content for a specific platform
 */

export async function regenerateForPlatform(
  projectId: string,
  userId: string,
  sourceContent: string,
  platform: Platform,
  options?: GenerationOptions,
  brandVoiceId?: string
): Promise<GenerationResult> {
  const operationId = `regenerateForPlatform_${projectId}_${platform}_${Date.now()}`;

  // Start performance monitoring
  PerformanceMonitor.startMeasurement(operationId, {
    userId,
    projectId,
    platform,
    model: options?.model || "gpt-4-turbo",
  });

  try {
    // Check user quota before regeneration
    const quota = await checkProjectQuota(userId);
    if (!quota.canCreate) {
      throw new Error(`Quota exceeded: ${quota.current}/${quota.limit}`);
    }

    // Validate project belongs to user
    const project = await getProjectById(projectId, userId);
    if (!project) {
      throw new Error("Project not found or access denied");
    }

    // Get active brand voice for the user (or specific brand voice if provided)
    let brandVoice = null;
    if (brandVoiceId) {
      brandVoice = await prisma.brandVoice.findUnique({
        where: { id: brandVoiceId, userId }
      });
    } else {
      brandVoice = await getActiveBrandVoice(userId);
    }

    try {
      // Get the appropriate prompt for the platform
      const promptTemplate = getPlatformPromptTemplate(platform);
      let formattedPrompt = formatPrompt(promptTemplate, { sourceContent });

      // Incorporate brand voice into the prompt if available
      if (brandVoice) {
        formattedPrompt = incorporateBrandVoiceIntoPrompt(formattedPrompt, brandVoice);
      }

      // Generate content with graceful degradation
      const generationResult = await generateContentWithGracefulDegradation(
        sourceContent,
        formattedPrompt,
        {
          ...options,
          model: options?.model || "gpt-4-turbo",
        },
        3, // maxRetries
        `regenerate_${projectId}_${platform}_${Date.now()}` // cacheKey
      );

      // Update or create output in database
      await prisma.output.upsert({
        where: {
          projectId_platform: {
            projectId,
            platform,
          },
        },
        update: {
          content: generationResult.content,
          isEdited: false, // Reset if it was previously edited
          generationMetadata: {
            model: options?.model || "gpt-4-turbo",
            temperature: options?.temperature || 0.7,
            maxTokens: options?.maxTokens || 2000,
            timestamp: new Date().toISOString(),
            success: true,
            source: generationResult.source, // Track if content came from API, cache, or template
            brandVoiceId: brandVoice?.id || null, // Track which brand voice was used
          },
        },
        create: {
          projectId,
          platform,
          content: generationResult.content,
          generationMetadata: {
            model: options?.model || "gpt-4-turbo",
            temperature: options?.temperature || 0.7,
            maxTokens: options?.maxTokens || 2000,
            timestamp: new Date().toISOString(),
            success: true,
            source: generationResult.source, // Track if content came from API, cache, or template
            brandVoiceId: brandVoice?.id || null, // Track which brand voice was used
          },
        },
      });

      const result: GenerationResult = {
        platform,
        content: generationResult.content,
        success: true,
        metadata: {
          model: options?.model || "gpt-4-turbo",
          temperature: options?.temperature || 0.7,
          maxTokens: options?.maxTokens || 2000,
          timestamp: new Date(),
          success: true,
          source: generationResult.source, // Track if content came from API, cache, or template
          brandVoiceId: brandVoice?.id || null, // Track which brand voice was used
        },
      };

      Logger.info("Content regenerated successfully", {
        userId,
        projectId,
        platform,
        brandVoice: brandVoice?.id || null,
      });

      return result;
    } catch (error) {
      Logger.error("Error regenerating content for platform", error as Error, {
        userId,
        projectId,
        platform,
      });

      const result: GenerationResult = {
        platform,
        content: "",
        success: false,
        metadata: {
          model: options?.model || "gpt-4-turbo",
          temperature: options?.temperature || 0.7,
          maxTokens: options?.maxTokens || 2000,
          timestamp: new Date(),
          success: false,
          errorMessage: error instanceof Error ? error.message : String(error),
          brandVoiceId: brandVoice?.id || null, // Track which brand voice was used
        },
        error: error instanceof Error ? error.message : String(error),
      };

      return result;
    }
  } finally {
    // End performance monitoring
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
  brandVoiceId?: string
): Promise<GenerationResult[]> {
  const operationId = `generateVariations_${projectId}_${platform}_${Date.now()}`;

  // Start performance monitoring
  PerformanceMonitor.startMeasurement(operationId, {
    userId,
    projectId,
    platform,
    variationCount,
    model: options?.model || "gpt-4-turbo",
  });

  try {
    // Check user quota before generation
    const quota = await checkProjectQuota(userId);
    if (!quota.canCreate) {
      throw new Error(`Quota exceeded: ${quota.current}/${quota.limit}`);
    }

    // Validate project belongs to user
    const project = await getProjectById(projectId, userId);
    if (!project) {
      throw new Error("Project not found or access denied");
    }

    // Get active brand voice for the user (or specific brand voice if provided)
    let brandVoice = null;
    if (brandVoiceId) {
      brandVoice = await prisma.brandVoice.findUnique({
        where: { id: brandVoiceId, userId }
      });
    } else {
      brandVoice = await getActiveBrandVoice(userId);
    }

    // Define different tones/styles for variations
    const variationStyles = [
      { name: "Professional", description: "Formal and authoritative tone" },
      { name: "Casual", description: "Friendly and conversational tone" },
      { name: "Creative", description: "Playful and imaginative tone" },
      { name: "Direct", description: "Straightforward and to-the-point tone" },
      { name: "Storytelling", description: "Narrative-driven approach" },
    ];

    const results: GenerationResult[] = [];

    // Generate multiple variations
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
        // Get the appropriate prompt for the platform
        const promptTemplate = getPlatformPromptTemplate(platform);
        let formattedPrompt = formatPrompt(promptTemplate, { sourceContent });

        // Incorporate brand voice into the prompt if available
        if (brandVoice) {
          formattedPrompt = incorporateBrandVoiceIntoPrompt(formattedPrompt, brandVoice);
        }

        // Add variation instruction to the prompt
        const variationInstruction = `\n\nIMPORTANT: Generate this content in a ${style.name.toLowerCase()} style. ${style.description}.`;
        const variationPrompt = formattedPrompt + variationInstruction;

        // Generate content with graceful degradation
        const generationResult = await generateContentWithGracefulDegradation(
          sourceContent,
          variationPrompt,
          {
            ...options,
            model: options?.model || "gpt-4-turbo",
            temperature: (options?.temperature || 0.7) + (i * 0.1), // Slightly vary temperature for diversity
          },
          3, // maxRetries
          `variation_${projectId}_${platform}_${i}_${Date.now()}` // cacheKey
        );

        // Sanitize content
        const sanitizedContent = sanitizeContent(generationResult.content);

        // Validate content for the specific platform
        const validation = validatePlatformContent(sanitizedContent, platform);

        const metadata = {
          model: options?.model || "gpt-4-turbo",
          temperature: (options?.temperature || 0.7) + (i * 0.1),
          maxTokens: options?.maxTokens || 2000,
          timestamp: new Date().toISOString(),
          success: true,
          validationMessages: validation.messages,
          source: generationResult.source, // Track if content came from API, cache, or template
          brandVoiceId: brandVoice?.id || null, // Track which brand voice was used
          variationStyle: style.name, // Track the style of this variation
          variationIndex: i, // Track the index of this variation
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
            model: options?.model || "gpt-4-turbo",
            temperature: (options?.temperature || 0.7) + (i * 0.1),
            maxTokens: options?.maxTokens || 2000,
            timestamp: new Date(),
            success: true,
            source: generationResult.source, // Track if content came from API, cache, or template
            brandVoiceId: brandVoice?.id || null, // Track which brand voice was used
            variationStyle: style.name, // Track the style of this variation
            variationIndex: i, // Track the index of this variation
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

        const result: GenerationResult = {
          platform,
          content: "",
          success: false,
          metadata: {
            model: options?.model || "gpt-4-turbo",
            temperature: (options?.temperature || 0.7) + (i * 0.1),
            maxTokens: options?.maxTokens || 2000,
            timestamp: new Date(),
            success: false,
            errorMessage: error instanceof Error ? error.message : String(error),
            brandVoiceId: brandVoice?.id || null, // Track which brand voice was used
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