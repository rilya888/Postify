import { randomUUID } from "crypto";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api-error";
import { createProjectSchema, validatePostToneForPlan } from "@/lib/validations/project";
import { checkProjectQuota } from "@/lib/services/quota";
import { logProjectChange } from "@/lib/services/project-history";
import { checkProjectsRateLimit, checkGenerateRateLimit } from "@/lib/utils/rate-limit";
import { Logger } from "@/lib/utils/logger";
import {
  getEffectivePlan,
  PLAN_LIMITS,
  getPlanCapabilities,
} from "@/lib/constants/plans";
import { generateForPlatforms, type GenerationSlot } from "@/lib/services/ai";
import type { Platform } from "@/lib/constants/platforms";
import type { BulkGenerationResult, GenerationResult } from "@/types/ai";

const createAndGenerateSchema = createProjectSchema.refine(
  (data) => typeof data.sourceContent === "string" && data.sourceContent.trim().length >= 10,
  {
    message: "Content must be at least 10 characters",
    path: ["sourceContent"],
  }
);

type ProjectWithPostsConfig = {
  postsPerPlatform?: number | null;
  postsPerPlatformByPlatform?: Record<string, number> | null;
};

function buildSlotsFromProject(
  project: ProjectWithPostsConfig,
  targetPlatforms: string[]
): GenerationSlot[] {
  const byPlatform = project.postsPerPlatformByPlatform;
  const useByPlatform =
    byPlatform &&
    typeof byPlatform === "object" &&
    !Array.isArray(byPlatform) &&
    Object.keys(byPlatform).length > 0;
  const fallback = project.postsPerPlatform ?? 1;
  const getCount = (platform: string): number => {
    if (useByPlatform && platform in byPlatform!) {
      const value = byPlatform![platform];
      return value >= 1 && value <= 3 ? value : 1;
    }
    return fallback;
  };

  const slots: GenerationSlot[] = [];
  for (const platform of targetPlatforms) {
    const count = getCount(platform);
    for (let i = 1; i <= count; i++) {
      slots.push({ platform: platform as Platform, seriesIndex: i });
    }
  }

  slots.sort((a, b) => a.seriesIndex - b.seriesIndex || a.platform.localeCompare(b.platform));
  return slots;
}

function buildFailedResultsFromError(
  slots: GenerationSlot[],
  errorMessage: string
): GenerationResult[] {
  const now = new Date().toISOString();
  return slots.map((slot) => ({
    platform: slot.platform,
    seriesIndex: slot.seriesIndex,
    content: "",
    success: false,
    error: errorMessage,
    metadata: {
      model: "unknown",
      temperature: 0,
      maxTokens: 0,
      timestamp: now,
      success: false,
      errorMessage,
    },
  }));
}

function pickFirstSuccessfulOutputId(successful: GenerationResult[]): string | null {
  const withOutput = successful.filter((item) => typeof item.outputId === "string" && item.outputId.length > 0);
  if (withOutput.length === 0) return null;
  withOutput.sort((a, b) => {
    const indexA = a.seriesIndex ?? Number.MAX_SAFE_INTEGER;
    const indexB = b.seriesIndex ?? Number.MAX_SAFE_INTEGER;
    if (indexA !== indexB) return indexA - indexB;
    return a.platform.localeCompare(b.platform);
  });
  return withOutput[0].outputId ?? null;
}

