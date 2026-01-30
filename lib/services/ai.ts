import { prisma } from "@/lib/db/prisma";
import { Platform } from "@/lib/constants/platforms";
import { GenerationOptions, GenerationResult, BulkGenerationResult } from "@/types/ai";
import { generateContentWithRetry } from "./openai-client";
import { getPlatformPromptTemplate, formatPrompt } from "./prompt-templates";
import { checkProjectQuota } from "../services/quota";
import { Logger } from "@/lib/utils/logger";
import { getProjectById } from "../services/projects";
import { validatePlatformContent, sanitizeContent } from "@/lib/utils/content-validation";

/**
 * Generate content for multiple platforms
 * Integrates with quota system and saves results to database
 */
export async function generateForPlatforms(
  projectId: string,
  userId: string,
  sourceContent: string,
  platforms: Platform[],
  options?: GenerationOptions
): Promise<BulkGenerationResult> {
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

  // Log generation start
  Logger.info("Starting content generation", {
    userId,
    projectId,
    platforms,
  });

  // Prepare results array
  const results: GenerationResult[] = [];

  // Generate content for each platform
  const generationPromises = platforms.map(async (platform) => {
    try {
      // Get the appropriate prompt for the platform
      const promptTemplate = getPlatformPromptTemplate(platform);
      const formattedPrompt = formatPrompt(promptTemplate, { sourceContent });

      // Generate content
      const content = await generateContentWithRetry(
        sourceContent,
        formattedPrompt,
        {
          ...options,
          model: options?.model || "gpt-4-turbo",
        }
      );

      // Sanitize content
      const sanitizedContent = sanitizeContent(content);

      // Validate content for the specific platform
      const validation = validatePlatformContent(sanitizedContent, platform);

      // Save to database
      const output = await prisma.output.create({
        data: {
          projectId,
          platform,
          content: sanitizedContent,
          generationMetadata: {
            model: options?.model || "gpt-4-turbo",
            temperature: options?.temperature || 0.7,
            maxTokens: options?.maxTokens || 2000,
            timestamp: new Date().toISOString(),
            success: true,
            validationMessages: validation.messages,
          },
        },
      });

      const result: GenerationResult = {
        platform,
        content,
        success: true,
        metadata: {
          model: options?.model || "gpt-4-turbo",
          temperature: options?.temperature || 0.7,
          maxTokens: options?.maxTokens || 2000,
          timestamp: new Date(),
          success: true,
        },
      };

      results.push(result);
      return result;
    } catch (error) {
      Logger.error("Error generating content for platform", {
        userId,
        projectId,
        platform,
        error: error instanceof Error ? error.message : String(error),
      });

      // Save error to database
      await prisma.output.create({
        data: {
          projectId,
          platform,
          content: "",
          generationMetadata: {
            model: options?.model || "gpt-4-turbo",
            temperature: options?.temperature || 0.7,
            maxTokens: options?.maxTokens || 2000,
            timestamp: new Date().toISOString(),
            success: false,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
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
        },
        error: error instanceof Error ? error.message : String(error),
      };

      results.push(result);
      return result;
    }
  });

  // Wait for all generations to complete
  await Promise.all(generationPromises);

  // Separate successful and failed results
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  // Log generation completion
  Logger.info("Content generation completed", {
    userId,
    projectId,
    successful: successful.length,
    failed: failed.length,
  });

  return {
    successful,
    failed,
    totalRequested: platforms.length,
  };
}

/**
 * Regenerate content for a specific platform
 */
export async function regenerateForPlatform(
  projectId: string,
  userId: string,
  sourceContent: string,
  platform: Platform,
  options?: GenerationOptions
): Promise<GenerationResult> {
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

  try {
    // Get the appropriate prompt for the platform
    const promptTemplate = getPlatformPromptTemplate(platform);
    const formattedPrompt = formatPrompt(promptTemplate, { sourceContent });

    // Generate content
    const content = await generateContentWithRetry(
      sourceContent,
      formattedPrompt,
      {
        ...options,
        model: options?.model || "gpt-4-turbo",
      }
    );

    // Update or create output in database
    const output = await prisma.output.upsert({
      where: {
        projectId_platform: {
          projectId,
          platform,
        },
      },
      update: {
        content,
        isEdited: false, // Reset if it was previously edited
        generationMetadata: {
          model: options?.model || "gpt-4-turbo",
          temperature: options?.temperature || 0.7,
          maxTokens: options?.maxTokens || 2000,
          timestamp: new Date().toISOString(),
          success: true,
        },
      },
      create: {
        projectId,
        platform,
        content,
        generationMetadata: {
          model: options?.model || "gpt-4-turbo",
          temperature: options?.temperature || 0.7,
          maxTokens: options?.maxTokens || 2000,
          timestamp: new Date().toISOString(),
          success: true,
        },
      },
    });

    const result: GenerationResult = {
      platform,
      content,
      success: true,
      metadata: {
        model: options?.model || "gpt-4-turbo",
        temperature: options?.temperature || 0.7,
        maxTokens: options?.maxTokens || 2000,
        timestamp: new Date().toISOString(),
        success: true,
      },
    };

    Logger.info("Content regenerated successfully", {
      userId,
      projectId,
      platform,
    });

    return result;
  } catch (error) {
    Logger.error("Error regenerating content for platform", {
      userId,
      projectId,
      platform,
      error: error instanceof Error ? error.message : String(error),
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
      },
      error: error instanceof Error ? error.message : String(error),
    };

    return result;
  }
}