export async function POST(request: Request) {
  const requestId = randomUUID();
  const startedAt = Date.now();

  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return createErrorResponse({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);
    }

    const userId = session.user.id;

    const projectRateLimit = checkProjectsRateLimit(userId);
    if (!projectRateLimit.allowed) {
      return createErrorResponse(
        {
          error: "Too many requests",
          details: "Project creation rate limit exceeded. Try again later.",
          code: "PROJECT_RATE_LIMIT",
        },
        429
      );
    }

    const generateRateLimit = checkGenerateRateLimit(userId);
    if (!generateRateLimit.allowed) {
      return createErrorResponse(
        {
          error: "Too many requests",
          details: "Generation rate limit exceeded. Try again later.",
          code: "GENERATE_RATE_LIMIT",
        },
        429
      );
    }

    const quota = await checkProjectQuota(userId);
    if (!quota.canCreate) {
      return createErrorResponse(
        {
          error: "Project limit exceeded",
          code: "QUOTA_EXCEEDED",
          details: {
            current: quota.current,
            limit: quota.limit,
            plan: quota.plan,
          },
        },
        400
      );
    }

    const body = await request.json();
    const validatedData = createAndGenerateSchema.parse(body);

    const [user, subscription] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } }),
      prisma.subscription.findUnique({ where: { userId } }),
    ]);

    const plan = getEffectivePlan(subscription, user?.createdAt ?? null);
    const capabilities = getPlanCapabilities(plan);

    const maxChars = PLAN_LIMITS[plan]?.maxCharactersPerContent ?? PLAN_LIMITS.free.maxCharactersPerContent;
    if (validatedData.sourceContent.length > maxChars) {
      return createErrorResponse(
        {
          error: "Source content exceeds plan limit",
          details: `Maximum ${maxChars} characters allowed for your plan. Current: ${validatedData.sourceContent.length}.`,
          code: "CONTENT_LIMIT_EXCEEDED",
        },
        400
      );
    }

    const byPlatform = validatedData.postsPerPlatformByPlatform;
    const useByPlatform =
      capabilities.canUseSeries &&
      byPlatform &&
      typeof byPlatform === "object" &&
      !Array.isArray(byPlatform) &&
      Object.keys(byPlatform).length > 0;

    const filteredByPlatform =
      useByPlatform && byPlatform
        ? (Object.fromEntries(
            validatedData.platforms
              .filter((platform) => platform in byPlatform)
              .map((platform) => [platform, byPlatform[platform as keyof typeof byPlatform] as number])
          ) as Record<string, number>)
        : undefined;

    const hasFilteredByPlatform = !!filteredByPlatform && Object.keys(filteredByPlatform).length > 0;
    const legacyPostsPerPlatform = !hasFilteredByPlatform
      ? capabilities.canUseSeries && validatedData.postsPerPlatform != null
        ? validatedData.postsPerPlatform
        : 1
      : Math.max(...Object.values(filteredByPlatform!), 1);

    const existingProject = await prisma.project.findFirst({
      where: {
        userId,
        title: validatedData.title,
      },
    });

    if (existingProject) {
      return createErrorResponse(
        { error: "A project with this title already exists", code: "DUPLICATE_TITLE" },
        400
      );
    }

    const finalPostTone = validatePostToneForPlan(validatedData.postTone ?? null, plan);

    const project = await prisma.project.create({
      data: {
        userId,
        title: validatedData.title,
        sourceContent: validatedData.sourceContent,
        platforms: validatedData.platforms,
        postsPerPlatform: legacyPostsPerPlatform === 1 ? null : legacyPostsPerPlatform,
        postsPerPlatformByPlatform: hasFilteredByPlatform ? filteredByPlatform : undefined,
        postTone: finalPostTone,
      },
    });

    await logProjectChange(project.id, userId, "create", {
      title: validatedData.title,
      platforms: validatedData.platforms,
      postsPerPlatform: project.postsPerPlatform ?? undefined,
      postsPerPlatformByPlatform: project.postsPerPlatformByPlatform ?? undefined,
    });

    const slots = buildSlotsFromProject(project as ProjectWithPostsConfig, project.platforms as string[]);

    let generationResult: BulkGenerationResult;
    try {
      generationResult = await generateForPlatforms(
        project.id,
        userId,
        project.sourceContent,
        project.platforms as Platform[],
        undefined,
        undefined,
        requestId,
        plan,
        1,
        slots,
        finalPostTone,
        capabilities.canUseBrandVoice
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Generation failed";
      Logger.error("Create-and-generate generation failed", error as Error, {
        requestId,
        userId,
        projectId: project.id,
      });
      generationResult = {
        successful: [],
        failed: buildFailedResultsFromError(slots, errorMessage),
        totalRequested: slots.length,
      };
    }

    const successfulCount = generationResult.successful.length;
    const failedCount = generationResult.failed.length;

    const status: "success" | "partial" | "failed" =
      successfulCount > 0 && failedCount === 0
        ? "success"
        : successfulCount > 0
          ? "partial"
          : "failed";

    const firstSuccessfulOutputId = pickFirstSuccessfulOutputId(generationResult.successful);

    Logger.info("Create-and-generate completed", {
      requestId,
      userId,
      projectId: project.id,
      plan,
      requestedSlots: generationResult.totalRequested,
      successful: successfulCount,
      failed: failedCount,
      durationMs: Date.now() - startedAt,
      status,
    });

    return createSuccessResponse(
      {
        status,
        code:
          status === "success"
            ? "GENERATION_SUCCESS"
            : status === "partial"
              ? "PARTIAL_GENERATION"
              : "GENERATION_FAILED",
        project: {
          id: project.id,
          title: project.title,
        },
        projectId: project.id,
        firstSuccessfulOutputId,
        ...generationResult,
      },
      201
    );
  } catch (error) {
    Logger.error("Create-and-generate failed", error as Error, { requestId });
    return createErrorResponse(error, error instanceof z.ZodError ? 400 : 500);
  }
}
